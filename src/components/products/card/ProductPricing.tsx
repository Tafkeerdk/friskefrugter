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
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-lg animate-pulse';
      case 'fast_udsalgspris':
        return 'bg-brand-error text-white border-brand-error';
      case 'rabat_gruppe':
        return 'bg-brand-secondary text-white border-brand-secondary';
      default:
        return '';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('da-DK', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getUniqueOfferValidityText = () => {
    if (!customerPricing.offerDetails) return null;
    
    const { validFrom, validTo } = customerPricing.offerDetails;
    
    if (!validTo) {
      return (
        <div className="text-xs text-purple-600 font-medium">
          🎯 Permanent tilbud!
        </div>
      );
    }
    
    const endDate = new Date(validTo);
    const now = new Date();
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 7) {
      return (
        <div className="text-xs text-red-600 font-medium animate-bounce">
          ⚡ Slutter {formatDate(validTo)} ({daysLeft} dage tilbage!)
        </div>
      );
    }
    
    return (
      <div className="text-xs text-purple-600 font-medium">
        📅 Gyldig til {formatDate(validTo)}
      </div>
    );
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
          <span className="ml-1">
            {customerPricing.discountType === 'unique_offer' 
              ? '🌟 EKSKLUSIVT TILBUD' 
              : customerPricing.discountLabel
            }
          </span>
        </Badge>
        
        {customerPricing.discountPercentage > 0 && (
          <span className={cn(
            "text-xs font-medium",
            customerPricing.discountType === 'unique_offer' 
              ? "text-purple-600 font-bold" 
              : "text-brand-success",
            position === 'overlay' ? "text-white" : ""
          )}>
            -{customerPricing.discountPercentage}%
          </span>
        )}
      </div>

      {/* Price Display */}
      <div className="flex items-center gap-2">
        {/* Original price with strikethrough - SHOW FIRST for unique offers */}
        {customerPricing.showStrikethrough && customerPricing.originalPrice > customerPricing.price && (
          <div className={cn(
            "text-gray-500 line-through font-medium",
            position === 'overlay' ? "text-gray-200" : "",
            isMobile ? "text-sm" : "text-lg",
            customerPricing.discountType === 'unique_offer' ? "text-gray-600" : ""
          )}>
            {formatPrice(customerPricing.originalPrice)}
          </div>
        )}

        {/* Current (discounted) price */}
        <div className={cn(
          "font-bold",
          customerPricing.discountType === 'unique_offer' 
            ? "text-purple-600 text-xl" 
            : "text-brand-primary-dark",
          position === 'overlay' ? "text-white" : "",
          isMobile ? "text-base" : "text-xl"
        )}>
          {formatPrice(customerPricing.price)}
        </div>
      </div>

      {/* Unique Offer Validity Info */}
      {customerPricing.discountType === 'unique_offer' && getUniqueOfferValidityText()}

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
    <div className={cn(
      "absolute top-3 right-3 backdrop-blur-sm px-2 py-1 rounded-full",
      customerPricing.discountType === 'unique_offer' 
        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white animate-pulse" 
        : "bg-white/90"
    )}>
      <div className="flex items-center gap-1">
        {customerPricing.showStrikethrough && customerPricing.originalPrice > customerPricing.price && (
          <span className={cn(
            "text-xs line-through",
            customerPricing.discountType === 'unique_offer' 
              ? "text-purple-100" 
              : "text-gray-500"
          )}>
            {new Intl.NumberFormat('da-DK', {
              style: 'currency',
              currency: 'DKK',
              minimumFractionDigits: 2
            }).format(customerPricing.originalPrice)}
          </span>
        )}
        <span className={cn(
          "text-xs font-bold",
          customerPricing.discountType === 'unique_offer' 
            ? "text-white" 
            : "text-brand-primary-dark"
        )}>
          {new Intl.NumberFormat('da-DK', {
            style: 'currency',
            currency: 'DKK',
            minimumFractionDigits: 2
          }).format(customerPricing.price)}
          </span>
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