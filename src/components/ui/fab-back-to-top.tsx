import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FabBackToTopProps {
  className?: string;
  threshold?: number; // Scroll threshold to show the button
}

export function FabBackToTop({ className, threshold = 300 }: FabBackToTopProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsVisible(scrollY > threshold);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!isVisible) return null;

  return (
    <Button
      onClick={scrollToTop}
      className={cn(
        // **BASE STYLES - FLOATING ACTION BUTTON**
        "fixed z-40 rounded-full shadow-lg transition-all duration-300 ease-in-out",
        "bg-brand-primary hover:bg-brand-primary-hover text-white",
        "border-2 border-white hover:shadow-xl active:scale-95",
        
        // **POSITIONING - NO OVERLAP WITH ESSENTIAL UI**
        "bottom-6 right-6", // Mobile positioning
        "md:bottom-8 md:right-8", // Desktop positioning
        
        // **SIZE - TOUCH FRIENDLY**
        "h-12 w-12 md:h-14 md:w-14", // Mobile: 48px, Desktop: 56px
        
        // **HOVER EFFECTS**
        "hover:scale-110 focus:scale-110 focus:outline-none focus:ring-2 focus:ring-brand-primary/20",
        
        // **ANIMATION - SMOOTH ENTRANCE**
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        
        className
      )}
      aria-label="Tilbage til toppen"
      title="Tilbage til toppen"
    >
      <ArrowUp className="h-5 w-5 md:h-6 md:w-6" />
    </Button>
  );
} 