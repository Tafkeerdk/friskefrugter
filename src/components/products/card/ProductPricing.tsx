import React from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface CustomerPricing {
  originalPrice: number;
  customerPrice: number;
  priceLabel: string;
  hasDiscount: boolean;
  discountPercentage: number;
  discountType: 'none' | 'general' | 'group' | 'unique';
}

interface ProductPricingProps {
  price: number;
  customerPricing?: CustomerPricing;
  isLoggedIn: boolean;
  showMobileOverlay?: boolean;
}

export function ProductPricing({ 
  price, 
  customerPricing, 
  isLoggedIn, 
  showMobileOverlay = false 
}: ProductPricingProps) {
  const isMobile = useIsMobile();
  const hasDiscount = customerPricing?.hasDiscount || false;
  const originalPrice = customerPricing?.originalPrice;
  const priceLabel = customerPricing?.priceLabel || 'standard pris';

  if (!isLoggedIn) {
    return (
      <p className={cn(
        "mt-1 text-gray-500",
        isMobile ? "text-xs" : "text-sm"
      )}>
        Log ind for at se priser
      </p>
    );
  }

  // Mobile overlay pricing (shown on image)
  if (showMobileOverlay && isMobile) {
    return (
      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
        <span className="text-xs font-semibold text-gray-800">
          {new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(price)}
        </span>
      </div>
    );
  }

  // Desktop/mobile card pricing
  if (hasDiscount && originalPrice) {
    return (
      <div className="mt-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400 line-through">
            {new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(originalPrice)}
          </span>
          <span className="text-lg font-semibold text-brand-primary">
            {new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(price)}
          </span>
        </div>
        <p className="text-xs text-brand-primary">
          {priceLabel}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <p className="text-lg font-semibold text-gray-700">
        {new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(price)}
      </p>
      {customerPricing && (
        <p className="text-xs text-gray-500">
          {priceLabel}
        </p>
      )}
    </div>
  );
}

// Discount badge component
interface DiscountBadgeProps {
  discountPercentage: number;
}

export function DiscountBadge({ discountPercentage }: DiscountBadgeProps) {
  return (
    <div className="absolute top-3 left-3 bg-brand-primary text-white px-2 py-1 rounded-full">
      <span className="text-xs font-semibold">
        -{Math.round(discountPercentage)}%
      </span>
    </div>
  );
} 