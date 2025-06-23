import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, authService, tokenManager, LoginResponse, isAdmin } from '../lib/auth';

interface AuthContextType {
  user: User | null;
  adminUser: User | null;
  customerUser: User | null;
  isLoading: boolean;
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

  // Utility function to check if token is expired
  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error parsing token:', error);
      return true; // Assume expired if we can't parse
    }
  };

  // Utility function to attempt token refresh
  const attemptTokenRefresh = async (): Promise<boolean> => {
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await authService.refreshToken();
      if (response.success && response.tokens) {
        tokenManager.setTokens(response.tokens);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    return false;
  };

  // Enhanced initialization with separate session support
  useEffect(() => {
    const initializeAuth = async () => {
      const savedAdminUser = authService.getUser('admin');
      const savedCustomerUser = authService.getUser('customer');
      const adminToken = authService.isAuthenticated('admin');
      const customerToken = authService.isAuthenticated('customer');
      
      // Initialize admin session
      if (savedAdminUser && adminToken) {
        setAdminUser(savedAdminUser);
        
        // Fetch fresh admin profile data
        try {
          console.log('🔄 Fetching fresh admin profile data on app initialization...');
          const profileResponse = await authService.getAdminProfile();
          if (profileResponse.success && profileResponse.admin) {
            console.log('✅ Fresh admin profile data fetched');
            tokenManager.setUser(profileResponse.admin, 'admin');
            setAdminUser(profileResponse.admin);
          }
        } catch (error) {
          console.warn('⚠️ Could not fetch fresh admin profile data on init:', error);
        }
      }
      
      // Initialize customer session
      if (savedCustomerUser && customerToken) {
        setCustomerUser(savedCustomerUser);
      }
      
      // Set primary user based on current route
      const currentPath = window.location.pathname;
      if (currentPath.includes('/admin') || currentPath.includes('/super')) {
        setUser(savedAdminUser);
      } else if (currentPath.includes('/dashboard') && !currentPath.includes('/admin')) {
        setUser(savedCustomerUser);
      } else {
        // Default to admin if both are logged in, otherwise use whichever is available
        setUser(savedAdminUser || savedCustomerUser);
      }
      
      setIsLoading(false);
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
          setUser(response.user); // Set as primary user
        }
        
        return response;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = (userType?: 'customer' | 'admin') => {
    authService.logout(userType);
    
    if (userType === 'admin') {
      setAdminUser(null);
      // If admin logs out but customer is still logged in, switch to customer
      if (customerUser) {
        setUser(customerUser);
      } else {
        setUser(null);
      }
    } else if (userType === 'customer') {
      setCustomerUser(null);
      // If customer logs out but admin is still logged in, switch to admin
      if (adminUser) {
        setUser(adminUser);
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