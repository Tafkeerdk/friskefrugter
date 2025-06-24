import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, authService, tokenManager, LoginResponse, isAdmin } from '../lib/auth';

interface AuthContextType {
  user: User | null;
  adminUser: User | null;
  customerUser: User | null;
  isLoading: boolean;
  profileLoading: boolean;
  isAuthenticated: boolean;
  isAdminAuthenticated: boolean;
  isCustomerAuthenticated: boolean;
  login: (email: string, password: string, userType: 'customer' | 'admin') => Promise<LoginResponse>;
  logout: (userType?: 'customer' | 'admin') => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [customerUser, setCustomerUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  // CRITICAL SECURITY FIX: Enhanced token expiration check
  const isTokenExpired = (token: string): boolean => {
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
  };

  // CRITICAL SECURITY FIX: Check if token is expiring soon (within 5 minutes)
  const isTokenExpiringSoon = (token: string, minutesBeforeExpiry: number = 5): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      const timeUntilExpiry = payload.exp - currentTime;
      const minutesUntilExpiry = timeUntilExpiry / 60;
      
      return minutesUntilExpiry <= minutesBeforeExpiry && minutesUntilExpiry > 0;
    } catch (error) {
      return true; // Assume expiring if we can't parse
    }
  };

  // CRITICAL SECURITY FIX: Force logout if tokens are expired
  const validateAndCleanupExpiredTokens = (): boolean => {
    let hasValidSession = false;
    
    // Check admin session
    const adminToken = tokenManager.getAccessToken('admin');
    if (adminToken) {
      if (isTokenExpired(adminToken)) {
        console.warn('🚨 SECURITY: Admin token expired - forcing logout');
        tokenManager.clearTokens('admin');
        setAdminUser(null);
      } else {
        hasValidSession = true;
      }
    }
    
    // Check customer session
    const customerToken = tokenManager.getAccessToken('customer');
    if (customerToken) {
      if (isTokenExpired(customerToken)) {
        console.warn('🚨 SECURITY: Customer token expired - forcing logout');
        tokenManager.clearTokens('customer');
        setCustomerUser(null);
      } else {
        hasValidSession = true;
      }
    }
    
    return hasValidSession;
  };

  // CRITICAL SECURITY FIX: Attempt token refresh only if refresh token is valid
  const attemptTokenRefresh = async (): Promise<boolean> => {
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) {
      console.warn('🚨 SECURITY: No refresh token available');
      return false;
    }

    // Check if refresh token is expired
    if (isTokenExpired(refreshToken)) {
      console.warn('🚨 SECURITY: Refresh token expired - forcing complete logout');
      tokenManager.clearTokens();
      setUser(null);
      setAdminUser(null);
      setCustomerUser(null);
      return false;
    }

    try {
      const response = await authService.refreshToken();
      if (response.success && response.tokens) {
        tokenManager.setTokens(response.tokens);
        if (import.meta.env.DEV) {
          console.log('✅ SECURITY: Token refresh successful');
        }
        return true;
      } else {
        console.warn('🚨 SECURITY: Token refresh failed - server rejected');
        return false;
      }
    } catch (error) {
      console.error('🚨 SECURITY: Token refresh failed:', error);
      return false;
    }
  };

  // CRITICAL SECURITY FIX: Periodic token validation
  useEffect(() => {
    const validateTokensPeriodically = () => {
      const hasValidSession = validateAndCleanupExpiredTokens();
      
      if (!hasValidSession && (adminUser || customerUser)) {
        console.warn('🚨 SECURITY: No valid sessions found - clearing user state');
        setUser(null);
        setAdminUser(null);
        setCustomerUser(null);
        
        // Redirect to login if on protected route
        const currentPath = window.location.pathname;
        if (currentPath.includes('/admin') || currentPath.includes('/dashboard')) {
          console.warn('🚨 SECURITY: Redirecting to login due to expired session');
          window.location.href = '/login';
        }
      }
    };

    // CRITICAL SECURITY FIX: Check tokens every 30 seconds
    const tokenValidationInterval = setInterval(validateTokensPeriodically, 30000);

    // CRITICAL SECURITY FIX: Also check on focus (when user returns to tab)
    const handleFocus = () => {
      if (import.meta.env.DEV) {
        console.log('🔍 SECURITY: Page focused - validating tokens');
      }
      validateTokensPeriodically();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(tokenValidationInterval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [adminUser, customerUser]);

  // Enhanced initialization with strict security validation
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🔄 Initializing auth state with STRICT security validation...');
      
      // CRITICAL SECURITY FIX: Validate all tokens before setting user state
      const hasValidSession = validateAndCleanupExpiredTokens();
      
      if (!hasValidSession) {
        console.log('❌ SECURITY: No valid sessions found during initialization');
        setIsLoading(false);
        setProfileLoading(false);
        return;
      }
      
      const savedAdminUser = authService.getUser('admin');
      const savedCustomerUser = authService.getUser('customer');
      const adminToken = tokenManager.getAccessToken('admin');
      const customerToken = tokenManager.getAccessToken('customer');
      
      console.log('📊 Auth state check:', {
        hasAdminUser: !!savedAdminUser,
        hasCustomerUser: !!savedCustomerUser,
        hasValidAdminToken: adminToken && !isTokenExpired(adminToken),
        hasValidCustomerToken: customerToken && !isTokenExpired(customerToken),
        currentPath: window.location.pathname
      });
      
      // Initialize admin session ONLY if token is valid
      if (savedAdminUser && adminToken && !isTokenExpired(adminToken)) {
        if (import.meta.env.DEV) {
          console.log('✅ SECURITY: Setting admin user with valid token');
        }
        setAdminUser(savedAdminUser);
        
        // Check if token is expiring soon and attempt refresh
        if (isTokenExpiringSoon(adminToken)) {
          if (import.meta.env.DEV) {
          console.log('⚠️ SECURITY: Admin token expiring soon - attempting refresh');
        }
          await attemptTokenRefresh();
        }
        
        // Fetch fresh admin profile data (but don't block initialization)
        authService.getAdminProfile()
          .then(profileResponse => {
            if (profileResponse.success && profileResponse.admin) {
              console.log('✅ Fresh admin profile data fetched');
              tokenManager.setUser(profileResponse.admin, 'admin');
              setAdminUser(profileResponse.admin);
            }
          })
          .catch(error => {
            console.warn('⚠️ Could not fetch fresh admin profile data on init:', error);
          });
      } else if (savedAdminUser || adminToken) {
        console.warn('🚨 SECURITY: Admin session invalid - clearing');
        tokenManager.clearTokens('admin');
        setAdminUser(null);
      }
      
      // Initialize customer session ONLY if token is valid
      if (savedCustomerUser && customerToken && !isTokenExpired(customerToken)) {
        if (import.meta.env.DEV) {
          console.log('✅ SECURITY: Setting customer user with valid token');
        }
        setCustomerUser(savedCustomerUser);
        
        // Check if token is expiring soon and attempt refresh
        if (isTokenExpiringSoon(customerToken)) {
          if (import.meta.env.DEV) {
          console.log('⚠️ SECURITY: Customer token expiring soon - attempting refresh');
        }
          await attemptTokenRefresh();
        }
        
        // Fetch fresh customer profile data
        try {
          console.log('🔄 Fetching fresh customer profile data on init...');
          const profileResponse = await authService.getCustomerProfile();
          if (profileResponse.success && profileResponse.customer) {
            // Validate that essential customer data exists before setting state
            const customer = profileResponse.customer;
            if (customer.contactPersonName && customer.email && customer.companyName) {
              console.log('✅ Fresh customer profile data fetched on init');
              tokenManager.setUser(customer, 'customer');
              setCustomerUser(customer);
            } else {
              console.warn('⚠️ Customer profile data incomplete on init');
            }
          } else {
            console.warn('⚠️ Customer profile fetch failed on init');
          }
        } catch (error) {
          console.warn('⚠️ Could not fetch fresh customer profile data on init:', error);
        }
      } else if (savedCustomerUser || customerToken) {
        console.warn('🚨 SECURITY: Customer session invalid - clearing');
        tokenManager.clearTokens('customer');
        setCustomerUser(null);
      }
      
      // Set primary user based on current route and valid sessions
      const currentPath = window.location.pathname;
      const validAdminUser = adminToken && !isTokenExpired(adminToken) ? savedAdminUser : null;
      const validCustomerUser = customerToken && !isTokenExpired(customerToken) ? savedCustomerUser : null;
      
      if (currentPath.includes('/admin') || currentPath.includes('/super')) {
        console.log('🔒 Admin route detected - setting admin as primary user');
        setUser(validAdminUser);
      } else if (currentPath.includes('/dashboard') && !currentPath.includes('/admin')) {
        console.log('👤 Customer route detected - setting customer as primary user');
        setUser(validCustomerUser);
      } else {
        // Default to admin if both are logged in, otherwise use whichever is available
        const primaryUser = validAdminUser || validCustomerUser;
        console.log('🎯 Setting primary user:', primaryUser ? primaryUser.userType : 'none');
        setUser(primaryUser);
      }
      
      setIsLoading(false);
      setProfileLoading(false);
      console.log('✅ SECURITY: Auth initialization complete with strict validation');
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string, userType: 'customer' | 'admin') => {
    try {
      let response;
      
      if (userType === 'customer') {
        response = await authService.loginCustomer(email, password);
      } else {
        response = await authService.loginAdmin(email, password);
      }
      
      if (response.success) {
        // CRITICAL SECURITY FIX: Validate tokens immediately after login
        const { accessToken } = response.tokens;
        if (isTokenExpired(accessToken)) {
          console.error('🚨 SECURITY: Received expired token from server!');
          throw new Error('Server returned expired token');
        }
        
        // Set user in appropriate state
        if (userType === 'admin') {
          setAdminUser(response.user);
          
          // Fetch fresh admin profile data
          try {
            console.log('🔄 Fetching fresh admin profile data after login...');
            const profileResponse = await authService.getAdminProfile();
            if (profileResponse.success && profileResponse.admin) {
              console.log('✅ Fresh admin profile data fetched after login');
              tokenManager.setUser(profileResponse.admin, 'admin');
              setAdminUser(profileResponse.admin);
              setUser(profileResponse.admin); // Set as primary user
            }
          } catch (error) {
            console.warn('⚠️ Could not fetch fresh profile data after login:', error);
            setUser(response.user); // Fallback to login response
          }
        } else {
          setCustomerUser(response.user);
          setProfileLoading(true); // Start profile loading
          
          // Fetch fresh customer profile data
          try {
            console.log('🔄 Fetching fresh customer profile data after login...');
            const profileResponse = await authService.getCustomerProfile();
            if (profileResponse.success && profileResponse.customer) {
              // Validate that essential customer data exists before setting state
              const customer = profileResponse.customer;
              if (customer && customer.contactPersonName && customer.email && customer.companyName) {
                console.log('✅ Fresh customer profile data fetched after login');
                
                // Additional safety: wrap state updates in try-catch
                try {
                  tokenManager.setUser(customer, 'customer');
                  setCustomerUser(customer);
                  setUser(customer); // Set as primary user
                  setProfileLoading(false); // Profile loading complete
                } catch (stateError) {
                  console.error('❌ Error updating customer state after profile fetch:', stateError);
                  setUser(response.user); // Fallback to login response
                  setProfileLoading(false); // Profile loading complete (with fallback)
                }
              } else {
                console.warn('⚠️ Customer profile data incomplete, using login response');
                setUser(response.user); // Fallback to login response
                setProfileLoading(false); // Profile loading complete (with fallback)
              }
            } else {
              console.warn('⚠️ Customer profile fetch failed, using login response');
              setUser(response.user); // Fallback to login response
              setProfileLoading(false); // Profile loading complete (with fallback)
            }
          } catch (error) {
            console.warn('⚠️ Could not fetch fresh customer profile data after login:', error);
            setUser(response.user); // Fallback to login response
            setProfileLoading(false); // Profile loading complete (with fallback)
          }
        }
        
        if (import.meta.env.DEV) {
        console.log('✅ SECURITY: Login successful with valid tokens');
      }
        return response;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('❌ SECURITY: Login error:', error);
      throw error;
    }
  };

  const logout = (userType?: 'customer' | 'admin') => {
    console.log('🚪 SECURITY: Logging out', userType || 'all sessions');
    authService.logout(userType);
    
    if (userType === 'admin') {
      setAdminUser(null);
      // If admin logs out but customer is still logged in, switch to customer
      if (customerUser) {
        const customerToken = tokenManager.getAccessToken('customer');
        if (customerToken && !isTokenExpired(customerToken)) {
          setUser(customerUser);
        } else {
          tokenManager.clearTokens('customer');
          setCustomerUser(null);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } else if (userType === 'customer') {
      setCustomerUser(null);
      // If customer logs out but admin is still logged in, switch to admin
      if (adminUser) {
        const adminToken = tokenManager.getAccessToken('admin');
        if (adminToken && !isTokenExpired(adminToken)) {
          setUser(adminUser);
        } else {
          tokenManager.clearTokens('admin');
          setAdminUser(null);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } else {
      // Logout all
      setAdminUser(null);
      setCustomerUser(null);
      setUser(null);
    }
  };

  // Enhanced refreshUser function that actually fetches fresh data
  const refreshUser = async () => {
    const savedUser = tokenManager.getUser();
    if (!savedUser) {
      setUser(null);
      return;
    }

    // CRITICAL SECURITY FIX: Validate token before refreshing user data
    const userType = savedUser.userType as 'admin' | 'customer';
    const token = tokenManager.getAccessToken(userType);
    
    if (!token || isTokenExpired(token)) {
      console.warn('🚨 SECURITY: Token expired during refresh - clearing user');
      tokenManager.clearTokens(userType);
      setUser(null);
      if (userType === 'admin') setAdminUser(null);
      if (userType === 'customer') setCustomerUser(null);
      return;
    }

    // If it's an admin user, fetch fresh profile data from server
    if (isAdmin(savedUser)) {
      try {
        console.log('🔄 Refreshing admin profile data from server...');
        const profileResponse = await authService.getAdminProfile();
        if (profileResponse.success && profileResponse.admin) {
          console.log('✅ Admin profile refreshed:', {
            hasProfilePicture: !!profileResponse.admin.profilePictureUrl,
            profilePictureUrl: profileResponse.admin.profilePictureUrl
          });
          tokenManager.setUser(profileResponse.admin);
          setUser(profileResponse.admin);
          return;
        }
      } catch (error) {
        console.warn('⚠️ Could not refresh profile data from server:', error);
        // Check if error is due to token expiration
        if (error.message?.includes('expired') || error.message?.includes('unauthorized')) {
          console.warn('🚨 SECURITY: Token expired during profile refresh - forcing logout');
          logout('admin');
          return;
        }
      }
    }
    
    // If it's a customer user, fetch fresh profile data from server
    if (savedUser.userType === 'customer') {
      try {
        console.log('🔄 Refreshing customer profile data from server...');
        const profileResponse = await authService.getCustomerProfile();
        if (profileResponse.success && profileResponse.customer) {
          console.log('✅ Customer profile refreshed:', {
            hasProfilePicture: !!profileResponse.customer.profilePictureUrl,
            profilePictureUrl: profileResponse.customer.profilePictureUrl,
            companyName: profileResponse.customer.companyName,
            cvrNumber: profileResponse.customer.cvrNumber
          });
          tokenManager.setUser(profileResponse.customer, 'customer');
          setUser(profileResponse.customer);
          setCustomerUser(profileResponse.customer);
          return;
        }
      } catch (error) {
        console.warn('⚠️ Could not refresh customer profile data from server:', error);
        // Check if error is due to token expiration
        if (error.message?.includes('expired') || error.message?.includes('unauthorized')) {
          console.warn('🚨 SECURITY: Token expired during customer profile refresh - forcing logout');
          logout('customer');
          return;
        }
      }
    }
    
    // Fallback to localStorage data
    setUser(savedUser);
  };

  const value: AuthContextType = {
    user,
    adminUser,
    customerUser,
    isLoading,
    profileLoading,
    isAuthenticated: !!user,
    isAdminAuthenticated: !!adminUser,
    isCustomerAuthenticated: !!customerUser,
    login,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 