import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, authService, tokenManager, LoginResponse, isAdmin } from '../lib/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, userType: 'customer' | 'admin') => Promise<LoginResponse>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
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

  // Enhanced initialization with profile data sync
  useEffect(() => {
    const initializeAuth = async () => {
      const savedUser = tokenManager.getUser();
      const accessToken = tokenManager.getAccessToken();
      
      if (savedUser && accessToken) {
        // Check if token is expired
        if (isTokenExpired(accessToken)) {
          console.log('🔄 Token expired on app init, attempting refresh...');
          const refreshed = await attemptTokenRefresh();
          if (!refreshed) {
            // If refresh failed, clear everything and don't set user
            tokenManager.clearTokens();
            setUser(null);
            setIsLoading(false);
            return;
          }
        }
        
        setUser(savedUser);
        
        // For admin users, fetch fresh profile data to ensure we have latest profilePictureUrl
        if (isAdmin(savedUser)) {
          try {
            console.log('🔄 Fetching fresh admin profile data on app initialization...');
            const profileResponse = await authService.getAdminProfile();
            if (profileResponse.success && profileResponse.admin) {
              console.log('✅ Fresh profile data fetched:', {
                hasProfilePicture: !!profileResponse.admin.profilePictureUrl,
                profilePictureUrl: profileResponse.admin.profilePictureUrl
              });
              tokenManager.setUser(profileResponse.admin);
              setUser(profileResponse.admin);
            }
          } catch (error) {
            console.warn('⚠️ Could not fetch fresh profile data on init:', error);
            // Continue with saved user data if profile fetch fails
          }
        }
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
        setUser(response.user);
        
        // For admin users, fetch fresh profile data immediately after login
        // This ensures we have the most up-to-date profile information including images
        if (userType === 'admin') {
          try {
            console.log('🔄 Fetching fresh admin profile data after login...');
            const profileResponse = await authService.getAdminProfile();
            if (profileResponse.success && profileResponse.admin) {
              console.log('✅ Fresh profile data fetched after login:', {
                hasProfilePicture: !!profileResponse.admin.profilePictureUrl,
                profilePictureUrl: profileResponse.admin.profilePictureUrl
              });
              tokenManager.setUser(profileResponse.admin);
              setUser(profileResponse.admin);
            }
          } catch (error) {
            console.warn('⚠️ Could not fetch fresh profile data after login:', error);
            // Continue with login response data if profile fetch fails
          }
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

  const logout = () => {
    authService.logout();
    setUser(null);
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
    isLoading,
    isAuthenticated: !!user,
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