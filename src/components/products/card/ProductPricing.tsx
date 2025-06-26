import React from "react";
import { Badge } from "@/components/ui/badge";
import { Star, Tag, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

export interface CustomerPricing {
  price: number;
  originalPrice: number;
  discountType: 'unique_offer' | 'fast_udsalgspris' | 'rabat_gruppe' | 'none';
  discountLabel: string | null;
  discountPercentage: number;
  showStrikethrough: boolean;
  offerDetails?: {
    description?: string;
    validFrom?: string;
    validTo?: string;
  };
  saleDetails?: {
    validFrom?: string;
    validTo?: string;
  };
  groupDetails?: {
    groupName?: string;
    groupDescription?: string;
  };
}

interface ProductPricingProps {
  customerPricing: CustomerPricing;
  isMobile?: boolean;
  position?: 'card' | 'overlay' | 'detail'; // Different display positions
  className?: string;
}

export function ProductPricing({ customerPricing, isMobile = false, position = 'card', className }: ProductPricingProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
      minimumFractionDigits: 2
    }).format(price);
  };

  const getPricingIcon = () => {
    switch (customerPricing.discountType) {
      case 'unique_offer':
        return <Star className="h-3 w-3" />;
      case 'fast_udsalgspris':
        return <Tag className="h-3 w-3" />;
      case 'rabat_gruppe':
        return <Award className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getBadgeVariant = () => {
    switch (customerPricing.discountType) {
      case 'unique_offer':
        return 'default'; // Uses brand-primary
      case 'fast_udsalgspris':
        return 'destructive'; // Red for sale prices
      case 'rabat_gruppe':
        return 'secondary'; // Gray for group discounts
      default:
        return 'outline';
    }
  };

  const getBadgeClassName = () => {
    switch (customerPricing.discountType) {
      case 'unique_offer':
        return 'bg-brand-primary text-white border-brand-primary hover:bg-brand-primary-hover';
      case 'fast_udsalgspris':
        return 'bg-brand-error text-white border-brand-error';
      case 'rabat_gruppe':
        return 'bg-brand-secondary text-white border-brand-secondary';
      default:
        return '';
    }
  };

  // No discount - show standard price
  if (customerPricing.discountType === 'none') {
    return (
      <div className={cn("pricing-container", className)}>
        <div className={cn(
          "text-gray-700 font-semibold",
          position === 'overlay' ? "text-white" : "",
          isMobile ? "text-sm" : "text-lg"
        )}>
          {formatPrice(customerPricing.price)}
        </div>
      </div>
    );
  }

  // With discount - show pricing hierarchy
  return (
    <div className={cn("pricing-container space-y-1", className)}>
      {/* Discount Badge */}
      <div className="flex items-center gap-1">
        <Badge 
          variant={getBadgeVariant()}
          className={cn(
            "text-xs font-medium",
            getBadgeClassName(),
            isMobile ? "px-1.5 py-0.5" : "px-2 py-1"
          )}
        >
          {getPricingIcon()}
          <span className="ml-1">{customerPricing.discountLabel}</span>
        </Badge>
        
        {customerPricing.discountPercentage > 0 && (
          <span className={cn(
            "text-xs font-medium text-brand-success",
            position === 'overlay' ? "text-white" : ""
          )}>
            -{customerPricing.discountPercentage}%
          </span>
        )}
      </div>

      {/* Price Display */}
      <div className="flex items-center gap-2">
        {/* Current (discounted) price */}
        <div className={cn(
          "font-bold text-brand-primary-dark",
          position === 'overlay' ? "text-white" : "",
          isMobile ? "text-base" : "text-xl"
        )}>
          {formatPrice(customerPricing.price)}
        </div>

        {/* Original price with strikethrough */}
        {customerPricing.showStrikethrough && customerPricing.originalPrice > customerPricing.price && (
          <div className={cn(
            "text-gray-500 line-through",
            position === 'overlay' ? "text-gray-200" : "",
            isMobile ? "text-xs" : "text-sm"
          )}>
            {formatPrice(customerPricing.originalPrice)}
          </div>
        )}
      </div>

      {/* Additional Details (only for detail view) */}
      {position === 'detail' && customerPricing.offerDetails?.description && (
        <p className="text-xs text-gray-600 mt-1">
          {customerPricing.offerDetails.description}
        </p>
      )}

      {position === 'detail' && customerPricing.groupDetails?.groupName && (
        <p className="text-xs text-gray-600 mt-1">
          {customerPricing.groupDetails.groupName} rabat
        </p>
      )}
    </div>
  );
}

// Helper component for mobile overlay pricing
export function MobilePricingOverlay({ customerPricing }: { customerPricing: CustomerPricing }) {
  if (customerPricing.discountType === 'none') {
    return (
      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
        <span className="text-xs font-semibold text-gray-800">
          {new Intl.NumberFormat('da-DK', {
            style: 'currency',
            currency: 'DKK',
            minimumFractionDigits: 2
          }).format(customerPricing.price)}
        </span>
      </div>
    );
  }

    return (
    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
      <div className="flex items-center gap-1">
        <span className="text-xs font-bold text-brand-primary-dark">
          {new Intl.NumberFormat('da-DK', {
            style: 'currency',
            currency: 'DKK',
            minimumFractionDigits: 2
          }).format(customerPricing.price)}
          </span>
        {customerPricing.showStrikethrough && customerPricing.originalPrice > customerPricing.price && (
          <span className="text-xs text-gray-500 line-through">
            {new Intl.NumberFormat('da-DK', {
              style: 'currency',
              currency: 'DKK',
              minimumFractionDigits: 2
            }).format(customerPricing.originalPrice)}
          </span>
        )}
      </div>
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