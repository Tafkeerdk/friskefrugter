import React from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link } from "react-router-dom";

interface CartControlsProps {
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  onAddToCart?: () => void;
  isLoggedIn: boolean;
  disabled?: boolean;
}

export function CartControls({ 
  quantity, 
  onIncrease, 
  onDecrease, 
  onAddToCart, 
  isLoggedIn, 
  disabled = false 
}: CartControlsProps) {
  const isMobile = useIsMobile();

  if (!isLoggedIn) {
    return (
      <Link to="/login" className="flex-1 flex justify-end">
        <Button 
          size={isMobile ? "sm" : "default"}
          className={cn(
            "rounded-full transition-all duration-200 shadow-sm bg-brand-primary hover:bg-brand-primary-hover active:scale-95 hover:shadow-md",
            isMobile ? "h-8 px-4 text-xs" : "h-9 px-6 text-sm"
          )}
        >
          <span className="font-medium">Log ind</span>
        </Button>
      </Link>
    );
  }

  return (
    <>
      {/* Quantity Controls */}
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="icon" 
          className={cn(
            "rounded-full transition-all duration-200 border-gray-200",
            isMobile ? "h-8 w-8" : "h-9 w-9",
            quantity === 0 
              ? "opacity-50" 
              : "hover:bg-brand-gray-100 hover:text-brand-primary-dark hover:border-brand-gray-300 active:scale-95"
          )}
          onClick={onDecrease}
          disabled={quantity === 0 || disabled}
        >
          <Minus className={cn(isMobile ? "h-3 w-3" : "h-4 w-4")} />
        </Button>
        
        <span className={cn(
          "text-center font-semibold text-gray-900",
          isMobile ? "w-6 text-sm" : "w-8 text-base"
        )}>
          {quantity}
        </span>
        
        <Button 
          variant="outline" 
          size="icon" 
          className={cn(
            "rounded-full transition-all duration-200 border-gray-200 hover:bg-brand-gray-100 hover:text-brand-primary-dark hover:border-brand-gray-300 active:scale-95",
            isMobile ? "h-8 w-8" : "h-9 w-9"
          )}
          onClick={onIncrease}
          disabled={disabled}
        >
          <Plus className={cn(isMobile ? "h-3 w-3" : "h-4 w-4")} />
        </Button>
      </div>

      {/* Add to Cart Button */}
      <Button 
        size={isMobile ? "sm" : "default"}
        className={cn(
          "rounded-full gap-1 transition-all duration-200 shadow-sm",
          isMobile ? "h-8 px-3 text-xs" : "h-9 px-4 text-sm",
          quantity === 0 
            ? "opacity-50 cursor-not-allowed" 
            : "bg-brand-primary hover:bg-brand-primary-hover active:scale-95 hover:shadow-md"
        )}
        disabled={quantity === 0 || disabled}
        onClick={onAddToCart}
      >
        <ShoppingCart className={cn(isMobile ? "h-3 w-3" : "h-4 w-4")} />
        <span className="font-medium">
          {isMobile ? "Tilføj" : "Tilføj til kurv"}
        </span>
      </Button>
    </>
  );
} 