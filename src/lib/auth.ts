// Authentication utilities for the frontend

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.DEV ? 'http://localhost:3001' : 'https://famous-dragon-b033ac.netlify.app');

console.log('🌐 API Base URL:', API_BASE_URL);
console.log('🔧 Environment mode:', import.meta.env.DEV ? 'development' : 'production');

// Helper function to get the correct endpoint based on environment
const getEndpoint = (path: string): string => {
  // Parse URL to separate path from query string
  const url = new URL(path, 'http://localhost'); // dummy base URL for parsing
  const pathOnly = url.pathname;
  const queryString = url.search; // includes the '?' if there are params
  
  // In development, use Express routes
  if (import.meta.env.DEV) {
    return path;
  }
  
  // In production, use Netlify function paths for specific endpoints
  // but preserve query string parameters
  if (pathOnly.startsWith('/api/auth/admin/super')) {
    return `/.netlify/functions/admin-login${queryString}`;
  }
  if (pathOnly.startsWith('/api/auth/admin/profile')) {
    return `/.netlify/functions/admin-profile${queryString}`;
  }
  if (pathOnly.startsWith('/api/auth/admin/verification')) {
    return `/.netlify/functions/admin-verification${queryString}`;
  }
  if (pathOnly.startsWith('/api/auth/admin/applications')) {
    return `/.netlify/functions/admin-applications${queryString}`;
  }
  if (pathOnly.startsWith('/api/auth/refresh')) {
    return `/.netlify/functions/token-refresh${queryString}`;
  }
  if (pathOnly.startsWith('/api/auth/customer/profile')) {
    return `/.netlify/functions/customer-profile${queryString}`;
  }
  if (pathOnly.startsWith('/api/auth/customer/apply')) {
    return `/.netlify/functions/customer-application-create${queryString}`;
  }
  if (pathOnly.startsWith('/api/auth/customer/login')) {
    return `/.netlify/functions/customer-login${queryString}`;
  }
  if (pathOnly.startsWith('/api/auth/customer/verification')) {
    return `/.netlify/functions/customer-verification${queryString}`;
  }
  if (pathOnly.startsWith('/api/auth/customer/password-reset-request')) {
    return `/.netlify/functions/customer-password-reset-request${queryString}`;
  }
  if (pathOnly.startsWith('/api/auth/customer/password-reset-verify')) {
    return `/.netlify/functions/customer-password-reset-verify${queryString}`;
  }
  if (pathOnly.startsWith('/api/auth/customer/unique-offers')) {
    return `/.netlify/functions/customer-unique-offers${queryString}`;
  }
  if (pathOnly.startsWith('/api/auth/customer/orders')) {
    return `/.netlify/functions/customer-orders${queryString}`;
  }
  if (pathOnly.startsWith('/api/auth/customer/cart')) {
    return `/.netlify/functions/customer-cart${queryString}`;
  }
  
  // Admin-specific endpoints for notifications and contacts
  if (pathOnly.startsWith('/api/auth/admin/notifications')) {
    return `/.netlify/functions/admin-notifications${queryString}`;
  }
  if (pathOnly.startsWith('/api/auth/admin/contacts')) {
    return `/.netlify/functions/admin-contacts${queryString}`;
  }
  if (pathOnly.startsWith('/api/auth/admin/discount-groups')) {
    return `/.netlify/functions/admin-discount-groups${queryString}`;
  }
  if (pathOnly.startsWith('/api/auth/admin/customers')) {
    return `/.netlify/functions/admin-customers${queryString}`;
  }
  if (pathOnly.startsWith('/api/auth/admin/unique-offers')) {
    return `/.netlify/functions/admin-unique-offers${queryString}`;
  }
  if (pathOnly.startsWith('/api/auth/admin/orders')) {
    return `/.netlify/functions/admin-orders${queryString}`;
  }
  if (pathOnly.startsWith('/api/auth/admin/customer-carts')) {
    return `/.netlify/functions/admin-customer-carts${queryString}`;
  }
  if (pathOnly.startsWith('/api/auth/admin/statistics-detailed')) {
    return `/.netlify/functions/admin-statistics-detailed${queryString}`;
  }
  if (pathOnly.startsWith('/api/auth/admin/statistics')) {
    return `/.netlify/functions/admin-statistics${queryString}`;
  }
  
  // Admin order management endpoints
  if (pathOnly.startsWith('/admin-order-status-update')) {
    return `/.netlify/functions/admin-order-status-update${queryString}`;
  }
  if (pathOnly.startsWith('/admin-order-rejection')) {
    return `/.netlify/functions/admin-order-rejection${queryString}`;
  }
  if (pathOnly.startsWith('/admin-order-delivery-update')) {
    return `/.netlify/functions/admin-order-delivery-update${queryString}`;
  }
  
  // Visitor tracking endpoint
  if (pathOnly.startsWith('/visitor-tracking')) {
    return `/.netlify/functions/visitor-tracking${queryString}`;
  }
  
  // Admin-specific product endpoints with enhanced filtering
  if (pathOnly.startsWith('/api/admin/products')) {
    return `/.netlify/functions/admin-products${queryString}`;
  }
  
  // Product and Unit endpoints - route to specific functions for better auth handling
  if (pathOnly.startsWith('/api/products')) {
    return `/.netlify/functions/products${queryString}`;
  }
  if (pathOnly.startsWith('/api/units')) {
    return `/.netlify/functions/units${queryString}`;
  }
  if (pathOnly.startsWith('/api/categories')) {
    // Preserve the full path after /api/categories for proper routing
    const categoryPath = pathOnly.replace('/api/categories', '');
    return `/.netlify/functions/categories${categoryPath}${queryString}`;
  }
  
  // For other routes, use the main API function
  return path;
};

