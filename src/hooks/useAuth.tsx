import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, authService, tokenManager, LoginResponse } from '../lib/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, userType: 'customer' | 'admin') => Promise<LoginResponse>;
  logout: () => void;
  refreshUser: () => void;
  validateSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Validate session on app start
    const validateInitialSession = async () => {
      try {
        const isValid = await authService.validateSession();
        if (isValid) {
          const savedUser = tokenManager.getUser();
          setUser(savedUser);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Session validation failed:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    validateInitialSession();

    // Set up periodic session validation (every 5 minutes)
    const sessionCheckInterval = setInterval(async () => {
      if (user) {
        console.log('🔄 Periodic session validation...');
        const isValid = await authService.validateSession();
        if (!isValid) {
          console.log('🚫 Session expired during periodic check');
          setUser(null);
          // Force redirect to login
          window.location.href = '/super/admin';
        }
      }
    }, 5 * 60 * 1000); // 5 minutes

    // Check session when window gets focus (user returns to tab)
    const handleWindowFocus = async () => {
      if (user) {
        console.log('🔍 Window focus - checking session...');
        const isValid = await authService.validateSession();
        if (!isValid) {
          console.log('🚫 Session expired on window focus');
          setUser(null);
          window.location.href = '/super/admin';
        }
      }
    };

    window.addEventListener('focus', handleWindowFocus);

    // Cleanup interval and event listener on unmount
    return () => {
      clearInterval(sessionCheckInterval);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [user]);

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
    // Force a complete page reload to clear any cached state
    window.location.href = '/super/admin';
  };

  const refreshUser = () => {
    const savedUser = tokenManager.getUser();
    setUser(savedUser);
  };

  const validateSession = async (): Promise<boolean> => {
    const isValid = await authService.validateSession();
    if (!isValid) {
      setUser(null);
    }
    return isValid;
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
    validateSession,
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