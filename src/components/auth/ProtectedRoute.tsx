import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { isAdmin, isCustomer } from '../../lib/auth';
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
  const { user, isLoading, isAuthenticated } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Kontrollerer adgang...</span>
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // If admin access is required but user is not admin
  if (requireAdmin && (!user || !isAdmin(user))) {
    return <Navigate to="/login?type=admin" replace />;
  }

  // If customer access is required but user is not customer
  if (requireCustomer && (!user || !isCustomer(user))) {
    return <Navigate to="/login?type=customer" replace />;
  }

  // If user is authenticated but shouldn't access this route (e.g., login page)
  if (!requireAuth && isAuthenticated) {
    // Redirect based on user type
    if (user && isAdmin(user)) {
      return <Navigate to="/admin" replace />;
    } else if (user && isCustomer(user)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}; 