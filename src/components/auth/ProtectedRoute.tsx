import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { isAdmin, isCustomer, authService } from '../../lib/auth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requireCustomer?: boolean;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireAdmin = false,
  requireCustomer = false,
  redirectTo = '/login'
}) => {
  const { 
    user, 
    adminUser, 
    customerUser, 
    isLoading, 
    profileLoading, 
    isAuthenticated, 
    isAdminAuthenticated, 
    isCustomerAuthenticated 
  } = useAuth();
  const currentPath = window.location.pathname;

  // Show loading spinner while checking authentication OR while profile is loading
  if (isLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Kontrollerer adgang...</span>
      </div>
    );
  }

  // Determine required session type based on route
  const isAdminRoute = currentPath.includes('/admin') || currentPath.includes('/super');
  const isCustomerRoute = currentPath.includes('/dashboard') && !currentPath.includes('/admin');

  // If admin route is required
  if (requireAdmin || isAdminRoute) {
    if (!isAdminAuthenticated || !adminUser || !isAdmin(adminUser)) {
      // Don't redirect if we're already on the admin login page
      if (currentPath === '/super/admin') {
        return <>{children}</>;
      }
      return <Navigate to="/super/admin" replace />;
    }
  }

  // If customer route is required
  if (requireCustomer || isCustomerRoute) {
    if (!isCustomerAuthenticated || !customerUser || !isCustomer(customerUser)) {
      return <Navigate to="/login" replace />;
    }
  }

  // General authentication check (fallback)
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}; 