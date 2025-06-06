// Authentication utilities for the frontend

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://famous-dragon-b033ac.netlify.app';

export interface User {
  id: string;
  email: string;
  userType: 'customer' | 'admin';
  companyName?: string;
  contactPersonName?: string;
  discountGroup?: string;
  name?: string;
  role?: string;
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
  },

  getUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  setUser: (user: User): void => {
    localStorage.setItem('user', JSON.stringify(user));
  }
};

// API client with automatic token refresh
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
    const accessToken = tokenManager.getAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    let response = await fetch(url, {
      ...options,
      headers,
    });

    // If token expired, try to refresh
    if (response.status === 403 && accessToken) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        // Retry the request with new token
        headers.Authorization = `Bearer ${tokenManager.getAccessToken()}`;
        response = await fetch(url, {
          ...options,
          headers,
        });
      }
    }

    return response;
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
    return this.makeRequest(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put(endpoint: string, data?: unknown): Promise<Response> {
    return this.makeRequest(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete(endpoint: string): Promise<Response> {
    return this.makeRequest(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);

// Authentication functions
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

  // Admin functions
  async getApplications(): Promise<{ success: boolean; applications: unknown[] }> {
    const response = await apiClient.get('/api/auth/admin/applications');
    return response.json();
  },

  async approveApplication(applicationId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put(`/api/auth/admin/applications/${applicationId}`, {
      action: 'approve',
    });
    return response.json();
  },

  async rejectApplication(applicationId: string, reason?: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.put(`/api/auth/admin/applications/${applicationId}`, {
      action: 'reject',
      rejectionReason: reason,
    });
    return response.json();
  },
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