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
    
    console.log('🌐 Making API request to:', url);
    console.log('📤 Request method:', options.method || 'GET');
    console.log('📦 Request body type:', options.body ? options.body.constructor.name : 'none');
    
    // CRITICAL SECURITY FIX: Enhanced token validation
    const token = localStorage.getItem('accessToken');
    
    // Only set default Content-Type if not explicitly overridden
    const defaultHeaders: HeadersInit = {};
    
    // Don't set Content-Type for FormData - let browser set it with boundary
    if (!(options.body instanceof FormData)) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    if (token) {
      // CRITICAL SECURITY FIX: Strict token validation before every request
      if (this.isTokenExpired(token)) {
        console.warn('🚨 SECURITY: Token expired before request - attempting refresh...');
        const refreshed = await this.refreshToken();
        if (refreshed) {
          const newToken = localStorage.getItem('accessToken');
          if (newToken && !this.isTokenExpired(newToken)) {
            defaultHeaders.Authorization = `Bearer ${newToken}`;
            console.log('✅ SECURITY: Using refreshed token');
          } else {
            console.error('🚨 SECURITY: Refreshed token is also expired!');
            this.clearTokens();
            this.redirectToLogin();
            throw new Error('Session expired. Please log in again.');
          }
        } else {
          // If refresh failed, clear tokens and redirect to login
          console.error('🚨 SECURITY: Token refresh failed - forcing logout');
          this.clearTokens();
          this.redirectToLogin();
          throw new Error('Session expired. Please log in again.');
        }
      } else {
        // CRITICAL SECURITY FIX: Check if token is expiring soon (within 2 minutes)
        if (this.isTokenExpiringSoon(token, 2)) {
          console.warn('⚠️ SECURITY: Token expiring soon - attempting proactive refresh...');
          // Attempt refresh but don't block the request if it fails
          this.refreshToken().catch(error => {
            console.warn('⚠️ SECURITY: Proactive token refresh failed:', error);
          });
        }
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

    console.log('📋 Final request headers:', config.headers);

    try {
      console.log('🚀 Sending request...');
      const startTime = Date.now();
      const response = await fetch(url, config);
      const duration = Date.now() - startTime;
      
      console.log(`📡 Response status: ${response.status} for ${url}`);
      console.log(`⏱️ Request duration: ${duration}ms`);
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
          console.log('📥 Response data:', data);
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
      
      // CRITICAL SECURITY FIX: Enhanced auth error handling
      if (response.status === 401 || response.status === 403) {
        console.warn('🚨 SECURITY: Server returned auth error - token may be expired');
        
        // Check if we have a token and if it's expired
        const currentToken = localStorage.getItem('accessToken');
        if (currentToken && this.isTokenExpired(currentToken)) {
          console.warn('🚨 SECURITY: Confirmed token is expired - attempting refresh');
          const refreshed = await this.refreshToken();
          if (refreshed) {
            // Retry the request with new token
            const newToken = localStorage.getItem('accessToken');
            if (newToken && !this.isTokenExpired(newToken)) {
              const retryConfig = {
                ...config,
                headers: {
                  ...config.headers,
                  Authorization: `Bearer ${newToken}`,
                },
              };
              console.log('🔄 Retrying request with new token...');
              const retryResponse = await fetch(url, retryConfig);
              const retryContentType = retryResponse.headers.get('content-type');
              
              if (retryContentType && retryContentType.includes('application/json')) {
                data = await retryResponse.json();
              } else {
                throw new Error(`Server returned non-JSON response on retry: ${retryResponse.status}`);
              }
              
              if (!retryResponse.ok) {
                // If retry also fails with auth error, force logout
                if (retryResponse.status === 401 || retryResponse.status === 403) {
                  console.error('🚨 SECURITY: Retry also failed with auth error - forcing logout');
                  this.clearTokens();
                  this.redirectToLogin();
                  throw new Error('Session expired. Please log in again.');
                }
                throw new Error(data.error || `HTTP error! status: ${retryResponse.status}`);
              }
              console.log('✅ Retry successful');
              return data;
            } else {
              console.error('🚨 SECURITY: New token is also expired!');
              this.clearTokens();
              this.redirectToLogin();
              throw new Error('Session expired. Please log in again.');
            }
          } else {
            console.error('🚨 SECURITY: Token refresh failed - forcing logout');
            this.clearTokens();
            this.redirectToLogin();
            throw new Error('Session expired. Please log in again.');
          }
        } else {
          // Token seems valid but server rejected it - force logout
          console.error('🚨 SECURITY: Server rejected valid token - forcing logout');
          this.clearTokens();
          this.redirectToLogin();
          throw new Error('Session expired. Please log in again.');
        }
      }
      
      if (!response.ok) {
        console.error('❌ Request failed:', data);
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      console.log(`📊 API ${options.method || 'GET'} ${url}: ${duration}ms ✅`);
      return data;
    } catch (error) {
      console.error('❌ API request failed:', error);
      throw error;
    }
  }

  // CRITICAL SECURITY FIX: Enhanced token expiration check
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      const isExpired = payload.exp < currentTime;
      
      if (isExpired) {
        console.warn('🚨 SECURITY: Token has expired!', {
          tokenExp: new Date(payload.exp * 1000).toISOString(),
          currentTime: new Date().toISOString(),
          expiredBy: Math.floor(currentTime - payload.exp) + ' seconds'
        });
      }
      
      return isExpired;
    } catch (error) {
      console.error('🚨 SECURITY: Error parsing token - treating as expired:', error);
      return true; // Assume expired if we can't parse
    }
  }

  // CRITICAL SECURITY FIX: Check if token is expiring soon
  private isTokenExpiringSoon(token: string, minutesBeforeExpiry: number = 5): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      const timeUntilExpiry = payload.exp - currentTime;
      const minutesUntilExpiry = timeUntilExpiry / 60;
      
      const expiringSoon = minutesUntilExpiry <= minutesBeforeExpiry && minutesUntilExpiry > 0;
      
      if (expiringSoon) {
        console.warn('⚠️ SECURITY: Token expiring soon!', {
          minutesUntilExpiry: Math.floor(minutesUntilExpiry),
          expiresAt: new Date(payload.exp * 1000).toISOString()
        });
      }
      
      return expiringSoon;
    } catch (error) {
      console.error('🚨 SECURITY: Error parsing token for expiry check:', error);
      return true; // Assume expiring if we can't parse
    }
  }

  // CRITICAL SECURITY FIX: Enhanced refresh token logic
  private async refreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      console.warn('🚨 SECURITY: No refresh token available');
      return false;
    }

    // CRITICAL SECURITY FIX: Check if refresh token is expired
    if (this.isTokenExpired(refreshToken)) {
      console.error('🚨 SECURITY: Refresh token is expired - cannot refresh');
      this.clearTokens();
      return false;
    }

    try {
      console.log('🔄 SECURITY: Attempting token refresh...');
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
          // CRITICAL SECURITY FIX: Validate new tokens before storing
          const { accessToken, refreshToken: newRefreshToken } = data.tokens;
          
          if (this.isTokenExpired(accessToken)) {
            console.error('🚨 SECURITY: Server returned expired access token!');
            this.clearTokens();
            return false;
          }
          
          if (this.isTokenExpired(newRefreshToken)) {
            console.error('🚨 SECURITY: Server returned expired refresh token!');
            this.clearTokens();
            return false;
          }
          
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          console.log('✅ SECURITY: Token refresh successful');
          return true;
        } else {
          console.error('🚨 SECURITY: Token refresh failed - invalid response');
          this.clearTokens();
          return false;
        }
      } else {
        console.error('🚨 SECURITY: Token refresh failed - server error:', response.status);
        this.clearTokens();
        return false;
      }
    } catch (error) {
      console.error('🚨 SECURITY: Token refresh failed:', error);
      this.clearTokens();
      return false;
    }
  }

  // CRITICAL SECURITY FIX: Enhanced token cleanup
  private clearTokens(): void {
    console.log('🧹 SECURITY: Clearing all tokens');
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

  // CRITICAL SECURITY FIX: Smart redirect to login
  private redirectToLogin(): void {
    const currentPath = window.location.pathname;
    console.log('🚪 SECURITY: Redirecting to login from:', currentPath);
    
    // Don't redirect if already on login page
    if (currentPath === '/login' || currentPath === '/admin-login') {
      return;
    }
    
    // Redirect to appropriate login page
    if (currentPath.includes('/admin') || currentPath.includes('/super')) {
      window.location.href = '/admin-login';
    } else {
      window.location.href = '/login';
    }
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
    console.log('🛍️ Creating product via endpoint:', endpoint);
    console.log('📦 FormData keys:', Array.from(productData.keys()));
    
    return this.request(endpoint, {
      method: 'POST',
      body: productData,
      // Don't set any headers - let browser handle FormData with proper boundary
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

  // EAN lookup for visual feedback (non-blocking)
  async lookupEAN(ean: string) {
    const endpoint = this.getEndpoint(`/api/products?ean=${encodeURIComponent(ean)}`);
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
export const productFormDataToFormData = (productData: any, images?: File[], existingImages?: any[], deletedImageIds?: string[]): FormData => {
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
  
  // Add existing images information (for edit mode)
  if (existingImages && existingImages.length > 0) {
    console.log('📸 Existing images being sent to backend:', existingImages);
    console.log('📸 Detailed existing images data:', existingImages.map((img, index) => ({
      index,
      _id: img._id,
      filename: img.filename,
      isPrimary: img.isPrimary,
      isExisting: img.isExisting,
      url: img.url ? img.url.substring(0, 50) + '...' : 'no url'
    })));
    formData.append('existingImages', JSON.stringify(existingImages));
  }
  
  // Add deleted image IDs (for edit mode)
  if (deletedImageIds && deletedImageIds.length > 0) {
    console.log('🗑️ Deleted image IDs being sent:', deletedImageIds);
    formData.append('deletedImageIds', JSON.stringify(deletedImageIds));
  }
  
  // Add new image files in correct order (primary first)
  if (images && images.length > 0) {
    // If we have ProductImage objects with isPrimary, sort them
    if (productData.billeder && productData.billeder.length > 0) {
      const imageData = productData.billeder;
      
      // Sort images so primary comes first
      const sortedImages = [...imageData].sort((a, b) => {
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        return 0;
      });
      
      // Add files in the sorted order (only new uploads)
      sortedImages.forEach((imageData, index) => {
        if (!imageData.isExisting && imageData.file) {
          formData.append('billeder', imageData.file);
        }
      });
    } else {
      // Fallback: just add images as provided
      images.forEach((file, index) => {
        formData.append('billeder', file);
      });
    }
  }
  
  console.log('📦 FormData prepared:', {
    fields: Array.from(formData.keys()),
    newImageCount: images?.length || 0,
    existingImageCount: existingImages?.length || 0,
    deletedImageCount: deletedImageIds?.length || 0,
    primaryImageFirst: productData.billeder?.some((img: any) => img.isPrimary) || false
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