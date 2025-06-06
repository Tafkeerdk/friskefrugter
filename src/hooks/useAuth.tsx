import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, authService, tokenManager, LoginResponse } from '../lib/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, userType: 'customer' | 'admin') => Promise<LoginResponse>;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing user session on app start
    const savedUser = tokenManager.getUser();
    const accessToken = tokenManager.getAccessToken();
    
    if (savedUser && accessToken) {
      setUser(savedUser);
    }
    
    setIsLoading(false);
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

  const refreshUser = () => {
    const savedUser = tokenManager.getUser();
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