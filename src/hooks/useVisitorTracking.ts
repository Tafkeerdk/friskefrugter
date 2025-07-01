import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { authService } from '@/lib/auth';

/**
 * Custom hook to automatically track visitor page views for analytics
 * This hook should be used at the app level to track all route changes
 */
export const useVisitorTracking = () => {
  const location = useLocation();

  useEffect(() => {
    // Track the current page visit
    const currentPath = location.pathname;
    
    // Add a small delay to ensure page is loaded
    const trackingTimeout = setTimeout(() => {
      authService.trackVisitor(currentPath);
    }, 100);

    // Cleanup timeout on component unmount or route change
    return () => {
      clearTimeout(trackingTimeout);
    };
  }, [location.pathname]);
};

export default useVisitorTracking; 