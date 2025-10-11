import { useState, useEffect, useCallback, useRef } from 'react';
import { authService } from '../lib/auth';
import type { 
  Order, 
  OrderSummary, 
  PlaceOrderRequest, 
  PlaceOrderResponse, 
  CustomerOrdersResponse,
  OrderStatisticsResponse 
} from '../lib/auth';

interface UseOrdersReturn {
  // Customer orders
  orders: Order[];
  ordersPagination: {
    currentPage: number;
    limit: number;
    totalOrders: number;
    totalPages: number;
  } | null;
  isLoadingOrders: boolean;
  ordersError: string | null;
  
  // Order statistics for dashboard
  orderStats: {
    totalOrders: number;
    monthlySpent: number;
    pendingOrders: number;
    lastOrderDate: string | null;
    recentOrders: Array<{
      id: string;
      date: string;
      amount: number;
      status: string;
    }>;
  } | null;
  isLoadingStats: boolean;
  statsError: string | null;
  
  // Methods
  loadOrders: (params?: { page?: number; limit?: number; status?: string }) => Promise<void>;
  placeOrder: (orderData: PlaceOrderRequest) => Promise<PlaceOrderResponse>;
  refreshOrders: () => Promise<void>;
  clearOrdersCache: () => Promise<void>;
}

