// API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.DEV ? 'http://localhost:3001' : 'https://famous-dragon-b033ac.netlify.app');

// API client with authentication
class ApiClient {
  private baseURL: string;
  
  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<{ success: boolean; data?: T; error?: string; validationErrors?: any[] }> {
    const url = `${this.baseURL}${endpoint}`;
    
    // Get auth token from localStorage (correct key)
    const token = localStorage.getItem('accessToken');
    
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      // Validate token expiry before using it
      if (this.isTokenExpired(token)) {
        console.log('🔄 Token expired, attempting refresh...');
        const refreshed = await this.refreshToken();
        if (refreshed) {
          const newToken = localStorage.getItem('accessToken');
          if (newToken) {
            defaultHeaders.Authorization = `Bearer ${newToken}`;
          }
        } else {
          // If refresh failed, clear tokens and redirect to login
          this.clearTokens();
          window.location.href = '/login';
          throw new Error('Session expired. Please log in again.');
        }
      } else {
        defaultHeaders.Authorization = `Bearer ${token}`;
      }
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      credentials: 'include',
    };

    try {
      const response = await fetch(url, config);
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          throw new Error('Invalid JSON response from server');
        }
      } else {
        // Handle non-JSON responses (like HTML error pages)
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error(`Server returned non-JSON response: ${response.status}`);
      }
      
      // Handle token expiry from server
      if (response.status === 401 || response.status === 403) {
        console.log('🔄 Server returned auth error, attempting token refresh...');
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry the request with new token
          const newToken = localStorage.getItem('accessToken');
          if (newToken) {
            const retryConfig = {
              ...config,
              headers: {
                ...config.headers,
                Authorization: `Bearer ${newToken}`,
              },
            };
            const retryResponse = await fetch(url, retryConfig);
            const retryContentType = retryResponse.headers.get('content-type');
            
            if (retryContentType && retryContentType.includes('application/json')) {
              data = await retryResponse.json();
            } else {
              throw new Error(`Server returned non-JSON response on retry: ${retryResponse.status}`);
            }
            
            if (!retryResponse.ok) {
              throw new Error(data.error || `HTTP error! status: ${retryResponse.status}`);
            }
            return data;
          }
        } else {
          this.clearTokens();
          window.location.href = '/login';
          throw new Error('Session expired. Please log in again.');
        }
      }
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error parsing token:', error);
      return true; // Assume expired if we can't parse
    }
  }

  private async refreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refreshToken');
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
        if (data.success && data.tokens) {
          localStorage.setItem('accessToken', data.tokens.accessToken);
          localStorage.setItem('refreshToken', data.tokens.refreshToken);
          return true;
        }
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    return false;
  }

  private clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  // Helper method to get correct endpoint based on environment
  private getEndpoint(path: string): string {
    // In development, use Express routes directly
    if (import.meta.env.DEV) {
      return path;
    }
    
    // In production, route to appropriate Netlify functions
    if (path.startsWith('/api/products')) {
      return path.replace('/api/products', '/.netlify/functions/products');
    }
    if (path.startsWith('/api/categories')) {
      return path.replace('/api/categories', '/.netlify/functions/categories');
    }
    
    // Default: use main API function
    return path;
  }

  // Product API methods
  async getProducts(params: {
    page?: number;
    limit?: number;
    search?: string;
    kategori?: string;
    aktiv?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
    
    const endpoint = this.getEndpoint(`/api/products?${searchParams.toString()}`);
    return this.request(endpoint);
  }

  async getProduct(id: string) {
    const endpoint = this.getEndpoint(`/api/products/${id}`);
    return this.request(endpoint);
  }

  async createProduct(productData: FormData) {
    const endpoint = this.getEndpoint('/api/products');
    return this.request(endpoint, {
      method: 'POST',
      body: productData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  }

  async updateProduct(id: string, productData: FormData) {
    const endpoint = this.getEndpoint(`/api/products/${id}`);
    return this.request(endpoint, {
      method: 'PUT',
      body: productData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  }

  async deleteProduct(id: string) {
    const endpoint = this.getEndpoint(`/api/products/${id}`);
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  async searchProducts(params: {
    q?: string;
    kategori?: string;
    minPris?: number;
    maxPris?: number;
    lagerStatus?: string;
  }) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
    
    const endpoint = this.getEndpoint(`/api/products/search?${searchParams.toString()}`);
    return this.request(endpoint);
  }

  async getLowStockProducts() {
    const endpoint = this.getEndpoint('/api/products/low-stock');
    return this.request(endpoint);
  }

  async updateStock(id: string, quantity: number, operation: 'set' | 'add' | 'subtract' = 'set') {
    const endpoint = this.getEndpoint(`/api/products/${id}/stock`);
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify({ quantity, operation }),
    });
  }

  async deleteProductImage(productId: string, imageId: string) {
    const endpoint = this.getEndpoint(`/api/products/${productId}/images/${imageId}`);
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  // Category API methods
  async getCategories(params: {
    includeProductCount?: boolean;
    activeOnly?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
    
    const endpoint = this.getEndpoint(`/api/categories?${searchParams.toString()}`);
    return this.request(endpoint);
  }

  async getCategory(id: string) {
    const endpoint = this.getEndpoint(`/api/categories/${id}`);
    return this.request(endpoint);
  }

  async getCategoryBySlug(slug: string) {
    const endpoint = this.getEndpoint(`/api/categories/slug/${slug}`);
    return this.request(endpoint);
  }

  async createCategory(categoryData: {
    navn: string;
    beskrivelse?: string;
    parent?: string;
    sortOrder?: number;
    aktiv?: boolean;
  }) {
    const endpoint = this.getEndpoint('/api/categories');
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  }

  async updateCategory(id: string, categoryData: {
    navn?: string;
    beskrivelse?: string;
    parent?: string;
    sortOrder?: number;
    aktiv?: boolean;
  }) {
    const endpoint = this.getEndpoint(`/api/categories/${id}`);
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  }

  async deleteCategory(id: string) {
    const endpoint = this.getEndpoint(`/api/categories/${id}`);
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  async getCategoryProducts(id: string, params: {
    page?: number;
    limit?: number;
    activeOnly?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
    
    const endpoint = this.getEndpoint(`/api/categories/${id}/products?${searchParams.toString()}`);
    return this.request(endpoint);
  }

  async reorderCategories(categoryIds: string[]) {
    const endpoint = this.getEndpoint('/api/categories/reorder');
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify({ categoryIds }),
    });
  }

  async getCategoryHierarchy() {
    const endpoint = this.getEndpoint('/api/categories/hierarchy');
    return this.request(endpoint);
  }

  async updateCategoryProductCounts() {
    const endpoint = this.getEndpoint('/api/categories/bulk-update-counts');
    return this.request(endpoint, {
      method: 'POST',
    });
  }
}

// Create and export API client instance
export const api = new ApiClient(API_BASE_URL);

// Helper function to convert ProductFormData to FormData for API
export const productFormDataToFormData = (productData: any, images?: File[]): FormData => {
  const formData = new FormData();
  
  // Add individual form fields (not as JSON string)
  formData.append('produktnavn', productData.produktnavn || '');
  formData.append('beskrivelse', productData.beskrivelse || '');
  formData.append('eanNummer', productData.eanNummer || '');
  formData.append('enhed', productData.enhed || '');
  formData.append('basispris', productData.basispris?.toString() || '0');
  formData.append('kategori', JSON.stringify(productData.kategori));
  formData.append('lagerstyring', JSON.stringify(productData.lagerstyring));
  formData.append('aktiv', productData.aktiv?.toString() || 'true');
  
  // Add image files
  if (images && images.length > 0) {
    images.forEach((file, index) => {
      formData.append('billeder', file);
    });
  }
  
  console.log('📦 FormData prepared:', {
    fields: Array.from(formData.keys()),
    imageCount: images?.length || 0
  });
  
  return formData;
};

// Error handling helper
export const handleApiError = (error: any) => {
  if (error.validationErrors) {
    return {
      type: 'validation',
      message: 'Valideringsfejl',
      errors: error.validationErrors
    };
  }
  
  return {
    type: 'general',
    message: error.message || 'Der opstod en uventet fejl'
  };
}; 