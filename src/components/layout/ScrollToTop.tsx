import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop Component
 * 
 * Automatically scrolls to the top of the page whenever the route changes.
 * This fixes the common UX issue where users navigate to a new page but 
 * remain at the same scroll position from the previous page.
 * 
 * Features:
 * - Smooth scrolling with fallback to instant scroll
 * - Preserves scroll position for same-page navigation with different params
 * - Works with all navigation methods (buttons, links, programmatic navigation)
 * - Robust error handling for edge cases
 * - Performance optimized with minimal re-renders
 */

interface ScrollToTopProps {
  /**
   * Whether to use smooth scrolling animation
   * @default true
   */
  smooth?: boolean;
  
  /**
   * Delay before scrolling (in milliseconds)
   * Useful if you need to wait for content to render
   * @default 0
   */
  delay?: number;
  
  /**
   * Whether to scroll only when pathname changes (not search params or hash)
   * @default true
   */
  pathOnly?: boolean;
}

export const ScrollToTop: React.FC<ScrollToTopProps> = ({
  smooth = true,
  delay = 0,
  pathOnly = true
}) => {
  const location = useLocation();

  useEffect(() => {
    // Skip scroll restoration for initial page load
    // (browser handles this naturally)
    if (window.history.scrollRestoration) {
      window.history.scrollRestoration = 'manual';
    }

    const scrollToTop = () => {
      try {
        // Method 1: Modern smooth scroll (preferred)
        if (smooth && 'scrollTo' in window) {
          window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
          });
        } 
        // Method 2: Instant scroll (fallback)
        else {
          window.scrollTo(0, 0);
        }
        
        // Method 3: Additional fallback for older browsers
        if (document.documentElement) {
          document.documentElement.scrollTop = 0;
        }
        if (document.body) {
          document.body.scrollTop = 0;
        }
      } catch (error) {
        // Silent fallback - just scroll without animation
        try {
          window.scrollTo(0, 0);
        } catch {
          // If even basic scrollTo fails, try direct manipulation
          if (document.documentElement) {
            document.documentElement.scrollTop = 0;
          }
          if (document.body) {
            document.body.scrollTop = 0;
          }
        }
      }
    };

    // Execute scroll with optional delay
    if (delay > 0) {
      const timeoutId = setTimeout(scrollToTop, delay);
      return () => clearTimeout(timeoutId);
    } else {
      scrollToTop();
    }
  }, [
    // Only trigger when pathname changes (not search params/hash) if pathOnly is true
    pathOnly ? location.pathname : location.pathname + location.search + location.hash,
    smooth,
    delay
  ]);

  // This component doesn't render anything
  return null;
};

/**
 * Hook version for more advanced use cases
 * 
 * @example
 * const scrollToTop = useScrollToTop();
 * 
 * const handleCustomNavigation = () => {
 *   navigate('/new-page');
 *   scrollToTop(); // Manually trigger if needed
 * };
 */
export const useScrollToTop = (options: Omit<ScrollToTopProps, 'pathOnly'> = {}) => {
  const { smooth = true, delay = 0 } = options;
  
  return () => {
    const scrollToTop = () => {
      try {
        if (smooth && 'scrollTo' in window) {
          window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
          });
        } else {
          window.scrollTo(0, 0);
        }
        
        if (document.documentElement) {
          document.documentElement.scrollTop = 0;
        }
        if (document.body) {
          document.body.scrollTop = 0;
        }
      } catch (error) {
        try {
          window.scrollTo(0, 0);
        } catch {
          if (document.documentElement) {
            document.documentElement.scrollTop = 0;
          }
          if (document.body) {
            document.body.scrollTop = 0;
          }
        }
      }
    };

    if (delay > 0) {
      setTimeout(scrollToTop, delay);
    } else {
      scrollToTop();
    }
  };
};

export default ScrollToTop; 