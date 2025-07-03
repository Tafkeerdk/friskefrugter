import { useState, useEffect } from 'react';
import { authService } from '../lib/auth';
import { toast } from '../hooks/use-toast';
import {
  ShoppingCart,
  DollarSign,
  Users,
  TrendingUp,
  Banknote,
} from "lucide-react";

interface DashboardStat {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<any>;
  trend: {
    value: number;
    isPositive: boolean;
  };
}

interface SalesData {
  name: string;
  sales: number;
  orders: number;
  date?: string;
}

interface PopularProduct {
  id: string;
  name: string;
  image: string;
  sales: number;
  status: "available" | "low" | "out";
}

interface OrderStatus {
  status: string;
  count: number;
  variant: "default" | "outline" | "secondary" | "destructive";
}

interface RecentActivity {
  id: string;
  type: "order" | "payment" | "shipping" | "delivery";
  title: string;
  description: string;
  time: string;
  amount?: number;
}

interface DashboardStatistics {
  dashboardStats: DashboardStat[];
  salesChartData: SalesData[];
  popularProducts: PopularProduct[];
  orderStatuses: OrderStatus[];
  recentActivities: RecentActivity[];
}

// Icon mapping for dashboard stats (using Danish-appropriate icons)
const iconMapping = {
  'ShoppingCart': ShoppingCart,
  'DollarSign': Banknote, // Use Banknote icon for Danish currency
  'Users': Users,
  'TrendingUp': TrendingUp,
};

export const useDashboardStatistics = () => {
  const [statistics, setStatistics] = useState<DashboardStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authService.getDashboardStatistics();
      
      if (response.success && response.statistics) {
        // Map icons to actual components
        const mappedStats = response.statistics.dashboardStats.map(stat => ({
          ...stat,
          icon: iconMapping[stat.icon as keyof typeof iconMapping] || ShoppingCart
        }));
        
        // Map and format data to match component expectations
        const mappedPopularProducts: PopularProduct[] = response.statistics.popularProducts.map(product => ({
          ...product,
          status: (product.status as "available" | "low" | "out") || "available"
        }));

        const mappedOrderStatuses: OrderStatus[] = response.statistics.orderStatuses.map(orderStatus => ({
          ...orderStatus,
          variant: (orderStatus.variant as "default" | "outline" | "secondary" | "destructive") || "outline"
        }));

        const mappedRecentActivities: RecentActivity[] = response.statistics.recentActivities.map(activity => ({
          ...activity,
          type: (activity.type as "order" | "payment" | "shipping" | "delivery") || "order"
        }));

        setStatistics({
          dashboardStats: mappedStats,
          salesChartData: response.statistics.salesChartData,
          popularProducts: mappedPopularProducts,
          orderStatuses: mappedOrderStatuses,
          recentActivities: mappedRecentActivities
        });
      } else {
        throw new Error(response.message || 'Kunne ikke hente dashboard statistikker');
      }
    } catch (error: any) {
      console.error('Error fetching dashboard statistics:', error);
      setError(error.message || 'Fejl ved indlæsning af statistikker');
      
      // Provide fallback data to prevent UI crashes (for new systems)
      setStatistics({
        dashboardStats: [
          {
            title: "Dagens ordrer",
            value: "0",
            description: "Ordrer modtaget i dag",
            icon: ShoppingCart,
            trend: { value: 0, isPositive: true },
          },
          {
            title: "Ugens omsætning",
            value: "0 kr",
            description: "Samlet salg denne uge",
            icon: Banknote, // Use Banknote for Danish currency
            trend: { value: 0, isPositive: true },
          },
          {
            title: "Nye kunder",
            value: "0",
            description: "Nye kunder denne uge",
            icon: Users,
            trend: { value: 0, isPositive: true },
          },
          {
            title: "Vækst i salg",
            value: "0%",
            description: "Nyt system - ingen sammenligning endnu",
            icon: TrendingUp,
            trend: { value: 0, isPositive: true },
          },
        ],
        salesChartData: [],
        popularProducts: [
          {
            id: "fallback-1",
            name: "System indlæser data...",
            image: "/placeholder.svg",
            sales: 0,
            status: "available" as const,
          },
          {
            id: "fallback-2",
            name: "Populære produkter vises snart",
            image: "/placeholder.svg", 
            sales: 0,
            status: "available" as const,
          }
        ],
        orderStatuses: [],
        recentActivities: []
      });
      
      // Don't show toast for initial loading - only for actual errors
      if (!error.message?.includes('getDashboardStatistics')) {
        toast({
          title: "Information",
          description: "Dashboard data indlæses stadig. Prøv at opdatere siden om et øjeblik.",
          variant: "default",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  const refetch = async () => {
    await fetchStatistics();
  };

  return {
    statistics,
    loading,
    error,
    refetch
  };
}; 