export interface User {
  id: string;
  email: string;
  userType: 'customer' | 'admin';
  companyName?: string;
  contactPersonName?: string;
  discountGroup?: {
    id?: string;
    name: string;
    discountPercentage: number;
    color?: string;
  } | string; // Support both object and string for backward compatibility
  name?: string;
  role?: string;
  profilePictureUrl?: string;
  isActive?: boolean;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
  // Customer-specific fields
  cvrNumber?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  deliveryAddress?: {
    street?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  useRegisteredAddressForDelivery?: boolean;
  discountGroupId?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user: User;
  tokens: AuthTokens;
}

export interface CustomerApplicationData {
  companyName: string;
  cvrNumber: string;
  contactPersonName: string;
  email: string;
  phone: string;
  address?: {
    street?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  deliveryAddress?: {
    street?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  useRegisteredAddressForDelivery?: boolean;
  password: string;
}

export interface ApplicationsResponse {
  success: boolean;
  applications: unknown[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  statistics?: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}

export interface ApplicationResponse {
  success: boolean;
  message: string;
  emailSent?: boolean;
  emailError?: string;
}

// Cart interfaces
export interface CartItem {
  _id: string;
  product: {
    _id: string;
    produktnavn: string;
    varenummer: string;
    basispris: number;
    billeder: any[];
    enhed: any;
    kategori: any;
  };
  quantity: number;
  customerPricing: {
    price: number;
    originalPrice: number;
    discountType: string;
    discountLabel: string | null;
    discountPercentage: number;
    showStrikethrough: boolean;
    offerDetails?: any;
    saleDetails?: any;
    groupDetails?: any;
  };
  itemTotal: number;
  itemOriginalTotal: number;
  itemSavings: number;
  addedAt: string;
  updatedAt: string;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  totalOriginalPrice: number;
  totalSavings: number;
  updatedAt?: string;
}

export interface CartResponse {
  success: boolean;
  cart: Cart;
  message?: string;
}

export interface CustomerCartSummary {
  id: string;
  customer: {
    id: string;
    companyName: string;
    contactPersonName: string;
    email: string;
    discountGroup: any;
  };
  totalItems: number;
  updatedAt: string;
}

export interface AdminCartResponse {
  success: boolean;
  customer?: {
    id: string;
    companyName: string;
    contactPersonName: string;
    email: string;
    discountGroup: any;
  };
  cart?: Cart;
  carts?: CustomerCartSummary[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
  };
  message?: string;
}

// Order interfaces
export interface OrderItem {
  _id: string;
  product: {
    _id: string;
    produktnavn: string;
    varenummer: string;
    billeder: any[];
  };
  quantity: number;
  staticPricing: {
    price: number;
    originalPrice: number;
    discountType: string;
    discountLabel: string | null;
    discountPercentage: number;
    discountAmount: number;
  };
  productSnapshot: {
    produktnavn: string;
    varenummer: string;
    enhed?: {
      value: string;
      label: string;
      description: string;
    };
    kategori?: {
      navn: string;
      beskrivelse: string;
      slug: string;
    };
  };
  itemTotal: number;
  itemOriginalTotal: number;
  itemSavings: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customer: {
    _id: string;
    companyName: string;
    email: string;
    contactPersonName: string;
  };
  items: OrderItem[];
  orderTotals: {
    totalItems: number;
    subtotal: number;
    totalSavings: number;
    totalAmount: number;
  };
  status: 'order_placed' | 'order_confirmed' | 'in_transit' | 'delivered' | 'invoiced';
  statusHistory: Array<{
    status: string;
    timestamp: string;
    updatedBy?: {
      _id: string;
      navn: string;
      email: string;
    };
    notes?: string;
  }>;
  delivery: {
    expectedDelivery?: string;
    deliveredAt?: string;
    deliveryTimeSlot?: string;
    deliveryDateType?: string;
    isManuallySet?: boolean;
    setBy?: string;
    setAt?: string;
    estimatedRange?: {
      earliest: string;
      latest: string;
      updatedAt: string;
    };
    deliveryAddress?: {
      street: string;
      city: string;
      postalCode: string;
      country: string;
    };
    deliveryInstructions?: string;
    courierInfo?: {
      company?: string;
      trackingNumber?: string;
      trackingUrl?: string;
    };
  };
  invoice: {
    isInvoiced: boolean;
    invoicedAt?: string;
    invoicedBy?: string;
    invoiceNumber?: string;
    invoiceUrl?: string;
    economicData?: {
      invoiceId?: string;
      customerNumber?: string;
      paymentTerms?: number;
      dueDate?: string;
    };
  };
  customerSnapshot: {
    companyName: string;
    contactPersonName: string;
    email: string;
    phone?: string;
    cvrNumber?: string;
    discountGroup?: {
      name: string;
      discountPercentage: number;
      color: string;
    };
    billingAddress?: {
      street: string;
      city: string;
      postalCode: string;
      country: string;
    };
  };
  orderNotes?: string;
  internalNotes?: string;
  emailConfirmation: {
    sent: boolean;
    sentAt?: string;
    emailAddress?: string;
    emailId?: string;
  };
  placedAt: string;
  updatedAt: string;
}

export interface OrderSummary {
  _id: string;
  orderNumber: string;
  customer: {
    companyName: string;
    email: string;
    contactPersonName: string;
  };
  status: string;
  statusDisplay: string;
  statusVariant: string;
  totalAmount: number;
  placedAt: string;
  delivery?: {
    expectedDelivery?: string;
    deliveredAt?: string;
    deliveryTimeSlot?: string;
    isManuallySet?: boolean;
    setBy?: string;
    setAt?: string;
    estimatedRange?: {
      earliest: string;
      latest: string;
      updatedAt: string;
    };
  };
  isInvoiced: boolean;
  invoiceNumber?: string;
  lastUpdated?: string;
  rejectionReason?: string;
  rejectedAt?: string;
}

export interface OrderStatistics {
  statuses: Array<{
    status: string;
    count: number;
    variant: string;
    totalAmount: number;
  }>;
  totalOrders: number;
  totalRevenue: number;
  recentOrders: Array<{
    orderNumber: string;
    customer: {
      companyName: string;
      email: string;
      contactPersonName: string;
    };
    status: string;
    amount: number;
    placedAt: string;
  }>;
}

export interface OrdersResponse {
  success: boolean;
  orders: OrderSummary[];
  pagination: {
    currentPage: number;
    limit: number;
    totalOrders: number;
    totalPages: number;
  };
  message?: string;
}

export interface OrderResponse {
  success: boolean;
  order?: Order;
  message?: string;
}

export interface OrderStatisticsResponse {
  success: boolean;
  statistics: OrderStatistics;
  message?: string;
}

export interface PlaceOrderRequest {
  orderNotes?: string;
  deliveryAddress?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  deliveryInstructions?: string;
}

export interface PlaceOrderResponse {
  success: boolean;
  message: string;
  order: {
    orderNumber: string;
    status: string;
    totalAmount: number;
    placedAt: string;
  };
}

export interface CustomerOrdersResponse {
  success: boolean;
  orders: Order[];
  pagination: {
    currentPage: number;
    limit: number;
    totalOrders: number;
    totalPages: number;
  };
  message?: string;
}

// Session management utilities
export const getDeviceFingerprint = (): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
  }
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL()
  ].join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(16);
};

export const isPWAMode = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true ||
         document.referrer.includes('android-app://');
};

export const getSessionType = (): 'browser' | 'pwa' => {
  return isPWAMode() ? 'pwa' : 'browser';
};

// Request cache for deduplication
class RequestCache {
  private cache = new Map<string, Promise<any>>();
  private results = new Map<string, { data: any; timestamp: number; ttl: number }>();

  getCacheKey(url: string, options: RequestInit = {}): string {
    const method = options.method || 'GET';
    const body = options.body || '';
    return `${method}:${url}:${typeof body === 'string' ? body : JSON.stringify(body)}`;
  }

  get(key: string): any | null {
    const cached = this.results.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      console.log('🎯 Cache HIT:', key);
      return cached.data;
    }
    if (cached) {
      this.results.delete(key);
    }
    return null;
  }

  set(key: string, data: any, ttl: number = 60000): void {
    this.results.set(key, { data, timestamp: Date.now(), ttl });
  }

  getOrSetPromise<T>(key: string, promiseFactory: () => Promise<T>): Promise<T> {
    if (this.cache.has(key)) {
      console.log('🔄 Request deduplication:', key);
      return this.cache.get(key);
    }

    const promise = promiseFactory().finally(() => {
      this.cache.delete(key);
    });
    
    this.cache.set(key, promise);
    return promise;
  }

  clear(): void {
    this.cache.clear();
    this.results.clear();
  }

  clearPattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const [key] of this.results) {
      if (regex.test(key)) {
        this.results.delete(key);
      }
    }
  }
}

const requestCache = new RequestCache();

// Separate token management for admin and customer
class TokenManager {
  private userType: 'admin' | 'customer' | null = null;

  private getStorageKey(key: string): string {
    const userType = this.getCurrentUserType();
    return userType ? `${userType}_${key}` : key;
  }

  private getCurrentUserType(): 'admin' | 'customer' | null {
    // Try to determine user type from stored user data
    const adminUser = localStorage.getItem('admin_user');
    const customerUser = localStorage.getItem('customer_user');
    
    if (adminUser) return 'admin';
    if (customerUser) return 'customer';
    
    return this.userType;
  }

  setUserType(userType: 'admin' | 'customer'): void {
    this.userType = userType;
  }

  getAccessToken(userType?: 'admin' | 'customer'): string | null {
    if (userType) {
      return localStorage.getItem(`${userType}_accessToken`);
    }
    return localStorage.getItem(this.getStorageKey('accessToken'));
  }

  getRefreshToken(userType?: 'admin' | 'customer'): string | null {
    if (userType) {
      return localStorage.getItem(`${userType}_refreshToken`);
    }
    return localStorage.getItem(this.getStorageKey('refreshToken'));
  }

  setTokens(tokens: AuthTokens, userType?: 'admin' | 'customer'): void {
    const type = userType || this.userType;
    if (type) {
      localStorage.setItem(`${type}_accessToken`, tokens.accessToken);
      localStorage.setItem(`${type}_refreshToken`, tokens.refreshToken);
    } else {
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
    }
  }

  clearTokens(userType?: 'admin' | 'customer'): void {
    if (userType) {
      localStorage.removeItem(`${userType}_accessToken`);
      localStorage.removeItem(`${userType}_refreshToken`);
      localStorage.removeItem(`${userType}_user`);
    } else {
      const type = this.getCurrentUserType();
      if (type) {
        localStorage.removeItem(`${type}_accessToken`);
        localStorage.removeItem(`${type}_refreshToken`);
        localStorage.removeItem(`${type}_user`);
      } else {
        // Fallback - clear all
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('admin_accessToken');
        localStorage.removeItem('admin_refreshToken');
        localStorage.removeItem('admin_user');
        localStorage.removeItem('customer_accessToken');
        localStorage.removeItem('customer_refreshToken');
        localStorage.removeItem('customer_user');
      }
    }
    requestCache.clear(); // Clear cache on logout
  }

  getUser(userType?: 'admin' | 'customer'): User | null {
    let userStr: string | null;
    
    if (userType) {
      userStr = localStorage.getItem(`${userType}_user`);
    } else {
      userStr = localStorage.getItem(this.getStorageKey('user'));
    }
    
    return userStr ? JSON.parse(userStr) : null;
  }

