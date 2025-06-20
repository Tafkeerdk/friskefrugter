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

// JWT token utilities
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Error parsing token:', error);
    return true; // If we can't parse it, consider it expired
  }
};

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
  },

  // Check if access token is valid and not expired
  isAccessTokenValid: (): boolean => {
    const token = localStorage.getItem('accessToken');
    if (!token) return false;
    return !isTokenExpired(token);
  },

  // Check if refresh token is valid and not expired
  isRefreshTokenValid: (): boolean => {
    const token = localStorage.getItem('refreshToken');
    if (!token) return false;
    return !isTokenExpired(token);
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

    console.log(`🌐 Making API request to: ${url}`);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    try {
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
    } catch (error) {
      console.error(`❌ Network error for ${url}:`, error);
      throw error;
    }
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

  // Check if user is authenticated with valid token
  isAuthenticated(): boolean {
    return tokenManager.isAccessTokenValid();
  },

  // Get current user
  getCurrentUser(): User | null {
    return tokenManager.getUser();
  },

  // Validate session and refresh token if needed
  async validateSession(): Promise<boolean> {
    const accessToken = tokenManager.getAccessToken();
    const refreshToken = tokenManager.getRefreshToken();

    // No tokens at all
    if (!accessToken || !refreshToken) {
      tokenManager.clearTokens();
      return false;
    }

    // Access token is still valid
    if (tokenManager.isAccessTokenValid()) {
      return true;
    }

    // Access token expired, try to refresh if refresh token is valid
    if (tokenManager.isRefreshTokenValid()) {
      console.log('🔄 Access token expired, attempting refresh...');
             try {
         const response = await fetch(`${API_BASE_URL}/.netlify/functions/token-refresh`, {
           method: 'POST',
           headers: {
             'Content-Type': 'application/json',
           },
           body: JSON.stringify({ refreshToken: refreshToken }),
         });
        
        const data = await response.json();
        if (data.success && data.tokens) {
          tokenManager.setTokens(data.tokens);
          console.log('✅ Token refreshed successfully');
          return true;
        }
      } catch (error) {
        console.error('❌ Token refresh failed:', error);
      }
    }

    // Both tokens invalid, clear everything
    console.log('🚫 Session expired, clearing tokens');
    tokenManager.clearTokens();
    return false;
  },

  // Admin functions
  async getApplications(): Promise<{ success: boolean; applications: unknown[] }> {
    const response = await apiClient.get('/api/auth/admin/applications');
    return response.json();
  },

  async approveApplication(applicationId: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`/api/auth/admin/applications/${applicationId}/approve`);
    return response.json();
  },

  async rejectApplication(applicationId: string, reason?: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`/api/auth/admin/applications/${applicationId}/reject`, { reason });
    return response.json();
  },

  // Admin profile management
  async getAdminProfile(): Promise<{ success: boolean; admin: User }> {
    const response = await apiClient.get('/admin-profile');
    return response.json();
  },

  async updateAdminProfile(profileData: { 
    name: string; 
    email?: string; 
    currentPassword?: string; 
    newPassword?: string;
    verificationCode?: string;
  }): Promise<{ success: boolean; message: string; admin?: User; requiresVerification?: boolean; changeType?: string }> {
    const response = await apiClient.put('/admin-profile', profileData);
    const data = await response.json();
    
    if (data.success && data.admin) {
      // Update stored user data
      tokenManager.setUser(data.admin);
    }
    
    return data;
  },

  // Admin verification functions
  async generateVerificationCode(verificationType: 'email_change' | 'password_change' | 'profile_security', newEmail?: string): Promise<{ success: boolean; message: string; expiresIn?: number }> {
    const response = await apiClient.post('/admin-verification', {
      action: 'generate',
      verificationType,
      newEmail
    });
    return response.json();
  },

  async verifyCode(verificationCode: string): Promise<{ success: boolean; message: string; verificationType?: string; pendingEmailChange?: string }> {
    const response = await apiClient.post('/admin-verification', {
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
          
          const response = await apiClient.post('/admin-profile', {
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