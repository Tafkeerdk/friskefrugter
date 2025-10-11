import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  productId: string;
  initialIsFavorited?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'card' | 'detail';
  onFavoriteChange?: (isFavorited: boolean) => void;
}

export function FavoriteButton({ 
  productId, 
  initialIsFavorited = false,
  size = 'md',
  variant = 'card',
  onFavoriteChange
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsFavorited(initialIsFavorited);
  }, [initialIsFavorited]);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    // Prevent event propagation to avoid triggering parent click handlers
    e.preventDefault();
    e.stopPropagation();

    setIsLoading(true);

    try {
      const token = localStorage.getItem('customerAccessToken');
      if (!token) {
        toast({
          variant: 'destructive',
          title: 'Ikke godkendt',
          description: 'Log venligst ind for at tilføje favoritter'
        });
        return;
      }

      const apiUrl = `${import.meta.env.VITE_API_BASE_URL || 'https://famous-dragon-b033ac.netlify.app'}/.netlify/functions/customer-favorites`;
      
      const method = isFavorited ? 'DELETE' : 'POST';
      
      const response = await fetch(apiUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Session-Type': 'browser',
          'X-PWA': 'false',
          'X-Display-Mode': 'browser'
        },
        body: JSON.stringify({ productId })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const newFavoritedState = !isFavorited;
        setIsFavorited(newFavoritedState);
        
        toast({
          title: newFavoritedState ? 'Tilføjet til favoritter' : 'Fjernet fra favoritter',
          description: newFavoritedState 
            ? 'Produkt er tilføjet til dine favoritter' 
            : 'Produkt er fjernet fra dine favoritter',
          className: 'bg-brand-success text-white border-brand-success'
        });

        // Notify parent component
        if (onFavoriteChange) {
          onFavoriteChange(newFavoritedState);
        }
      } else {
        // Handle already exists error silently by just updating the state
        if (data.alreadyExists && !isFavorited) {
          setIsFavorited(true);
          if (onFavoriteChange) {
            onFavoriteChange(true);
          }
        } else {
          toast({
            variant: 'destructive',
            title: 'Fejl',
            description: data.error || 'Der opstod en fejl. Prøv igen.'
          });
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        variant: 'destructive',
        title: 'Fejl',
        description: 'Der opstod en netværksfejl. Prøv igen.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  // Variant classes
  const variantClasses = variant === 'card' 
    ? 'absolute top-2 right-2 z-10' 
    : '';

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        sizeClasses[size],
        variantClasses,
        'transition-all duration-200 hover:scale-110',
        isFavorited 
          ? 'bg-red-50 hover:bg-red-100 text-red-500' 
          : 'bg-white/90 hover:bg-white text-gray-600',
        'rounded-full shadow-md hover:shadow-lg',
        'backdrop-blur-sm',
        isLoading && 'opacity-50 cursor-not-allowed'
      )}
      onClick={handleToggleFavorite}
      disabled={isLoading}
      aria-label={isFavorited ? 'Fjern fra favoritter' : 'Tilføj til favoritter'}
      title={isFavorited ? 'Fjern fra favoritter' : 'Tilføj til favoritter'}
    >
      <Heart 
        className={cn(
          iconSizes[size],
          'transition-all duration-200',
          isFavorited ? 'fill-current' : '',
          isLoading && 'animate-pulse'
        )} 
      />
    </Button>
  );
}