  setUser(user: User, userType?: 'admin' | 'customer'): void {
    const type = userType || user.userType;
    const existingUser = this.getUser(type);
    
    // Debug logging for profile picture changes
    if (existingUser && existingUser.profilePictureUrl !== user.profilePictureUrl) {
      console.log('🖼️ Profile picture URL changed:', {
        from: existingUser.profilePictureUrl || 'none',
        to: user.profilePictureUrl || 'none',
        userId: user.id,
        userType: type,
        timestamp: new Date().toISOString()
      });
    } else if (!existingUser && user.profilePictureUrl) {
      console.log('🖼️ Initial profile picture set:', {
        profilePictureUrl: user.profilePictureUrl,
        userId: user.id,
        userType: type,
        timestamp: new Date().toISOString()
      });
    }
    
    if (type) {
      localStorage.setItem(`${type}_user`, JSON.stringify(user));
    } else {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  // Check if specific user type is authenticated
  isAuthenticated(userType?: 'admin' | 'customer'): boolean {
    return !!this.getAccessToken(userType);
  }

  // Get current active user (prefer admin if both are logged in)
  getCurrentUser(): User | null {
    const adminUser = this.getUser('admin');
    const customerUser = this.getUser('customer');
    
    // Prefer admin user if both are logged in
    return adminUser || customerUser;
  }

  // Get current session type based on current route
  getCurrentSessionType(): 'admin' | 'customer' | null {
    const path = window.location.pathname;
    
    if (path.includes('/admin') || path.includes('/super')) {
      return 'admin';
    } else if (path.includes('/dashboard') && !path.includes('/admin')) {
      return 'customer';
    }
    
    // Default to admin if both are logged in
    if (this.isAuthenticated('admin')) return 'admin';
    if (this.isAuthenticated('customer')) return 'customer';
    
    return null;
  }
}

export const tokenManager = new TokenManager();

// Performance monitoring
class PerformanceTracker {
  trackApiCall(url: string, method: string = 'GET') {
    const startTime = performance.now();
    return {
      end: (success: boolean = true) => {
        const duration = performance.now() - startTime;
        console.log(`📊 API ${method} ${url}: ${Math.round(duration)}ms ${success ? '✅' : '❌'}`);
        
        if (duration > 2000) {
          console.warn(`🐌 Slow API call detected: ${method} ${url} took ${Math.round(duration)}ms`);
        }
      }
    };
  }
}

const performanceTracker = new PerformanceTracker();

// API client with automatic token refresh and caching
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async makeRequest(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<Response> {
    const url = `${this.baseURL}${endpoint}`;
    const method = options.method || 'GET';
    const cacheKey = requestCache.getCacheKey(url, options);
    
    // Check cache for GET requests
    if (method === 'GET') {
      const cached = requestCache.get(cacheKey);
      if (cached) {
        return new Response(JSON.stringify(cached), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    const tracker = performanceTracker.trackApiCall(url, method);
    
    // Determine which token to use based on current route/session
    const sessionType = tokenManager.getCurrentSessionType();
    const accessToken = sessionType 
      ? tokenManager.getAccessToken(sessionType)
      : tokenManager.getAccessToken();

    console.log(`🌐 Making API request to: ${url} (session: ${sessionType})`);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    // Add session management headers
    if (isPWAMode()) {
      headers['X-PWA'] = 'true';
      headers['X-Display-Mode'] = 'standalone';
    }
    headers['X-Session-Type'] = getSessionType();

    try {
      // Use request deduplication for concurrent requests
      const response = await requestCache.getOrSetPromise(
        `${method}:${url}:${Date.now()}`, // Include timestamp to avoid caching mutations
        async () => {
          let response = await fetch(url, {
            ...options,
            headers,
          });

          console.log(`📡 Response status: ${response.status} for ${url}`);

          // If token expired or session invalid, try to refresh or logout
          if ((response.status === 401 || response.status === 403) && accessToken) {
            const errorData = await response.clone().json().catch(() => ({}));
            
            if (errorData.errorType === 'session_invalid') {
              console.warn('🚨 Session invalid - forcing logout');
              if (sessionType) {
                tokenManager.clearTokens(sessionType);
              } else {
                tokenManager.clearTokens();
              }
              // Redirect to login
              window.location.href = '/login';
              return response;
            }
            
            if (import.meta.env.DEV) {
              console.log('🔄 Token expired, attempting refresh...');
            }
            const refreshed = await this.refreshToken();
            if (refreshed) {
              // Retry the request with new token
              const newSessionType = tokenManager.getCurrentSessionType();
              const newAccessToken = newSessionType 
                ? tokenManager.getAccessToken(newSessionType)
                : tokenManager.getAccessToken();
              headers.Authorization = `Bearer ${newAccessToken}`;
              
              // Add session headers again for retry
              if (isPWAMode()) {
                headers['X-PWA'] = 'true';
                headers['X-Display-Mode'] = 'standalone';
              }
              headers['X-Session-Type'] = getSessionType();
              
              response = await fetch(url, {
                ...options,
                headers,
              });
              console.log(`📡 Retry response status: ${response.status} for ${url}`);
            } else {
              // Refresh failed - show error but don't redirect automatically
              console.error('🚨 SECURITY: Token refresh failed - session expired');
              // Return the original 401/403 response so the calling code can handle it
              return response;
            }
          }

          return response;
        }
      );

      // Cache successful GET responses
      if (method === 'GET' && response.ok) {
        const data = await response.clone().json();
        const ttl = this.getCacheTTL(endpoint);
        requestCache.set(cacheKey, data, ttl);
      }

      tracker.end(response.ok);
      return response;
    } catch (error) {
      console.error(`❌ Network error for ${url}:`, error);
      tracker.end(false);
      throw error;
    }
  }

  private getCacheTTL(endpoint: string): number {
    // Cache TTL based on endpoint type
    if (endpoint.includes('/applications')) return 30000; // 30 seconds
    if (endpoint.includes('/profile')) return 60000; // 1 minute
    return 15000; // 15 seconds default
  }

  // CRITICAL SECURITY FIX: Enhanced refresh token logic with multi-session support
  private async refreshToken(): Promise<boolean> {
    const sessionType = tokenManager.getCurrentSessionType();
    const refreshToken = sessionType 
      ? tokenManager.getRefreshToken(sessionType)
      : tokenManager.getRefreshToken();
      
    if (!refreshToken) {
      console.warn('🚨 SECURITY: No refresh token available for session type:', sessionType);
      return false;
    }

    // CRITICAL SECURITY FIX: Check if refresh token is expired before attempting refresh
    try {
      const payload = JSON.parse(atob(refreshToken.split('.')[1]));
      const currentTime = Date.now() / 1000;
      if (payload.exp < currentTime) {
        console.error('🚨 SECURITY: Refresh token is expired - cannot refresh', {
          sessionType,
          expiredBy: Math.floor(currentTime - payload.exp) + ' seconds'
        });
        if (sessionType) {
          tokenManager.clearTokens(sessionType);
        } else {
          tokenManager.clearTokens();
        }
        return false;
      }
    } catch (error) {
      console.error('🚨 SECURITY: Error parsing refresh token:', error);
      if (sessionType) {
        tokenManager.clearTokens(sessionType);
      } else {
        tokenManager.clearTokens();
      }
      return false;
    }

    try {
      if (import.meta.env.DEV) {
        console.log('🔄 SECURITY: Attempting token refresh for session type:', sessionType);
      }
      const response = await fetch(`${this.baseURL}${getEndpoint('/api/auth/refresh')}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.tokens) {
          // CRITICAL SECURITY FIX: Validate new tokens before storing
          const { accessToken, refreshToken: newRefreshToken } = data.tokens;
          
          try {
            // Validate access token
            const accessPayload = JSON.parse(atob(accessToken.split('.')[1]));
            const refreshPayload = JSON.parse(atob(newRefreshToken.split('.')[1]));
            const currentTime = Date.now() / 1000;
            
            if (accessPayload.exp < currentTime) {
              console.error('🚨 SECURITY: Server returned expired access token!');
              if (sessionType) {
                tokenManager.clearTokens(sessionType);
              } else {
                tokenManager.clearTokens();
              }
              return false;
            }
            
            if (refreshPayload.exp < currentTime) {
              console.error('🚨 SECURITY: Server returned expired refresh token!');
              if (sessionType) {
                tokenManager.clearTokens(sessionType);
              } else {
                tokenManager.clearTokens();
              }
              return false;
            }
            
            // CRITICAL SECURITY FIX: Store tokens for correct session type
            if (sessionType) {
              tokenManager.setTokens(data.tokens, sessionType);
            } else {
              tokenManager.setTokens(data.tokens);
            }
            
            requestCache.clear(); // Clear cache after token refresh
            if (import.meta.env.DEV) {
              console.log('✅ SECURITY: Token refresh successful for session type:', sessionType);
            }
            return true;
          } catch (tokenError) {
            console.error('🚨 SECURITY: Error validating refreshed tokens:', tokenError);
            if (sessionType) {
              tokenManager.clearTokens(sessionType);
            } else {
              tokenManager.clearTokens();
            }
            return false;
          }
        } else {
          console.error('🚨 SECURITY: Token refresh failed - invalid response');
          if (sessionType) {
            tokenManager.clearTokens(sessionType);
          } else {
            tokenManager.clearTokens();
          }
          return false;
        }
      } else {
        console.error('🚨 SECURITY: Token refresh failed - server error:', response.status);
        if (sessionType) {
          tokenManager.clearTokens(sessionType);
        } else {
          tokenManager.clearTokens();
        }
        return false;
      }
    } catch (error) {
      console.error('🚨 SECURITY: Token refresh failed:', error);
      // If refresh failed, clear tokens for current session
      if (sessionType) {
        tokenManager.clearTokens(sessionType);
      } else {
        tokenManager.clearTokens();
      }
      return false;
    }
  }

  async get(endpoint: string): Promise<Response> {
    return this.makeRequest(endpoint, { method: 'GET' });
  }

  async post(endpoint: string, data?: unknown): Promise<Response> {
    console.log('🔄 ApiClient.post called:', { endpoint, data });
    
    // Clear relevant cache patterns on mutations
    this.invalidateCache(endpoint);
    
    const result = await this.makeRequest(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
    
    console.log('🔄 ApiClient.post result:', { 
      status: result.status, 
      ok: result.ok,
      url: result.url 
    });
    
    return result;
  }

  async put(endpoint: string, data?: unknown): Promise<Response> {
    // Clear relevant cache patterns on mutations
    this.invalidateCache(endpoint);
    return this.makeRequest(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete(endpoint: string, data?: unknown): Promise<Response> {
    // Clear relevant cache patterns on mutations
    this.invalidateCache(endpoint);
    return this.makeRequest(endpoint, { 
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  private invalidateCache(endpoint: string): void {
    if (endpoint.includes('applications')) {
      requestCache.clearPattern('.*applications.*');
    }
    if (endpoint.includes('profile')) {
      requestCache.clearPattern('.*profile.*');
    }
    if (endpoint.includes('discount-groups')) {
      requestCache.clearPattern('.*discount-groups.*');
    }
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// Authentication functions with optimizations
export const authService = {
  // Customer application
  async applyAsCustomer(applicationData: CustomerApplicationData): Promise<{ success: boolean; message: string }> {
    console.log('🚀 authService.applyAsCustomer called with:', applicationData);
    console.log('🌐 API Base URL:', this.baseURL || API_BASE_URL);
    
    try {
      const endpoint = '/api/auth/customer/apply';
      console.log('📡 Making request to endpoint:', endpoint);
      
      const response = await apiClient.post(getEndpoint(endpoint), applicationData);
      if (import.meta.env.DEV) {
        console.log('📥 Raw response status:', response.status);
        console.log('📥 Raw response ok:', response.ok);
      }
      
      const data = await response.json();
      if (import.meta.env.DEV) {
        console.log('📥 Response success:', data.success);
        console.log('📥 Response message:', data.message);
        // Never log full response data as it may contain sensitive information
      }
      
      return data;
    } catch (error) {
      console.error('❌ applyAsCustomer error:', error);
      throw error;
    }
  },

  // Customer login
  async loginCustomer(email: string, password: string): Promise<LoginResponse> {
    const response = await apiClient.post(getEndpoint('/api/auth/customer/login'), {
      email,
      password,
    });
    const data = await response.json();
    
    if (data.success) {
      tokenManager.setUserType('customer');
      tokenManager.setTokens(data.tokens, 'customer');
      tokenManager.setUser(data.user, 'customer');
    }
    
    return data;
  },

  // Customer password reset request
  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(getEndpoint('/api/auth/customer/password-reset-request'), {
      email,
    });
    return response.json();
  },

  // Customer password reset verification
  async verifyPasswordReset(email: string, resetCode: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(getEndpoint('/api/auth/customer/password-reset-verify'), {
      email,
      resetCode,
      newPassword,
    });
    return response.json();
  },

  // Admin login with enhanced error handling
  async loginAdmin(email: string, password: string): Promise<LoginResponse> {
    const response = await apiClient.post(getEndpoint('/api/auth/admin/super'), {
      email,
      password,
    });
    const data = await response.json();
    
    if (data.success) {
      tokenManager.setUserType('admin');
      tokenManager.setTokens(data.tokens, 'admin');
      tokenManager.setUser(data.user, 'admin');
    } else {
      // Enhanced error handling for better user feedback
      let userFriendlyMessage = data.error || 'Login fejlede';
      
      if (response.status === 429) {
        userFriendlyMessage = `🚫 For mange login forsøg!\n\n` +
          `Du har nået grænsen for login forsøg (20 forsøg per 10 minutter).\n\n` +
          `⏰ Vent 10 minutter før næste forsøg\n` +
          `🔧 Eller kontakt support for hjælp\n\n` +
          `Hvis du er developer, kan du nulstille rate limit i developer dashboardet.`;
      } else if (response.status === 500) {
        if (data.errorType === 'database_error') {
          userFriendlyMessage = `💾 Database forbindelse fejlede\n\nServeren kan ikke forbinde til databasen.\nKontakt support hvis problemet fortsætter.`;
        } else if (data.errorType === 'cors_error') {
          userFriendlyMessage = `🌐 CORS fejl\n\nDer er et problem med server konfigurationen.\nKontakt support for hjælp.`;
        } else {
          userFriendlyMessage = `⚠️ Server fejl\n\nDer opstod en uventet fejl på serveren.\nPrøv igen om lidt eller kontakt support.`;
        }
      } else if (response.status === 401) {
        if (data.errorType === 'wrong_password') {
          userFriendlyMessage = `🔑 Forkert password\n\nPasswordet er ikke korrekt.\nKontroller dit password og prøv igen.`;
        } else if (data.errorType === 'invalid_credentials') {
          userFriendlyMessage = `📧 Ugyldig email eller password\n\nKontroller dine login oplysninger og prøv igen.`;
        }
      } else if (response.status === 400) {
        if (data.errorType === 'missing_credentials') {
          userFriendlyMessage = `📝 Manglende oplysninger\n\nBåde email og password skal udfyldes.`;
        }
      }
      
      // Throw error with user-friendly message
      const error = new Error(userFriendlyMessage);
      error.name = data.errorType || 'LoginError';
      throw error;
    }
    
    return data;
  },

  // Logout
  logout(userType?: 'admin' | 'customer'): void {
    tokenManager.clearTokens(userType);
  },

  // Check if user is authenticated
  isAuthenticated(userType?: 'admin' | 'customer'): boolean {
    return tokenManager.isAuthenticated(userType);
  },

  // Get current user
  getCurrentUser(): User | null {
    return tokenManager.getCurrentUser();
  },

  // Get user by type
  getUser(userType: 'admin' | 'customer'): User | null {
    return tokenManager.getUser(userType);
  },

  // Admin functions with pagination and caching
  async getApplications(options: {
    page?: number;
    limit?: number;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<ApplicationsResponse> {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.status) params.append('status', options.status);
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);

    const queryString = params.toString();
    const endpoint = `/api/auth/admin/applications${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiClient.get(getEndpoint(endpoint));
    return response.json();
  },

  // Get individual application by ID
  async getApplication(id: string): Promise<{ success: boolean; application?: any; error?: string }> {
    try {
      const response = await apiClient.get(getEndpoint(`/api/auth/admin/applications?id=${id}`));
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to get application:', error);
      return { success: false, error: 'Kunne ikke hente ansøgning' };
    }
  },

  async approveApplication(applicationId: string): Promise<ApplicationResponse> {
    const response = await apiClient.put(getEndpoint('/api/auth/admin/applications'), { 
      applicationId, 
      action: 'approve' 
    });
    return response.json();
  },

  async rejectApplication(applicationId: string, reason: string): Promise<ApplicationResponse> {
    const response = await apiClient.put(getEndpoint('/api/auth/admin/applications'), { 
      applicationId, 
      action: 'reject', 
      rejectionReason: reason 
    });
    return response.json();
  },

  // Bulk operations for better admin efficiency
  async bulkApproveApplications(applicationIds: string[]): Promise<{ success: boolean; message: string; processedCount: number }> {
    const response = await apiClient.post(getEndpoint('/api/auth/admin/applications'), {
      applicationIds,
      action: 'approve'
    });
    return response.json();
  },

  async bulkRejectApplications(applicationIds: string[], reason: string): Promise<{ success: boolean; message: string; processedCount: number }> {
    const response = await apiClient.post(getEndpoint('/api/auth/admin/applications'), {
      applicationIds,
      action: 'reject',
      rejectionReason: reason
    });
    return response.json();
  },

  // Admin profile management
  async getAdminProfile(): Promise<{ success: boolean; admin: User }> {
    const response = await apiClient.get(getEndpoint('/api/auth/admin/profile'));
    return response.json();
  },

  async updateAdminProfile(profileData: { 
    name: string; 
    email?: string; 
    currentPassword?: string; 
    newPassword?: string;
    verificationCode?: string;
  }): Promise<{ success: boolean; message: string; admin?: User; requiresVerification?: boolean; changeType?: string }> {
    const response = await apiClient.put(getEndpoint('/api/auth/admin/profile'), profileData);
    const data = await response.json();
    
    if (data.success && data.admin) {
      // Update stored user data
      tokenManager.setUser(data.admin);
    }
    
    return data;
  },

  // Admin verification functions
  async generateVerificationCode(verificationType: 'email_change' | 'password_change' | 'profile_security', newEmail?: string): Promise<{ success: boolean; message: string; expiresIn?: number }> {
    const response = await apiClient.post(getEndpoint('/api/auth/admin/verification'), {
      action: 'generate',
      verificationType,
      newEmail
    });
    return response.json();
  },

  async verifyCode(verificationCode: string): Promise<{ success: boolean; message: string; verificationType?: string; pendingEmailChange?: string }> {
    const response = await apiClient.post(getEndpoint('/api/auth/admin/verification'), {
      action: 'verify',
      verificationCode
    });
    return response.json();
  },

  async uploadAdminProfilePicture(imageFile: File): Promise<{ success: boolean; message: string; profilePictureUrl: string; admin: User }> {
    return new Promise((resolve, reject) => {
      console.log('🔄 Starting file read for upload...');
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const imageData = reader.result as string;
          console.log('📊 Image data size:', imageData.length);
          console.log('📁 File name:', imageFile.name);
          console.log('📄 Content type:', imageFile.type);
          
          const response = await apiClient.put(getEndpoint('/api/auth/admin/profile'), {
            imageData,
            fileName: imageFile.name,
            contentType: imageFile.type
          });
          
          if (import.meta.env.DEV) {
            console.log('📡 Response status:', response.status);
          }
          const data = await response.json();
          if (import.meta.env.DEV) {
            console.log('📥 Response success:', data.success);
            console.log('📥 Response message:', data.message);
            // Never log full response data as it may contain sensitive information
          }
          
          if (data.success) {
            // Update stored user data
            tokenManager.setUser(data.admin);
          }
          
          resolve(data);
        } catch (error) {
          console.error('❌ Upload request failed:', error);
          reject(error);
        }
      };
      
      reader.onerror = () => {
        console.error('❌ File read failed');
        reject(new Error('Kunne ikke læse billedfilen'));
      };
      
      reader.readAsDataURL(imageFile);
    });
  },

  // Customer profile management
  async getCustomerProfile(forceRefresh: boolean = false): Promise<{ success: boolean; customer?: User }> {
    // Clear cache if force refresh is requested
    if (forceRefresh) {
      requestCache.clearPattern('.*customer.*profile.*');
      requestCache.clearPattern('.*profile.*');
    }
    
    const response = await apiClient.get(getEndpoint('/api/auth/customer/profile'));
    const data = await response.json();
    
    if (data.success && data.customer) {
      // Update stored user data
      tokenManager.setUser(data.customer, 'customer');
    }
    
    return data;
  },

  // Force refresh customer profile - useful when discount group is updated by admin
  async forceRefreshCustomerProfile(): Promise<{ success: boolean; customer?: User }> {
    console.log('🔄 Force refreshing customer profile...');
    return this.getCustomerProfile(true);
  },

  async updateCustomerProfile(profileData: { 
    contactPersonName: string; 
    email?: string; 
    phone?: string;
    address?: any;
    deliveryAddress?: any;
    useRegisteredAddressForDelivery?: boolean;
    currentPassword?: string; 
    newPassword?: string;
    verificationCode?: string;
  }): Promise<{ success: boolean; message: string; customer?: User; requiresVerification?: boolean }> {
    const response = await apiClient.put(getEndpoint('/api/auth/customer/profile'), profileData);
    const data = await response.json();
    
    if (data.success && data.customer) {
      // Update stored user data
      tokenManager.setUser(data.customer, 'customer');
    }
    
    return data;
  },

  // Customer verification functions
  async generateCustomerVerificationCode(verificationType: 'email_change' | 'password_change' | 'profile_security', newEmail?: string): Promise<{ success: boolean; message: string; expiresIn?: number }> {
    const response = await apiClient.post(getEndpoint('/api/auth/customer/verification'), {
      action: 'generate',
      verificationType,
      newEmail
    });
    return response.json();
  },

  async verifyCustomerCode(verificationCode: string): Promise<{ success: boolean; message: string; verificationType?: string; pendingEmailChange?: string }> {
    const response = await apiClient.post(getEndpoint('/api/auth/customer/verification'), {
      action: 'verify',
      verificationCode
    });
    return response.json();
  },

  async uploadCustomerProfilePicture(imageFile: File): Promise<{ success: boolean; message: string; profilePictureUrl: string; customer: User }> {
    return new Promise((resolve, reject) => {
      console.log('🔄 Starting customer profile picture upload...');
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const imageData = reader.result as string;
          console.log('📊 Customer image data size:', imageData.length);
          console.log('📁 File name:', imageFile.name);
          console.log('📄 Content type:', imageFile.type);
          
          const response = await apiClient.put(getEndpoint('/api/auth/customer/profile'), {
            imageData,
            fileName: imageFile.name,
            contentType: imageFile.type
          });
          
          if (import.meta.env.DEV) {
            console.log('📡 Customer upload response status:', response.status);
          }
          const data = await response.json();
          if (import.meta.env.DEV) {
            console.log('📥 Customer upload success:', data.success);
            console.log('📥 Customer upload message:', data.message);
            // Never log full response data as it may contain sensitive information
          }
          
          if (data.success) {
            // Update stored user data
            tokenManager.setUser(data.customer, 'customer');
          }
          
          resolve(data);
        } catch (error) {
          console.error('❌ Customer upload request failed:', error);
          reject(error);
        }
      };
      
      reader.onerror = () => {
        console.error('❌ Customer file read failed');
        reject(new Error('Kunne ikke læse billedfilen'));
      };
      
      reader.readAsDataURL(imageFile);
    });
  },

  // Cache management
  clearCache(): void {
    requestCache.clear();
  },

  clearCachePattern(pattern: string): void {
    requestCache.clearPattern(pattern);
  },

  clearDiscountGroupsCache(): void {
    requestCache.clearPattern('.*discount-groups.*');
  },

  // CRITICAL SECURITY FIX: Enhanced public refresh token method with multi-session support
  async refreshToken(): Promise<{ success: boolean; tokens?: AuthTokens; message?: string }> {
    const sessionType = tokenManager.getCurrentSessionType();
    const refreshToken = sessionType 
      ? tokenManager.getRefreshToken(sessionType)
      : tokenManager.getRefreshToken();
      
    if (!refreshToken) {
      console.warn('🚨 SECURITY: No refresh token available for session type:', sessionType);
      return { success: false, message: 'No refresh token available' };
    }

    // CRITICAL SECURITY FIX: Check if refresh token is expired before attempting refresh
    try {
      const payload = JSON.parse(atob(refreshToken.split('.')[1]));
      const currentTime = Date.now() / 1000;
      if (payload.exp < currentTime) {
        console.error('🚨 SECURITY: Refresh token is expired in authService', {
          sessionType,
          expiredBy: Math.floor(currentTime - payload.exp) + ' seconds'
        });
        if (sessionType) {
          tokenManager.clearTokens(sessionType);
        } else {
          tokenManager.clearTokens();
        }
        return { success: false, message: 'Refresh token expired' };
      }
    } catch (error) {
      console.error('🚨 SECURITY: Error parsing refresh token in authService:', error);
      if (sessionType) {
        tokenManager.clearTokens(sessionType);
      } else {
        tokenManager.clearTokens();
      }
      return { success: false, message: 'Invalid refresh token' };
    }

    try {
      if (import.meta.env.DEV) {
        console.log('🔄 SECURITY: AuthService attempting token refresh for session type:', sessionType);
      }
      const response = await apiClient.post(getEndpoint('/api/auth/refresh'), { refreshToken });
      const data = await response.json();
      
      if (data.success && data.tokens) {
        // CRITICAL SECURITY FIX: Validate new tokens before storing
        const { accessToken, refreshToken: newRefreshToken } = data.tokens;
        
        try {
          const accessPayload = JSON.parse(atob(accessToken.split('.')[1]));
          const refreshPayload = JSON.parse(atob(newRefreshToken.split('.')[1]));
          const currentTime = Date.now() / 1000;
          
          if (accessPayload.exp < currentTime) {
            console.error('🚨 SECURITY: AuthService received expired access token!');
            if (sessionType) {
              tokenManager.clearTokens(sessionType);
            } else {
              tokenManager.clearTokens();
            }
            return { success: false, message: 'Server returned expired access token' };
          }
          
          if (refreshPayload.exp < currentTime) {
            console.error('🚨 SECURITY: AuthService received expired refresh token!');
            if (sessionType) {
              tokenManager.clearTokens(sessionType);
            } else {
              tokenManager.clearTokens();
            }
            return { success: false, message: 'Server returned expired refresh token' };
          }
          
          // CRITICAL SECURITY FIX: Store tokens for correct session type
          if (sessionType) {
            tokenManager.setTokens(data.tokens, sessionType);
          } else {
            tokenManager.setTokens(data.tokens);
          }
          
          if (import.meta.env.DEV) {
            console.log('✅ SECURITY: AuthService token refresh successful for session type:', sessionType);
          }
          return { success: true, tokens: data.tokens };
        } catch (tokenError) {
          console.error('🚨 SECURITY: AuthService error validating refreshed tokens:', tokenError);
          if (sessionType) {
            tokenManager.clearTokens(sessionType);
          } else {
            tokenManager.clearTokens();
          }
          return { success: false, message: 'Invalid tokens received from server' };
        }
      } else {
        console.error('🚨 SECURITY: AuthService token refresh failed - invalid response');
        if (sessionType) {
          tokenManager.clearTokens(sessionType);
        } else {
          tokenManager.clearTokens();
        }
        return { success: false, message: data.message || 'Token refresh failed' };
      }
    } catch (error) {
      console.error('🚨 SECURITY: AuthService token refresh error:', error);
      if (sessionType) {
        tokenManager.clearTokens(sessionType);
      } else {
        tokenManager.clearTokens();
      }
      return { success: false, message: 'Token refresh failed' };
    }
  },

  // Discount Groups Management
  async getDiscountGroups(): Promise<{ success: boolean; discountGroups: unknown[]; message?: string }> {
    const response = await apiClient.get(getEndpoint('/api/auth/admin/discount-groups'));
    return response.json();
  },

  async createDiscountGroup(groupData: {
    name: string;
    description?: string;
    discountPercentage: number;
    color?: string;
    sortOrder?: number;
  }): Promise<{ success: boolean; message: string; discountGroup?: unknown }> {
    const response = await apiClient.post(getEndpoint('/api/auth/admin/discount-groups'), groupData);
    const result = await response.json();
    
    // Clear discount groups cache on successful creation
    if (result.success) {
      requestCache.clearPattern('.*discount-groups.*');
    }
    
    return result;
  },

  async updateDiscountGroup(discountGroupId: string, groupData: {
    name?: string;
    description?: string;
    discountPercentage?: number;
    color?: string;
    sortOrder?: number;
    isActive?: boolean;
  }): Promise<{ success: boolean; message: string; discountGroup?: unknown }> {
    const response = await apiClient.put(getEndpoint('/api/auth/admin/discount-groups'), {
      discountGroupId,
      ...groupData
    });
    const result = await response.json();
    
    // Clear discount groups cache on successful update
    if (result.success) {
      requestCache.clearPattern('.*discount-groups.*');
    }
    
    return result;
  },

  async deleteDiscountGroup(discountGroupId: string): Promise<{ success: boolean; message: string; customerCount?: number }> {
    const response = await apiClient.delete(getEndpoint('/api/auth/admin/discount-groups'), { discountGroupId });
    const result = await response.json();
    
    // Clear discount groups cache on successful deletion
    if (result.success) {
      requestCache.clearPattern('.*discount-groups.*');
    }
    
    return result;
  },

  // Customer management methods
  async getCustomers(params?: { page?: number; limit?: number; search?: string }): Promise<{ success: boolean; customers: any[]; pagination?: any; message?: string }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.search) queryParams.set('search', params.search);
    
    const response = await apiClient.get(`${getEndpoint('/api/auth/admin/customers')}?${queryParams.toString()}`);
    return response.json();
  },

  async deleteCustomer(customerId: string, options?: { sendEmail?: boolean; reason?: string }): Promise<{ success: boolean; message: string; emailSent?: boolean; emailError?: string }> {
    const response = await apiClient.delete(getEndpoint('/api/auth/admin/customers'), { 
      customerId,
      sendEmail: options?.sendEmail || false,
      reason: options?.reason || ''
    });
    return response.json();
  },

  async updateCustomerDiscountGroup(customerId: string, discountGroupId: string): Promise<{ success: boolean; message: string; customer?: any }> {
    const response = await apiClient.put(getEndpoint('/api/auth/admin/customers'), { 
      customerId,
      discountGroupId
    });
    const result = await response.json();
    
    // Clear customer profile cache to force refresh on next access
    if (result.success) {
      requestCache.clearPattern('.*customer.*profile.*');
      requestCache.clearPattern('.*profile.*');
    }
    
    return result;
  },

  async createCustomerAsAdmin(customerData: {
    companyName: string;
    cvrNumber: string;
    contactPersonName: string;
    email: string;
    phone: string;
    discountGroupId: string;
    address?: any;
    deliveryAddress?: any;
    useRegisteredAddressForDelivery?: boolean;
    passwordOption: 'generate' | 'link';
    password?: string;
  }): Promise<{ success: boolean; message: string; customer?: any; passwordResetLink?: string }> {
    const response = await apiClient.post(getEndpoint('/api/auth/admin/customers'), customerData);
    return response.json();
  },

  async getDiscountGroupCustomers(discountGroupId: string): Promise<{ success: boolean; customers: any[]; message?: string }> {
    const response = await apiClient.get(`${getEndpoint('/api/auth/admin/discount-groups')}?action=customers&discountGroupId=${discountGroupId}`);
    return response.json();
  },

  async removeCustomerFromDiscountGroup(customerId: string, discountGroupId: string): Promise<{ success: boolean; message: string; customer?: any }> {
    const response = await apiClient.delete(getEndpoint('/api/auth/admin/discount-groups'), { 
      action: 'remove-customer',
      customerId,
      discountGroupId
    });
    return response.json();
  },

  // Add customer to discount group
  async addCustomerToDiscountGroup(customerId: string, discountGroupId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put(getEndpoint('/api/auth/admin/discount-groups'), {
      action: 'add-customer',
      customerId,
      discountGroupId
    });
    return response.json();
  },

  // Get customer-specific pricing for products
  async getCustomerPricing(params: {
    customerId?: string;
    discountGroupId?: string;
    productIds?: string[];
  }): Promise<{ success: boolean; data?: any; error?: string }> {
    const searchParams = new URLSearchParams();
    
    if (params.customerId) {
      searchParams.append('customerId', params.customerId);
    }
    if (params.discountGroupId) {
      searchParams.append('discountGroupId', params.discountGroupId);
    }
    if (params.productIds && params.productIds.length > 0) {
      searchParams.append('productIds', params.productIds.join(','));
    }
    
    const response = await apiClient.get(`${getEndpoint('/api/products')}/customer-pricing?${searchParams.toString()}`);
    return response.json();
  },

  // Admin-specific products endpoint with enhanced filtering and search
  async getAdminProducts(params: {
    page?: number;
    limit?: number;
    search?: string;
    kategori?: string;
    aktiv?: boolean;
    lagerstyring?: boolean;
    sortBy?: string;
    sortOrder?: string;
  } = {}): Promise<{ success: boolean; data?: any; error?: string }> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });
    
