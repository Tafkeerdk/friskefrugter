import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { authService, User, LoginResponse, tokenManager } from '../lib/auth';

// Token validation helpers
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    console.error('🚨 SECURITY: Error parsing token:', error);
    return true;
  }
};

const isTokenExpiringSoon = (token: string, minutesBeforeExpiry: number = 5): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    const expiryThreshold = currentTime + (minutesBeforeExpiry * 60);
    return payload.exp < expiryThreshold;
  } catch (error) {
    console.error('🚨 SECURITY: Error parsing token for expiry check:', error);
    return true;
  }
};

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
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Add ref to prevent multiple concurrent initializations
  const initializingRef = useRef(false);
  const initializedRef = useRef(false);

  // Cleanup expired tokens
  const validateAndCleanupExpiredTokens = (): boolean => {
    const adminToken = tokenManager.getAccessToken('admin');
    const customerToken = tokenManager.getAccessToken('customer');
    let hasValidTokens = false;

    if (adminToken && isTokenExpired(adminToken)) {
      console.warn('🚨 SECURITY: Admin token expired - clearing');
      tokenManager.clearTokens('admin');
    } else if (adminToken) {
      hasValidTokens = true;
    }

    if (customerToken && isTokenExpired(customerToken)) {
      console.warn('🚨 SECURITY: Customer token expired - clearing');
      tokenManager.clearTokens('customer');
    } else if (customerToken) {
      hasValidTokens = true;
    }

    return hasValidTokens;
  };

  // Token refresh with validation
  const attemptTokenRefresh = async (): Promise<boolean> => {
    try {
      if (import.meta.env.DEV) {
        console.log('🔄 SECURITY: Attempting token refresh');
      }
      const result = await authService.refreshToken();
      if (result.success) {
        if (import.meta.env.DEV) {
          console.log('✅ SECURITY: Token refresh successful');
        }
        return true;
      } else {
        console.warn('⚠️ SECURITY: Token refresh failed:', result.message);
        return false;
      }
    } catch (error) {
      console.error('❌ SECURITY: Token refresh error:', error);
      return false;
    }
  };

  // Initialize auth state on mount
  useEffect(() => {
    // Prevent multiple concurrent initializations
    if (initializingRef.current || initializedRef.current) {
      console.log('🔄 Auth initialization already in progress or completed, skipping...');
      return;
    }

    initializingRef.current = true;

    // Periodic token validation
    const validateTokensPeriodically = () => {
      const hasValidTokens = validateAndCleanupExpiredTokens();
      if (!hasValidTokens) {
        setUser(null);
        setAdminUser(null);
        setCustomerUser(null);
      }
    };

    // Set up periodic validation
    const validationInterval = setInterval(validateTokensPeriodically, 60000); // Every minute

    // Handle focus events for token validation
    const handleFocus = () => {
      validateTokensPeriodically();
    };

    window.addEventListener('focus', handleFocus);

    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing auth state with STRICT security validation...');
        
        // Get stored tokens and users
        const savedAdminUser = tokenManager.getUser('admin');
        const savedCustomerUser = tokenManager.getUser('customer');
        const adminToken = tokenManager.getAccessToken('admin');
        const customerToken = tokenManager.getAccessToken('customer');
        
        console.log('📊 Auth state check:', {
          hasAdminUser: !!savedAdminUser,
          hasCustomerUser: !!savedCustomerUser,
          hasValidAdminToken: adminToken ? !isTokenExpired(adminToken) : null,
          hasValidCustomerToken: customerToken ? !isTokenExpired(customerToken) : null,
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
          
          // Only fetch fresh customer profile if admin is NOT logged in to avoid 403 conflicts
          const hasValidAdminToken = adminToken && !isTokenExpired(adminToken);
          if (!hasValidAdminToken) {
          try {
            console.log('🔄 Fetching fresh customer profile data on init...');
            const profileResponse = await authService.getCustomerProfile();
            if (profileResponse.success && profileResponse.customer) {
              // Validate that essential customer data exists before setting state
              const customer = profileResponse.customer;
                if (customer && customer.contactPersonName && customer.email && customer.companyName) {
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
          } else {
            console.log('🔒 Admin session active - skipping customer profile fetch to avoid conflicts');
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
        
      } catch (error) {
        console.error('❌ SECURITY: Auth initialization error:', error);
        // Clear all state on initialization error
        setUser(null);
        setAdminUser(null);
        setCustomerUser(null);
        tokenManager.clearTokens();
      } finally {
        setIsLoading(false);
        setProfileLoading(false);
        initializingRef.current = false;
        initializedRef.current = true;
        console.log('✅ SECURITY: Auth initialization complete with strict validation');
      }
    };

    initializeAuth();

    // Cleanup
    return () => {
      clearInterval(validationInterval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []); // Empty dependency array to run only once

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
          
          // Fetch fresh customer profile data - NO DOUBLE CALL
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
    if (savedUser.userType === 'admin') {
      try {
        console.log('🔄 Refreshing admin profile data from server...');
        const profileResponse = await authService.getAdminProfile();
        if (profileResponse.success && profileResponse.admin) {
          console.log('✅ Admin profile refreshed:', {
            hasProfilePicture: !!profileResponse.admin.profilePictureUrl,
            profilePictureUrl: profileResponse.admin.profilePictureUrl
          });
          tokenManager.setUser(profileResponse.admin, 'admin');
          setAdminUser(profileResponse.admin);
          setUser(profileResponse.admin);
          return;
        }
      } catch (error) {
        console.warn('⚠️ Could not refresh admin profile data from server:', error);
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
            profilePictureUrl: profileResponse.customer.profilePictureUrl
          });
          tokenManager.setUser(profileResponse.customer, 'customer');
          setCustomerUser(profileResponse.customer);
          setUser(profileResponse.customer);
          return;
        }
      } catch (error) {
        console.warn('⚠️ Could not refresh customer profile data from server:', error);
      }
    }

    // Fallback: use stored user data
    console.log('🔄 Using stored user data as fallback');
    setUser(savedUser);
  };

  const isAuthenticated = !!user;
  const isAdminAuthenticated = !!adminUser;
  const isCustomerAuthenticated = !!customerUser;

  return (
    <AuthContext.Provider
      value={{
        user,
        adminUser,
        customerUser,
        isLoading,
        profileLoading,
        isAuthenticated,
        isAdminAuthenticated,
        isCustomerAuthenticated,
        login,
        logout,
        refreshUser,
      }}
    >
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