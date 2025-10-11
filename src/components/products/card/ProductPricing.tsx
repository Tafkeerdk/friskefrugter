import React from "react";
import { Badge } from "@/components/ui/badge";
import { Star, Tag, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

export interface CustomerPricing {
  price: number;
  originalPrice: number;
  discountType: 'unique_offer' | 'fast_udsalgspris' | 'tilbudsgruppe' | 'rabat_gruppe' | 'none';
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
    groupColor?: string;
  };
}

interface ProductPricingProps {
  customerPricing: CustomerPricing;
  isMobile?: boolean;
  position?: 'card' | 'overlay' | 'detail'; // Different display positions
  className?: string;
  unit?: string; // Add unit information for display
}

export function ProductPricing({ customerPricing, isMobile = false, position = 'card', className, unit }: ProductPricingProps) {
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
      case 'tilbudsgruppe': // ✅ NEW: tilbudsgruppe with fixed prices
      case 'rabat_gruppe': // Keep for backwards compatibility
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
      case 'tilbudsgruppe': // ✅ NEW
      case 'rabat_gruppe': // Keep for backwards compatibility
        return 'secondary'; // Gray for group prices
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
      case 'tilbudsgruppe': // ✅ NEW
      case 'rabat_gruppe': // Keep for backwards compatibility
        // Use dynamic color if available, otherwise fallback to brand-secondary
        return customerPricing.groupDetails?.groupColor 
          ? '' // Empty class, will use inline styles
          : 'bg-brand-secondary text-white border-brand-secondary';
      default:
        return '';
    }
  };

  const getBadgeStyle = () => {
    if ((customerPricing.discountType === 'tilbudsgruppe' || customerPricing.discountType === 'rabat_gruppe') && customerPricing.groupDetails?.groupColor) {
      return {
        backgroundColor: customerPricing.groupDetails.groupColor,
        borderColor: customerPricing.groupDetails.groupColor,
        color: 'white'
      };
    }
    return undefined;
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
          style={getBadgeStyle()}
        >
          {getPricingIcon()}
          <span className="ml-1">
            {customerPricing.discountType === 'unique_offer' 
              ? 'Særlig tilbud' 
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
          {customerPricing.groupDetails.groupName}
        </p>
      )}

      {/* Unit Information */}
      {unit && position !== 'overlay' && (
        <p className="text-xs text-gray-500 mt-1">
          Per {unit}
        </p>
      )}
    </div>
  );
}

// Helper component for mobile overlay pricing
export function MobilePricingOverlay({ customerPricing, quantity = 1, unit }: { customerPricing: CustomerPricing; quantity?: number; unit?: string }) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
      minimumFractionDigits: 2
    }).format(price);
  };

  if (customerPricing.discountType === 'none') {
    return (
      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm">
        <div className="flex flex-col items-end text-right">
          <span className="text-xs font-semibold text-gray-800">
            {formatPrice(customerPricing.price)}
          </span>
          {unit && (
            <span className="text-xs text-gray-600">
              per {unit}
            </span>
          )}
          {quantity > 1 && (
            <div className="border-t border-gray-200 pt-1 mt-1">
              <span className="text-xs font-bold text-brand-primary">
                {formatPrice(customerPricing.price * quantity)} total
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Get badge styling for mobile overlay
  const getMobileBadgeStyle = () => {
    if (customerPricing.discountType === 'rabat_gruppe' && customerPricing.groupDetails?.groupColor) {
      return {
        backgroundColor: customerPricing.groupDetails.groupColor,
        borderColor: customerPricing.groupDetails.groupColor,
        color: 'white'
      };
    }
    return undefined;
  };

  const getMobileBadgeColor = () => {
    switch (customerPricing.discountType) {
      case 'unique_offer':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      case 'fast_udsalgspris':
        return 'bg-red-500 text-white';
      case 'rabat_gruppe':
        return customerPricing.groupDetails?.groupColor 
          ? '' // Will use inline styles
          : 'bg-green-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  return (
    <div className="absolute top-3 right-3 backdrop-blur-sm rounded-lg shadow-sm overflow-hidden">
      {/* Discount Badge */}
      <div className={cn(
        "px-2 py-1 text-xs font-medium",
        getMobileBadgeColor(),
        customerPricing.discountType === 'unique_offer' && "animate-pulse"
      )}
      style={getMobileBadgeStyle()}>
        <div className="flex items-center gap-1">
          {customerPricing.discountType === 'unique_offer' && <Star className="h-3 w-3" />}
          {customerPricing.discountType === 'fast_udsalgspris' && <Tag className="h-3 w-3" />}
          {customerPricing.discountType === 'rabat_gruppe' && <Award className="h-3 w-3" />}
          <span>
            {customerPricing.discountType === 'unique_offer' 
              ? 'SÆRLIG' 
              : customerPricing.discountLabel?.replace(' Rabat', '') || customerPricing.discountLabel
            }
          </span>
          {customerPricing.discountPercentage > 0 && (
            <span>-{customerPricing.discountPercentage}%</span>
          )}
        </div>
      </div>
      
      {/* Pricing */}
      <div className="bg-white/95 px-2 py-1">
        <div className="flex flex-col items-end text-right">
          <div className="flex items-center gap-1">
            {customerPricing.showStrikethrough && customerPricing.originalPrice > customerPricing.price && (
              <span className="text-xs line-through text-gray-500">
                {formatPrice(customerPricing.originalPrice)}
              </span>
            )}
            <span className="text-xs font-bold text-brand-primary-dark">
              {formatPrice(customerPricing.price)}
            </span>
          </div>
          {unit && (
            <span className="text-xs text-gray-600">
              per {unit}
            </span>
          )}
          {quantity > 1 && (
            <div className="border-t border-gray-200 pt-1 mt-1">
              <span className="text-xs font-bold text-brand-primary">
                {formatPrice(customerPricing.price * quantity)} total
              </span>
            </div>
          )}
        </div>
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