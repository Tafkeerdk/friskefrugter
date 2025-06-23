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
    return <Navigate to="/super/admin" replace />;
  }

  // If customer access is required but user is not customer
  if (requireCustomer && (!user || !isCustomer(user))) {
    return <Navigate to="/login" replace />;
  }

  // CRITICAL: Allow simultaneous admin and customer access
  // Admins should be able to access customer login to test customer experience
  // Only prevent customers from accessing admin-only areas
  if (!requireAuth && isAuthenticated) {
    const currentPath = window.location.pathname;
    
    // Only prevent customers from accessing admin login
    if (currentPath === '/super/admin' && user && isCustomer(user)) {
      return <Navigate to="/dashboard" replace />;
    }
    
    // Allow admins to access customer login and application pages
    // This enables admins to test the customer experience
    // No redirects for admins accessing customer areas
  }

  return <>{children}</>;
}; 