    const response = await apiClient.get(`${getEndpoint('/api/admin/products')}?${searchParams.toString()}`);
    return response.json();
  },

  // Get all customers (for adding to discount groups)
  async getAllCustomers(): Promise<{ success: boolean; customers?: any[]; message?: string }> {
    const response = await apiClient.get(getEndpoint('/api/auth/admin/customers'));
    return response.json();
  },

  // Unique Offers Management
  async getUniqueOffers(params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    customerId?: string; 
    productId?: string; 
    showActiveOnly?: boolean;
  }): Promise<{ success: boolean; offers: any[]; pagination?: any; message?: string }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.customerId) queryParams.append('customerId', params.customerId);
    if (params?.productId) queryParams.append('productId', params.productId);
    if (params?.showActiveOnly !== undefined) queryParams.append('showActiveOnly', params.showActiveOnly.toString());
    
    const queryString = queryParams.toString();
    const endpoint = `${getEndpoint('/api/auth/admin/unique-offers')}${queryString ? `?${queryString}` : ''}`;
    
    const response = await apiClient.get(endpoint);
    return response.json();
  },

  async getCustomerOffers(customerId: string): Promise<{ success: boolean; offers: any[]; message?: string }> {
    const response = await apiClient.get(`${getEndpoint('/api/auth/admin/unique-offers')}?action=customer-offers&customerId=${customerId}`);
    return response.json();
  },

  async getProductOffers(productId: string): Promise<{ success: boolean; offers: any[]; message?: string }> {
    const response = await apiClient.get(`${getEndpoint('/api/auth/admin/unique-offers')}?action=product-offers&productId=${productId}`);
    return response.json();
  },

  async getCustomerOffersCount(customerId: string): Promise<{ success: boolean; count: number; message?: string }> {
    const response = await apiClient.get(`${getEndpoint('/api/auth/admin/unique-offers')}?action=customer-count&customerId=${customerId}`);
    return response.json();
  },

  async getUniqueOffer(offerId: string): Promise<{ success: boolean; offer: any; message?: string }> {
    const response = await apiClient.get(`${getEndpoint('/api/auth/admin/unique-offers')}?action=single&offerId=${offerId}`);
    return response.json();
  },

  async createUniqueOffer(offerData: {
    productId: string;
    customerId: string;
    fixedPrice: number;
    description?: string;
    validFrom?: string;
    validTo?: string;
    isUnlimited?: boolean;
  }): Promise<{ success: boolean; message?: string; error?: string; offer?: any }> {
    const response = await apiClient.post(getEndpoint('/api/auth/admin/unique-offers'), offerData);
    const result = await response.json();
    
    // Clear cache on successful creation
    if (result.success) {
      requestCache.clearPattern('.*unique-offers.*');
      requestCache.clearPattern('.*customers.*');
      requestCache.clearPattern('.*products.*');
    }
    
    return result;
  },

  async updateUniqueOffer(offerId: string, offerData: {
    fixedPrice?: number;
    description?: string;
    validFrom?: string;
    validTo?: string;
    isActive?: boolean;
    isUnlimited?: boolean;
  }): Promise<{ success: boolean; message?: string; error?: string; offer?: any }> {
    const response = await apiClient.put(getEndpoint('/api/auth/admin/unique-offers'), {
      offerId,
      ...offerData
    });
    const result = await response.json();
    
    // Clear cache on successful update
    if (result.success) {
      requestCache.clearPattern('.*unique-offers.*');
      requestCache.clearPattern('.*customers.*');
      requestCache.clearPattern('.*products.*');
    }
    
    return result;
  },

  async deleteUniqueOffer(offerId: string, permanent: boolean = false): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(getEndpoint('/api/auth/admin/unique-offers'), {
      offerId,
      permanent
    });
    const result = await response.json();
    
    // Clear cache on successful deletion
    if (result.success) {
      requestCache.clearPattern('.*unique-offers.*');
      requestCache.clearPattern('.*customers.*');
      requestCache.clearPattern('.*products.*');
    }
    
    return result;
  },

  async clearUniqueOffersCache(): Promise<void> {
    requestCache.clearPattern('.*unique-offers.*');
  },

  // Customer Unique Offers - Get offers for currently logged in customer
  async getMyUniqueOffers(): Promise<{ success: boolean; offers: any[]; count: number; message?: string }> {
    const response = await apiClient.get(getEndpoint('/api/auth/customer/unique-offers'));
    const data = await response.json();
    return data;
  },

  // Admin Notifications Methods
  async getNotifications(params?: { 
    limit?: number; 
    page?: number; 
    unreadOnly?: boolean;
  }): Promise<{ 
    success: boolean; 
    notifications: any[]; 
    pagination?: any; 
    statistics?: any; 
    message?: string 
  }> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.unreadOnly) queryParams.append('unreadOnly', params.unreadOnly.toString());
    
    const endpoint = `/api/auth/admin/notifications${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await apiClient.get(getEndpoint(endpoint));
    const data = await response.json();
    return data;
  },

  async markNotificationAsRead(notificationId: string): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.post(getEndpoint('/api/auth/admin/notifications'), {
      notificationId,
      action: 'mark_opened'
    });
    const data = await response.json();
    return data;
  },

  async markAllNotificationsAsRead(): Promise<{ success: boolean; message?: string; processed?: number; total?: number }> {
    try {
      const response = await apiClient.put(getEndpoint('/api/auth/admin/notifications'), {
        action: 'mark_all_opened'
      });
      const data = await response.json();
      
      // Clear notifications cache to force refresh
      if (data.success) {
        requestCache.clearPattern('.*notifications.*');
        requestCache.clearPattern('.*admin.*notifications.*');
      }
      
      return data;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      return { 
        success: false, 
        message: 'Kunne ikke markere alle notifikationer som læst' 
      };
    }
  },

  // Admin Contacts Methods
  async getContacts(params?: { 
    limit?: number; 
    page?: number; 
    status?: string;
    search?: string;
  }): Promise<{ 
    success: boolean; 
    contacts: any[]; 
    statistics?: any; 
    pagination?: any; 
    message?: string 
  }> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.status && params.status !== 'all') queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    
    const endpoint = `/api/auth/admin/contacts${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await apiClient.get(getEndpoint(endpoint));
    const data = await response.json();
    return data;
  },

  // Get individual contact by ID
  async getContact(id: string): Promise<{ success: boolean; contact?: any; error?: string }> {
    try {
      const response = await apiClient.get(getEndpoint(`/api/auth/admin/contacts?id=${id}`));
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to get contact:', error);
      return { success: false, error: 'Kunne ikke hente kontakt' };
    }
  },

  // Update contact status
  async updateContactStatus(contactId: string, status: string, internalNotes?: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiClient.put(getEndpoint('/api/auth/admin/contacts'), {
        contactId,
        status,
        internalNotes
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to update contact status:', error);
      return { success: false, message: 'Kunne ikke opdatere kontakt status' };
    }
  },

  // Mark contact as read
  async markContactAsRead(contactId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiClient.put(getEndpoint('/api/auth/admin/contacts'), {
        contactId,
        action: 'mark_read'
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to mark contact as read:', error);
      return { success: false, message: 'Kunne ikke markere kontakt som læst' };
    }
  },

  // Customer Cart Management
  async getCart(): Promise<CartResponse> {
    const response = await apiClient.get(getEndpoint('/api/auth/customer/cart'));
    const data = await response.json();
    return data;
  },

  async addToCart(productId: string, quantity: number): Promise<{ success: boolean; message: string; totalItems?: number }> {
    const response = await apiClient.post(getEndpoint('/api/auth/customer/cart'), {
      productId,
      quantity
    });
    const result = await response.json();
    
    // Clear cart cache on successful addition
    if (result.success) {
      requestCache.clearPattern('.*cart.*');
    }
    
    return result;
  },

  async updateCartItem(productId: string, quantity: number): Promise<{ success: boolean; message: string; totalItems?: number }> {
    const response = await apiClient.put(getEndpoint('/api/auth/customer/cart'), {
      productId,
      quantity
    });
    const result = await response.json();
    
    // Clear cart cache on successful update
    if (result.success) {
      requestCache.clearPattern('.*cart.*');
    }
    
    return result;
  },

  async removeFromCart(productId: string): Promise<{ success: boolean; message: string; totalItems?: number }> {
    const response = await apiClient.delete(`${getEndpoint('/api/auth/customer/cart')}?productId=${productId}`);
    const result = await response.json();
    
    // Clear cart cache on successful removal
    if (result.success) {
      requestCache.clearPattern('.*cart.*');
    }
    
    return result;
  },

  async clearCart(): Promise<{ success: boolean; message: string; totalItems?: number }> {
    const response = await apiClient.delete(`${getEndpoint('/api/auth/customer/cart')}?clear=true`);
    const result = await response.json();
    
    // Clear cart cache on successful clearing
    if (result.success) {
      requestCache.clearPattern('.*cart.*');
    }
    
    return result;
  },

  // Admin Cart Management - View customer carts
  async getCustomerCarts(params?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
  }): Promise<AdminCartResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const endpoint = `${getEndpoint('/api/auth/admin/customer-carts')}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await apiClient.get(endpoint);
    const data = await response.json();
    return data;
  },

  async getCustomerCart(customerId: string): Promise<AdminCartResponse> {
    const response = await apiClient.get(`${getEndpoint('/api/auth/admin/customer-carts')}?customerId=${customerId}`);
    const data = await response.json();
    return data;
  },

  // Clear cart cache
  async clearCartCache(): Promise<void> {
    requestCache.clearPattern('.*cart.*');
  },

  // Order Management Methods

  // Customer order methods
  async placeOrder(orderData: PlaceOrderRequest): Promise<PlaceOrderResponse> {
    const response = await apiClient.post(getEndpoint('/api/auth/customer/orders'), orderData);
    const result = await response.json();
    
    // Clear cart cache on successful order
    if (result.success) {
      requestCache.clearPattern('.*cart.*');
    }
    
    return result;
  },

  async getMyOrders(params?: { 
    page?: number; 
    limit?: number; 
    status?: string; 
  }): Promise<CustomerOrdersResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);

    const endpoint = `${getEndpoint('/api/auth/customer/orders')}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await apiClient.get(endpoint);
    const data = await response.json();
    return data;
  },

  // Admin order methods
  async getOrderStatistics(): Promise<OrderStatisticsResponse> {
    const response = await apiClient.get(getEndpoint('/api/auth/admin/orders?statistics=true'));
    const data = await response.json();
    return data;
  },

  async getOrders(params?: { 
    page?: number; 
    limit?: number; 
    status?: string; 
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<OrdersResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const endpoint = `${getEndpoint('/api/auth/admin/orders')}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await apiClient.get(endpoint);
    const data = await response.json();
    return data;
  },

  async getOrder(orderId: string): Promise<OrderResponse> {
    const response = await apiClient.get(`${getEndpoint('/api/auth/admin/orders')}?orderId=${orderId}`);
    const data = await response.json();
    return data;
  },

  /**
   * Update order status with email notifications (NEW API)
   */
  async updateOrderStatus(orderId: string, newStatus: string, options: {
    skippedStatuses?: string[];
    sendEmailNotification?: boolean;
    deliveryInfo?: {
      expectedDelivery?: string;
      deliveryTimeSlot?: string;
      deliveryDate?: string;
    };
  } = {}): Promise<{ 
    success: boolean; 
    message: string; 
    order: {
      _id: string;
      orderNumber: string;
      status: string;
      previousStatus: string;
      skippedStatuses: string[];
      lastUpdated: string;
      emailSent: boolean;
    }
  }> {
    const response = await apiClient.post(getEndpoint('/admin-order-status-update'), {
      orderId,
      newStatus,
      skippedStatuses: options.skippedStatuses || [],
      deliveryInfo: options.deliveryInfo // CRITICAL FIX: Send delivery info to backend
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      // Handle specific validation errors for delivery info
      if (data.requiresDeliveryInfo) {
        throw new Error('Leveringsinformation er påkrævet når status opdateres til "Pakket". Vælg venligst leveringsdato og tidsinterval.');
      }
      throw new Error(data.message || 'Failed to update order status');
    }

    // Clear order cache after successful update
    requestCache.clearPattern('.*orders.*');

    return data;
  },

  /**
   * Reject order with reason and email notification (NEW API)
   */
  async rejectOrder(orderId: string, rejectionReason: string): Promise<{
    success: boolean;
    message: string;
    order: {
      _id: string;
      orderNumber: string;
      status: string;
      previousStatus: string;
      rejectionReason: string;
      rejectedAt: string;
      lastUpdated: string;
      emailSent: boolean;
    }
  }> {
    const response = await apiClient.post(getEndpoint('/admin-order-rejection'), {
      orderId,
      rejectionReason
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to reject order');
    }

    // Clear order cache after successful rejection
    requestCache.clearPattern('.*orders.*');

    return data;
  },

  /**
   * Update delivery information for an order (NEW API)
   */
  async updateOrderDelivery(orderId: string, deliveryInfo: {
    deliveryDateType: 'today' | 'tomorrow' | 'day_after_tomorrow' | 'custom';
    customDeliveryDate?: string;
    deliveryTimeSlot: '09:00-12:00' | '12:00-16:00' | '16:00-20:00' | '09:00-20:00';
    reason?: string;
  }): Promise<{
    success: boolean;
    message: string;
    order: {
      _id: string;
      orderNumber: string;
      status: string;
      delivery: {
        expectedDelivery: string;
        deliveryTimeSlot: string;
        deliveryDateType: string;
        isManuallySet: boolean;
        setBy: string;
        setAt: string;
        estimatedRange: {
          earliest: string;
          latest: string;
          updatedAt: string;
        };
      };
      lastUpdated: string;
    };
    previousDelivery: {
      expectedDelivery?: string;
      deliveryTimeSlot?: string;
      deliveryDateType?: string;
    } | null;
    newDelivery: {
      expectedDelivery: string;
      deliveryTimeSlot: string;
      deliveryDateType: string;
    };
    emailSent: boolean;
    updatedBy: {
      id: string;
      name: string;
    };
  }> {
    const response = await apiClient.post(getEndpoint('/admin-order-delivery-update'), {
      orderId,
      ...deliveryInfo
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update delivery information');
    }

    // Clear order cache after successful update
    requestCache.clearPattern('.*orders.*');

    return data;
  },

  async sendInvoice(orderId: string): Promise<{ 
    success: boolean; 
    message: string; 
    invoiceNumber?: string;
    order?: OrderSummary;
  }> {
    const response = await apiClient.put(`${getEndpoint('/api/auth/admin/orders')}?orderId=${orderId}`, {
      sendInvoice: true
    });
    const result = await response.json();
    
    // Clear order cache on successful invoice
    if (result.success) {
      requestCache.clearPattern('.*orders.*');
    }
    
    return result;
  },

  async bulkSendInvoices(orderIds: string[]): Promise<{ 
    success: boolean; 
    message: string; 
    results: Array<{
      orderNumber: string;
      success: boolean;
      invoiceNumber?: string;
      error?: string;
    }>;
    summary: {
      total: number;
      success: number;
      errors: number;
    };
  }> {
    const response = await apiClient.post(getEndpoint('/api/auth/admin/orders'), {
      action: 'bulk_invoice',
      orderIds
    });
    const result = await response.json();
    
    // Clear order cache on successful bulk operation
    if (result.success) {
      requestCache.clearPattern('.*orders.*');
    }
    
    return result;
  },

  // Clear order cache
  async clearOrderCache(): Promise<void> {
    requestCache.clearPattern('.*orders.*');
  },

  // Statistics Management Methods

  // Get dashboard statistics (for main admin dashboard)
  async getDashboardStatistics(): Promise<{
    success: boolean;
    statistics?: {
      dashboardStats: Array<{
        title: string;
        value: string;
        description: string;
        icon: string;
        trend: {
          value: number;
          isPositive: boolean;
        };
      }>;
      salesChartData: Array<{
        name: string;
        sales: number;
        orders: number;
        date?: string;
      }>;
      popularProducts: Array<{
        id: string;
        name: string;
        image: string;
        sales: number;
        status: string;
      }>;
      orderStatuses: Array<{
        status: string;
        count: number;
        variant: string;
      }>;
      recentActivities: Array<{
        id: string;
        type: string;
        title: string;
        description: string;
        time: string;
        amount?: number;
      }>;
    };
    message?: string;
  }> {
    const response = await apiClient.get(getEndpoint('/api/auth/admin/statistics'));
    const data = await response.json();
    return data;
  },

  // Get detailed statistics (for admin statistics page)
  async getDetailedStatistics(period: 'today' | 'week' | 'month' | 'year' = 'month'): Promise<{
    success: boolean;
    statistics?: {
      period: string;
      startDate: string;
      endDate: string;
      overview: {
        totalRevenue: number;
        revenueGrowth: number;
        totalOrders: number;
        orderGrowth: number;
        newCustomers: number;
        customerGrowth: number;
        averageOrderValue: number;
        totalSavings: number;
      };
      orders: {
        byStatus: Array<{
          status: string;
          count: number;
          revenue: number;
          percentage: number;
        }>;
        total: number;
      };
      revenue: {
        current: number;
        previous: number;
        growth: number;
        byDiscountGroup: Array<{
          _id: string;
          revenue: number;
          orders: number;
          averageOrderValue: number;
        }>;
      };
      customers: {
        new: number;
        total: number;
        active: number;
        byDiscountGroup: Array<{
          _id: string;
          count: number;
        }>;
      };
      products: {
        totalProducts: number;
        activeProducts: number;
        lowStockProducts: number;
        outOfStockProducts: number;
      };
      topProducts: Array<{
        id: string;
        name: string;
        quantitySold: number;
        revenue: number;
        timesOrdered: number;
        averageQuantityPerOrder: number;
      }>;
      applications: {
        current: Array<{ _id: string; count: number }>;
        total: Array<{ _id: string; count: number }>;
      };
      contacts: {
        current: Array<{ _id: string; count: number }>;
        total: Array<{ _id: string; count: number }>;
      };
      salesChart: Array<{
        name: string;
        sales: number;
        orders: number;
        date?: string;
      }>;
    };
    message?: string;
  }> {
    const response = await apiClient.get(getEndpoint(`/api/auth/admin/statistics-detailed?period=${period}`));
    const data = await response.json();
    return data;
  },

  // Clear statistics cache
  async clearStatisticsCache(): Promise<void> {
    requestCache.clearPattern('.*statistics.*');
  },

  // Track visitor (public endpoint) - Rate limited to prevent excessive calls
  async trackVisitor(page: string = '/'): Promise<void> {
    try {
      // Don't track admin pages or dev pages
      if (page.includes('/admin') || page.includes('/dev') || page.includes('/super')) {
        return;
      }

      // Rate limiting: Only track once per page per session to prevent spam
      const sessionKey = `visitor_tracked_${page}`;
      if (sessionStorage.getItem(sessionKey)) {
        return; // Already tracked this page in this session
      }

      const endpoint = getEndpoint('/visitor-tracking');
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ page })
      });

      // Don't throw errors for visitor tracking - it's non-critical
      if (response.ok) {
        const data = await response.json();
        console.log('👁️ Visitor tracked:', data);
        // Mark this page as tracked for this session
        sessionStorage.setItem(sessionKey, 'true');
      } else {
        console.warn('⚠️ Visitor tracking failed (non-critical)');
      }
    } catch (error) {
      console.warn('⚠️ Visitor tracking error (non-critical):', error);
    }
  },

  // Expose apiClient for direct use when needed
  apiClient
};

// Utility functions
export const isCustomer = (user: User | null): boolean => {
  return user?.userType === 'customer';
};

export const isAdmin = (user: User | null): boolean => {
  return user?.userType === 'admin';
};

export const getDiscountPercentage = (discountGroup?: string): number => {
  switch (discountGroup) {
    case 'Bronze': return 5;
    case 'Sølv': return 10;
    case 'Guld': return 15;
    case 'Platin': return 20;
    default: return 0;
  }
}; 