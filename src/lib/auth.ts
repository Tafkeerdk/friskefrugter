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
    const response = await apiClient.post(`/api/auth/admin/applications/${applicationId}/approve`);
    return response.json();
  },

  async rejectApplication(applicationId: string, reason?: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post(`/api/auth/admin/applications/${applicationId}/reject`, { reason });
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

  async uploadAdminProfilePicture(imageFile: File): Promise<{ success: boolean; message: string; profilePictureUrl?: string; admin?: User }> {
    return new Promise((resolve, reject) => {
      console.log('🔄 Starting file read for cropped image upload...');
      console.log('📊 File details:', {
        name: imageFile.name,
        size: imageFile.size,
        type: imageFile.type,
        lastModified: imageFile.lastModified
      });
      
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
          
          if (data.success && data.admin) {
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