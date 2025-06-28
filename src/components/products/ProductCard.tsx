import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ShoppingCart, Minus, Plus, Package, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface CustomerPricing {
  price: number;
  originalPrice?: number;
  discountType: 'none' | 'fast_udsalgspris' | 'rabat_gruppe' | 'unique_offer';
  discountLabel?: string;
  showStrikethrough?: boolean;
  groupDetails?: {
    groupColor?: string;
  };
}

interface Unit {
  _id: string;
  value: string;
  label: string;
  description?: string;
}

interface ProductCardProps {
  id: string;
  name: string;
  image: string;
  category: string;
  unit?: Unit | string;
  isLoggedIn?: boolean;
  price?: number;
  customerPricing?: CustomerPricing;
  userType?: 'public' | 'customer';
}

export function ProductCard({ 
  id, 
  name, 
  image, 
  category, 
  unit, 
  isLoggedIn = false, 
  price, 
  customerPricing, 
  userType = 'public' 
}: ProductCardProps) {
  const [quantity, setQuantity] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isMobile = useIsMobile();

  const increaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decreaseQuantity = () => {
    setQuantity(prev => Math.max(0, prev - 1));
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
  };

  const getUnitDisplay = () => {
    if (typeof unit === 'string') return unit;
    if (unit && typeof unit === 'object') return unit.label || unit.value;
    return 'Stykker';
  };

  const getCurrentPrice = () => {
    if (customerPricing) return customerPricing.price;
    if (price) return price;
    return 0;
  };

  const getTotalPrice = () => {
    return getCurrentPrice() * quantity;
  };

  // **IMAGE AREA - TOP 50-60% WITH FALLBACK**
  const renderImage = () => {
    if (imageError || !image) {
      return (
        <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center">
          <Package className="h-6 w-6 text-gray-400 mb-1" />
          <span className="text-xs text-gray-500 text-center px-2 leading-tight">
            Billede ikke tilgængeligt
          </span>
        </div>
      );
    }

    return (
      <>
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
            <Package className="h-6 w-6 text-gray-400" />
          </div>
        )}
        <img 
          src={image} 
          alt={name} 
          className={cn(
            "w-full h-full object-cover transition-all duration-300 rounded-t-lg",
            !isMobile && isHovered && "scale-105",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
          style={{ objectFit: 'cover' }}
          loading="lazy"
          onLoad={handleImageLoad}
          onError={handleImageError}
          crossOrigin="anonymous"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </>
    );
  };

  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all duration-300 bg-white border border-gray-200 rounded-lg group",
        // **FIXED WIDTH 320PX WITH RESPONSIVE BEHAVIOR**
        "w-[320px] max-w-full mx-auto",
        // **HOVER EFFECTS**
        !isMobile && "hover:shadow-lg hover:shadow-gray-200/50",
        "shadow-sm"
      )}
      style={{ width: isMobile ? '100%' : '320px' }}
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
    >
      {/* **🖼️ 1. PRODUCT IMAGE AREA (TOP 50-60%) - SQUARE FORMAT** */}
      <Link to={`/products/${id}`}>
        <div 
          className="relative w-full bg-gray-50 overflow-hidden rounded-t-lg"
          style={{ height: '200px' }} // **Fixed height for 50-60% of card**
        >
          {renderImage()}
          
          {/* Hover overlay for interactivity */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent transition-opacity duration-300",
            isHovered && !isMobile ? "opacity-100" : "opacity-0"
          )} />
        </div>
      </Link>
      
      <CardContent className="p-4 flex flex-col space-y-4" style={{ minHeight: '200px' }}>
        {/* **📝 2. INFORMATION & PRICING (MIDDLE BLOCK)** */}
        <div className="flex-1 space-y-3">
          {/* **Product Name - Bold, 16-18px, 1-2 lines max** */}
          <Link to={`/products/${id}`}>
            <h3 
              className="font-bold text-gray-900 hover:text-brand-primary transition-colors leading-tight line-clamp-2 cursor-pointer"
              style={{ fontSize: '17px', lineHeight: '1.3' }}
            >
              {name}
            </h3>
          </Link>
          
          {/* **Category Label - Small green pill tag inline** */}
          <Badge 
            variant="secondary" 
            className="bg-brand-primary/10 text-brand-primary-dark text-xs font-medium px-2 py-1 rounded-full w-fit"
          >
            {category.toUpperCase()}
          </Badge>

          {/* **Price Display Section** */}
          {isLoggedIn && customerPricing && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {/* **Discounted Price - Bold, large, primary color** */}
                <span 
                  className="font-bold text-gray-900"
                  style={{ fontSize: '18px' }}
                >
                  {new Intl.NumberFormat('da-DK', {
                    style: 'currency',
                    currency: 'DKK'
                  }).format(customerPricing.price)}
                </span>
                
                {/* **Original Price - Light gray, struck through** */}
                {customerPricing.showStrikethrough && customerPricing.originalPrice && (
                  <span className="text-sm text-gray-400 line-through font-medium">
                    {new Intl.NumberFormat('da-DK', {
                      style: 'currency',
                      currency: 'DKK'
                    }).format(customerPricing.originalPrice)}
                  </span>
                )}
                
                {/* **Discount Badge - Shows actual admin-set labels** */}
                {customerPricing.discountType !== 'none' && customerPricing.discountLabel && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge 
                          className="text-xs font-medium px-2 py-1 text-white cursor-help"
                          style={{
                            backgroundColor: customerPricing.discountType === 'unique_offer' 
                              ? '#9333EA' // Purple for unique offers
                              : customerPricing.discountType === 'fast_udsalgspris'
                                ? '#DC2626' // Red for fast sales
                                : customerPricing.groupDetails?.groupColor || '#F59E0B' // Group color or fallback
                          }}
                        >
                          {customerPricing.discountType === 'unique_offer' 
                            ? 'Særlig tilbud'
                            : customerPricing.discountLabel
                          }
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          {customerPricing.discountType === 'unique_offer' 
                            ? 'Særligt tilbud kun til dig'
                            : customerPricing.discountType === 'fast_udsalgspris'
                              ? 'Produkt på tilbud'
                              : 'Rabatteret pris for din gruppe'
                          }
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              
              {/* **Unit Info - Light gray, small font under price** */}
              <p className="text-xs text-gray-500">
                per {getUnitDisplay()}
              </p>
            </div>
          )}

          {/* **Standard Price (for non-customer pricing)** */}
          {isLoggedIn && !customerPricing && price && (
            <div className="space-y-2">
              <span 
                className="font-bold text-gray-900"
                style={{ fontSize: '18px' }}
              >
                {new Intl.NumberFormat('da-DK', {
                  style: 'currency',
                  currency: 'DKK'
                }).format(price)}
              </span>
              <p className="text-xs text-gray-500">
                per {getUnitDisplay()}
              </p>
            </div>
          )}

          {/* **Login Required Message** */}
          {!isLoggedIn && (
            <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700 font-medium">
                Log ind for at se priser
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Enhed: {getUnitDisplay()}
              </p>
            </div>
          )}
        </div>

        {/* **🛒 3. ACTIONS & QUANTITY (BOTTOM BLOCK)** */}
        {isLoggedIn && (
          <div className="space-y-3 pt-2 border-t border-gray-100">
            {/* **Quantity Selector - Horizontal layout with larger touch targets** */}
            <div className="flex items-center justify-center gap-4">
              <Button 
                variant="outline" 
                size="icon" 
                className={cn(
                  "rounded-lg h-9 w-9 border-gray-300 transition-all hover:bg-gray-50",
                  quantity === 0 
                    ? "opacity-50 cursor-not-allowed" 
                    : "hover:border-brand-primary/40 active:scale-95"
                )}
                onClick={decreaseQuantity}
                disabled={quantity === 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              
              <span 
                className="text-center font-bold text-gray-900 min-w-[2.5rem]"
                style={{ fontSize: '18px' }}
              >
                {quantity}
              </span>
              
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-lg h-9 w-9 border-gray-300 transition-all hover:bg-gray-50 hover:border-brand-primary/40 active:scale-95"
                onClick={increaseQuantity}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* **Add to Cart Button - Full-width green button** */}
            <Button 
              className={cn(
                "w-full rounded-lg transition-all duration-200 font-semibold gap-2 h-11",
                quantity === 0 
                  ? "opacity-50 cursor-not-allowed bg-gray-400 text-gray-200" 
                  : "bg-brand-primary hover:bg-brand-primary-hover active:scale-[0.98] shadow-sm hover:shadow-md text-white"
              )}
              disabled={quantity === 0}
              aria-label="Tilføj til kurv"
            >
              <ShoppingCart className="h-4 w-4" />
              Tilføj til kurv
            </Button>

            {/* **Total Price (Dynamic) - Only appears if quantity > 0** */}
            {quantity > 0 && (
              <div className="text-center">
                <span 
                  className="font-semibold text-brand-primary-dark"
                  style={{ fontSize: '16px' }}
                >
                  Total: {new Intl.NumberFormat('da-DK', {
                    style: 'currency',
                    currency: 'DKK'
                  }).format(getTotalPrice())}
                </span>
              </div>
            )}
          </div>
        )}

        {/* **Login Button for Non-Authenticated Users** */}
        {!isLoggedIn && (
          <div className="pt-2 border-t border-gray-100">
            <Link to="/login" className="w-full">
              <Button className="w-full rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold transition-all h-11">
                Log ind for at handle
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
