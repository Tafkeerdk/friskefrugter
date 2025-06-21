// Authentication utilities for the frontend

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.DEV ? 'http://localhost:3001' : 'https://famous-dragon-b033ac.netlify.app');

console.log('🌐 API Base URL:', API_BASE_URL);
console.log('🔧 Environment mode:', import.meta.env.DEV ? 'development' : 'production');

// Helper function to get the correct endpoint based on environment
const getEndpoint = (path: string): string => {
  // In development, use Express routes
  if (import.meta.env.DEV) {
    return path;
  }
  
  // In production, use Netlify function paths for specific endpoints
  if (path.startsWith('/api/auth/admin/profile')) {
    return '/.netlify/functions/admin-profile';
  }
  if (path.startsWith('/api/auth/admin/verification')) {
    return '/.netlify/functions/admin-verification';
  }
  
  // For other auth routes, use the main API function
  return path;
};

export interface User {
  id: string;
  email: string;
  userType: 'customer' | 'admin';
  companyName?: string;
  contactPersonName?: string;
  discountGroup?: string;
  name?: string;
  role?: string;
  profilePictureUrl?: string;
  isActive?: boolean;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
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

// Token management
export const tokenManager = {
  getAccessToken: (): string | null => {
    return localStorage.getItem('accessToken');
  },

  getRefreshToken: (): string | null => {
    return localStorage.getItem('refreshToken');
  },

  setTokens: (tokens: AuthTokens): void => {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
  },

  clearTokens: (): void => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    requestCache.clear(); // Clear cache on logout
  },

  getUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  setUser: (user: User): void => {
    const existingUser = tokenManager.getUser();
    
    // Debug logging for profile picture changes
    if (existingUser && existingUser.profilePictureUrl !== user.profilePictureUrl) {
      console.log('🖼️ Profile picture URL changed:', {
        from: existingUser.profilePictureUrl || 'none',
        to: user.profilePictureUrl || 'none',
        userId: user.id,
        timestamp: new Date().toISOString()
      });
    } else if (!existingUser && user.profilePictureUrl) {
      console.log('🖼️ Initial profile picture set:', {
        profilePictureUrl: user.profilePictureUrl,
        userId: user.id,
        timestamp: new Date().toISOString()
      });
    }
    
    localStorage.setItem('user', JSON.stringify(user));
  }
};

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
    const accessToken = tokenManager.getAccessToken();

    console.log(`🌐 Making API request to: ${url}`);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

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

          // If token expired, try to refresh
          if (response.status === 403 && accessToken) {
            console.log('🔄 Token expired, attempting refresh...');
            const refreshed = await this.refreshToken();
            if (refreshed) {
              // Retry the request with new token
              headers.Authorization = `Bearer ${tokenManager.getAccessToken()}`;
              response = await fetch(url, {
                ...options,
                headers,
              });
              console.log(`📡 Retry response status: ${response.status} for ${url}`);
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

  private async refreshToken(): Promise<boolean> {
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        tokenManager.setTokens(data.tokens);
        requestCache.clear(); // Clear cache after token refresh
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    // If refresh failed, clear tokens
    tokenManager.clearTokens();
    return false;
  }

  async get(endpoint: string): Promise<Response> {
    return this.makeRequest(endpoint, { method: 'GET' });
  }

  async post(endpoint: string, data?: unknown): Promise<Response> {
    // Clear relevant cache patterns on mutations
    this.invalidateCache(endpoint);
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put(endpoint: string, data?: unknown): Promise<Response> {
    // Clear relevant cache patterns on mutations
    this.invalidateCache(endpoint);
    return this.makeRequest(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete(endpoint: string): Promise<Response> {
    // Clear relevant cache patterns on mutations
    this.invalidateCache(endpoint);
    return this.makeRequest(endpoint, { method: 'DELETE' });
  }

  private invalidateCache(endpoint: string): void {
    if (endpoint.includes('applications')) {
      requestCache.clearPattern('.*applications.*');
    }
    if (endpoint.includes('profile')) {
      requestCache.clearPattern('.*profile.*');
    }
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// Authentication functions with optimizations
export const authService = {
  // Customer application
  async applyAsCustomer(applicationData: CustomerApplicationData): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post('/api/auth/customer/apply', applicationData);
    return response.json();
  },

  // Customer login
  async loginCustomer(email: string, password: string): Promise<LoginResponse> {
    const response = await apiClient.post('/api/auth/customer/login', {
      email,
      password,
    });
    const data = await response.json();
    
    if (data.success) {
      tokenManager.setTokens(data.tokens);
      tokenManager.setUser(data.user);
    }
    
    return data;
  },

  // Admin login
  async loginAdmin(email: string, password: string): Promise<LoginResponse> {
    const response = await apiClient.post('/api/auth/admin/super', {
      email,
      password,
    });
    const data = await response.json();
    
    if (data.success) {
      tokenManager.setTokens(data.tokens);
      tokenManager.setUser(data.user);
    }
    
    return data;
  },

  // Logout
  logout(): void {
    tokenManager.clearTokens();
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!tokenManager.getAccessToken();
  },

  // Get current user
  getCurrentUser(): User | null {
    return tokenManager.getUser();
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
    
    const response = await apiClient.get(endpoint);
    return response.json();
  },

  async approveApplication(applicationId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put(`/api/auth/admin/applications/${applicationId}`, { 
      action: 'approve' 
    });
    return response.json();
  },

  async rejectApplication(applicationId: string, reason?: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put(`/api/auth/admin/applications/${applicationId}`, { 
      action: 'reject',
      rejectionReason: reason 
    });
    return response.json();
  },

  // Bulk operations for better admin efficiency
  async bulkApproveApplications(applicationIds: string[]): Promise<{ success: boolean; message: string; processedCount: number }> {
    const response = await apiClient.post('/api/auth/admin/applications/bulk', {
      applicationIds,
      action: 'approve'
    });
    return response.json();
  },

  async bulkRejectApplications(applicationIds: string[], reason: string): Promise<{ success: boolean; message: string; processedCount: number }> {
    const response = await apiClient.post('/api/auth/admin/applications/bulk', {
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
          
          console.log('📡 Response status:', response.status);
          const data = await response.json();
          console.log('📥 Response data:', data);
          
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

  // Cache management
  clearCache(): void {
    requestCache.clear();
  },

  clearCachePattern(pattern: string): void {
    requestCache.clearPattern(pattern);
  }
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