export const useOrders = (): UseOrdersReturn => {
  // Customer orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersPagination, setOrdersPagination] = useState<{
    currentPage: number;
    limit: number;
    totalOrders: number;
    totalPages: number;
  } | null>(null);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Order statistics state
  const [orderStats, setOrderStats] = useState<{
    totalOrders: number;
    monthlySpent: number;
    pendingOrders: number;
    lastOrderDate: string | null;
    recentOrders: Array<{
      id: string;
      date: string;
      amount: number;
      status: string;
    }>;
  } | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Add refs to prevent multiple concurrent initializations
  const initializingRef = useRef(false);
  const initializedRef = useRef(false);

  // Load customer orders with security validation
  const loadOrders = useCallback(async (params?: { 
    page?: number; 
    limit?: number; 
    status?: string; 
  }) => {
    // Security check: Ensure customer is authenticated
    if (!authService.isAuthenticated('customer')) {
      console.warn('🚨 SECURITY: Cannot load orders - customer not authenticated');
      setOrdersError('Du skal være logget ind for at se ordrer');
      setOrders([]);
      setOrdersPagination(null);
      return;
    }

    try {
      setIsLoadingOrders(true);
      setOrdersError(null);
      
      if (import.meta.env.DEV) {
        console.log('🔄 Loading customer orders with params:', params);
      }
      
      const response = await authService.getMyOrders(params);
      
      if (response.success) {
        setOrders(response.orders || []);
        setOrdersPagination(response.pagination);
        
        if (import.meta.env.DEV) {
          console.log('✅ Orders loaded successfully:', {
            count: response.orders?.length || 0,
            pagination: response.pagination
          });
        }
      } else {
        console.warn('⚠️ Failed to load orders:', response.message);
        setOrdersError(response.message || 'Kunne ikke hente ordrer');
        setOrders([]);
        setOrdersPagination(null);
      }
    } catch (error: any) {
      console.error('❌ Error loading orders:', error);
      
      // Handle specific error types
      if (error.message?.includes('Session expired') || error.message?.includes('Access token')) {
        setOrdersError('Din session er udløbet. Log venligst ind igen.');
      } else if (error.message?.includes('Network')) {
        setOrdersError('Netværksfejl. Tjek din internetforbindelse.');
      } else {
        setOrdersError('Fejl ved indlæsning af ordrer. Prøv igen senere.');
      }
      
      setOrders([]);
      setOrdersPagination(null);
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  // Calculate order statistics from orders data
  const calculateOrderStats = useCallback((allOrders: Order[]) => {
    if (!allOrders || allOrders.length === 0) {
      return {
        totalOrders: 0,
        monthlySpent: 0,
        pendingOrders: 0,
        lastOrderDate: null,
        recentOrders: []
      };
    }

    // Calculate total orders
    const totalOrders = allOrders.length;

    // Calculate monthly spent (current month)
    const currentMonth = new Date();
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthlyOrders = allOrders.filter(order => 
      new Date(order.placedAt) >= monthStart
    );
    const monthlySpent = monthlyOrders.reduce((sum, order) => 
      sum + order.orderTotals.totalAmount, 0
    );

    // Calculate pending orders (not delivered or invoiced)
    const pendingOrders = allOrders.filter(order => 
      !['delivered', 'invoiced'].includes(order.status)
    ).length;

    // Get last order date
    const sortedOrders = [...allOrders].sort((a, b) => 
      new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
    );
    const lastOrderDate = sortedOrders.length > 0 ? sortedOrders[0].placedAt : null;

    // Get recent orders (last 3)
    const recentOrders = sortedOrders.slice(0, 3).map(order => ({
      id: order.orderNumber,
      date: order.placedAt,
      amount: order.orderTotals.totalAmount,
      status: order.status === 'order_placed' ? 'Afgivet' :
              order.status === 'order_confirmed' ? 'Bekræftet' :
              order.status === 'in_transit' ? 'Undervejs' :
              order.status === 'delivered' ? 'Leveret' :
              order.status === 'invoiced' ? 'Faktureret' : 'Ukendt'
    }));

    return {
      totalOrders,
      monthlySpent,
      pendingOrders,
      lastOrderDate,
      recentOrders
    };
  }, []);

  // Load all orders for statistics calculation with security validation
  const loadOrderStats = useCallback(async () => {
    // Security check: Ensure customer is authenticated
    if (!authService.isAuthenticated('customer')) {
      console.warn('🚨 SECURITY: Cannot load order stats - customer not authenticated');
      setStatsError('Du skal være logget ind for at se statistikker');
      setOrderStats(null);
      return;
    }

    try {
      setIsLoadingStats(true);
      setStatsError(null);
      
      if (import.meta.env.DEV) {
        console.log('🔄 Loading order statistics...');
      }
      
      // ⚡ PERFORMANCE: Only get recent orders for stats (not all 1000!)
      const response = await authService.getMyOrders({ 
        page: 1, 
        limit: 50 // ⚡ Only get recent 50 orders instead of 1000 for dashboard stats
      });
      
      if (response.success) {
        const stats = calculateOrderStats(response.orders || []);
        setOrderStats(stats);
        
        if (import.meta.env.DEV) {
          console.log('✅ Order statistics calculated:', {
            totalOrders: stats.totalOrders,
            monthlySpent: stats.monthlySpent,
            pendingOrders: stats.pendingOrders,
            recentOrdersCount: stats.recentOrders.length
          });
        }
      } else {
        console.warn('⚠️ Failed to load order stats:', response.message);
        setStatsError(response.message || 'Kunne ikke hente ordre statistikker');
        setOrderStats(null);
      }
    } catch (error: any) {
      console.error('❌ Error loading order stats:', error);
      
      // Handle specific error types
      if (error.message?.includes('Session expired') || error.message?.includes('Access token')) {
        setStatsError('Din session er udløbet. Log venligst ind igen.');
      } else if (error.message?.includes('Network')) {
        setStatsError('Netværksfejl. Tjek din internetforbindelse.');
      } else {
        setStatsError('Fejl ved indlæsning af statistikker. Prøv igen senere.');
      }
      
      setOrderStats(null);
    } finally {
      setIsLoadingStats(false);
    }
  }, [calculateOrderStats]);

  // Place an order
  const placeOrder = useCallback(async (orderData: PlaceOrderRequest): Promise<PlaceOrderResponse> => {
    try {
      const response = await authService.placeOrder(orderData);
      
      if (response.success) {
        // Refresh orders and stats after successful order placement
        await Promise.all([
          loadOrders({ page: 1, limit: 10 }),
          loadOrderStats()
        ]);
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error placing order:', error);
      throw error;
    }
  }, [loadOrders, loadOrderStats]);

  // Refresh orders
  const refreshOrders = useCallback(async () => {
    await Promise.all([
      loadOrders({ page: ordersPagination?.currentPage || 1, limit: 10 }),
      loadOrderStats()
    ]);
  }, [loadOrders, loadOrderStats, ordersPagination?.currentPage]);

  // Clear orders cache
  const clearOrdersCache = useCallback(async () => {
    await authService.clearOrderCache();
  }, []);

  // Load initial data with proper initialization patterns
  useEffect(() => {
    // Prevent multiple concurrent initializations
    if (initializingRef.current || initializedRef.current) {
      if (import.meta.env.DEV) {
        console.log('🔄 Orders initialization already in progress or completed, skipping...');
      }
      return;
    }

    const isAuthenticated = authService.isAuthenticated('customer');
    if (!isAuthenticated) {
      if (import.meta.env.DEV) {
        console.log('🚨 Customer not authenticated - skipping order data load');
      }
      return;
    }

    initializingRef.current = true;

    const initializeOrderData = async () => {
      try {
        if (import.meta.env.DEV) {
          console.log('🔄 Initializing customer order data...');
        }

        // Load both orders and stats on mount
        await Promise.all([
          loadOrders({ page: 1, limit: 10 }),
          loadOrderStats()
        ]);

        if (import.meta.env.DEV) {
          console.log('✅ Order data initialization complete');
        }
      } catch (error) {
        console.error('❌ Error loading initial order data:', error);
        setOrdersError('Fejl ved indlæsning af ordre data');
        setStatsError('Fejl ved indlæsning af ordre statistikker');
      } finally {
        initializingRef.current = false;
        initializedRef.current = true;
      }
    };

    initializeOrderData();

    // Cleanup function
    return () => {
      if (import.meta.env.DEV) {
        console.log('🧹 Cleaning up order data initialization');
      }
    };
  }, []); // Empty dependency array to run only once

  return {
    // Customer orders
    orders,
    ordersPagination,
    isLoadingOrders,
    ordersError,
    
    // Order statistics
    orderStats,
    isLoadingStats,
    statsError,
    
    // Methods
    loadOrders,
    placeOrder,
    refreshOrders,
    clearOrdersCache
  };
}; 