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

  // CRITICAL: Allow all users (including logged-in admins) to access customer login page
  // The navbar login button must ALWAYS lead to customer login, never admin dashboard
  // Admin access is exclusively through direct navigation to /super/admin
  if (!requireAuth && isAuthenticated) {
    const currentPath = window.location.pathname;
    
    // Only prevent customers from accessing admin login
    if (currentPath === '/super/admin' && user && isCustomer(user)) {
      return <Navigate to="/dashboard" replace />;
    }
    
    // REMOVED: Admin redirect from customer login page
    // This ensures logged-in admins can access /login for customer-first UX
    // Admins should access their dashboard only via direct /super/admin navigation
  }

  return <>{children}</>;
}; 