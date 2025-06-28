import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ShoppingCart, Minus, Plus, Package, Star, Zap, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface CustomerPricing {
  price: number;
  originalPrice?: number;
  discountType: 'none' | 'fastUdsalgspris' | 'rabatGruppe' | 'uniqueOffer';
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

  // Professional savings calculation
  const getSavingsInfo = () => {
    if (!customerPricing?.showStrikethrough || !customerPricing?.originalPrice) return null;
    
    const savings = customerPricing.originalPrice - customerPricing.price;
    const percentage = Math.round((savings / customerPricing.originalPrice) * 100);
    
    return {
      amount: savings,
      percentage: percentage,
      totalSavings: savings * quantity
    };
  };

  // Professional discount icon
  const getDiscountIcon = () => {
    if (!customerPricing || customerPricing.discountType === 'none') return null;
    
    switch (customerPricing.discountType) {
      case 'uniqueOffer':
        return <Star className="h-3 w-3" />;
      case 'fastUdsalgspris':
        return <Zap className="h-3 w-3" />;
      case 'rabatGruppe':
        return <TrendingDown className="h-3 w-3" />;
      default:
        return null;
    }
  };

  // Professional image rendering
  const renderImage = () => {
    if (imageError || !image) {
      return (
        <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center">
          <Package className="h-10 w-10 text-gray-400 mb-2" />
          <span className="text-sm text-gray-500 text-center px-2 font-medium">
            Billede ikke tilgængeligt
          </span>
        </div>
      );
    }

    return (
      <>
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
            <Package className="h-10 w-10 text-gray-400" />
          </div>
        )}
        <img 
          src={image} 
          alt={name} 
          className={cn(
            "w-full h-full object-cover transition-all duration-300",
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

  const savingsInfo = getSavingsInfo();

  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all duration-300 bg-white border border-gray-200 group",
        // Professional hover effects
        !isMobile && "hover:shadow-lg hover:border-gray-300",
        "shadow-sm"
      )}
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
      style={{ height: '500px' }} // **FIXED HEIGHT FOR ALL CARDS**
    >
      {/* **LARGER PRODUCT IMAGE** */}
      <Link to={`/products/${id}`}>
        <div 
          className="relative w-full bg-gray-50 overflow-hidden"
          style={{ height: '280px' }} // **Larger image area**
        >
          {renderImage()}
          
          {/* **Professional discount badge** */}
          {customerPricing && customerPricing.discountType !== 'none' && savingsInfo && (
            <div className="absolute top-3 left-3 z-10">
              <Badge 
                className={cn(
                  "text-xs font-semibold px-2 py-1 text-white border-0",
                  customerPricing.discountType === 'uniqueOffer' && "bg-purple-600",
                  customerPricing.discountType === 'fastUdsalgspris' && "bg-red-600",
                  customerPricing.discountType === 'rabatGruppe' && "bg-brand-primary"
                )}
              >
                {getDiscountIcon()}
                <span className="ml-1">-{savingsInfo.percentage}%</span>
              </Badge>
            </div>
          )}
          
          {/* Subtle hover overlay */}
          <div className={cn(
            "absolute inset-0 bg-black/5 transition-opacity duration-300",
            isHovered && !isMobile ? "opacity-100" : "opacity-0"
          )} />
        </div>
      </Link>
      
      <CardContent className="p-4 flex flex-col h-[220px]"> {/* **FIXED CONTENT HEIGHT** */}
        {/* **PRODUCT INFO** */}
        <div className="flex-1 space-y-3">
          {/* Category and Product Name */}
          <div className="space-y-2">
            <Badge 
              variant="secondary" 
              className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 w-fit"
            >
              {category.toUpperCase()}
            </Badge>
            
            <Link to={`/products/${id}`}>
              <h3 
                className="font-semibold text-gray-900 hover:text-brand-primary transition-colors leading-tight line-clamp-2 cursor-pointer"
                style={{ fontSize: '16px', lineHeight: '1.3' }}
              >
                {name}
              </h3>
            </Link>
          </div>

          {/* **PROFESSIONAL PRICING SECTION** */}
          {isLoggedIn && customerPricing && (
            <div className="space-y-2">
              {/* Close price positioning */}
              <div className="flex items-center gap-2">
                <span 
                  className="font-bold text-gray-900"
                  style={{ fontSize: '18px' }}
                >
                  {new Intl.NumberFormat('da-DK', {
                    style: 'currency',
                    currency: 'DKK'
                  }).format(customerPricing.price)}
                </span>
                
                {/* Strikethrough price close by */}
                {customerPricing.showStrikethrough && customerPricing.originalPrice && (
                  <span className="text-gray-500 line-through text-sm">
                    {new Intl.NumberFormat('da-DK', {
                      style: 'currency',
                      currency: 'DKK'
                    }).format(customerPricing.originalPrice)}
                  </span>
                )}
              </div>
              
              {/* **SUBTLE savings info** */}
              {savingsInfo && (
                <div className="text-xs text-green-700 font-medium">
                  Sparer {new Intl.NumberFormat('da-DK', {
                    style: 'currency',
                    currency: 'DKK'
                  }).format(savingsInfo.amount)} pr. {getUnitDisplay()}
                </div>
              )}
              
              {/* Professional discount badge */}
              {customerPricing.discountType !== 'none' && customerPricing.discountLabel && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge 
                        className="text-xs font-medium px-2 py-1 text-white cursor-help w-fit"
                        style={{
                          backgroundColor: customerPricing.groupDetails?.groupColor || '#F59E0B'
                        }}
                      >
                        {customerPricing.discountLabel.includes('Guldkunderne') ? 'Guldkunde' : 'Rabat'}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Særpris for din kundegruppe</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              <p className="text-xs text-gray-500">
                Pris per {getUnitDisplay()}
              </p>
            </div>
          )}

          {/* Standard Price */}
          {isLoggedIn && !customerPricing && price && (
            <div className="space-y-1">
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
                Pris per {getUnitDisplay()}
              </p>
            </div>
          )}

          {/* Professional login required message */}
          {!isLoggedIn && (
            <div className="text-center p-3 bg-gray-50 border border-gray-200">
              <p className="text-sm text-gray-700 font-medium">
                Log ind for at se priser
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Enhed: {getUnitDisplay()}
              </p>
            </div>
          )}
        </div>

        {/* **PROFESSIONAL ACTIONS SECTION** */}
        {isLoggedIn && (
          <div className="space-y-3 pt-3 border-t border-gray-100 mt-auto">
            {/* Quantity selector */}
            <div className="flex items-center justify-center gap-3">
              <Button 
                variant="outline" 
                size="icon" 
                className={cn(
                  "h-8 w-8 border-gray-300",
                  quantity === 0 
                    ? "opacity-50 cursor-not-allowed" 
                    : "hover:border-brand-primary hover:bg-brand-primary hover:text-white"
                )}
                onClick={decreaseQuantity}
                disabled={quantity === 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              
              <span 
                className="text-center font-semibold text-gray-900 min-w-[2.5rem]"
                style={{ fontSize: '16px' }}
              >
                {quantity}
              </span>
              
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 border-gray-300 hover:border-brand-primary hover:bg-brand-primary hover:text-white"
                onClick={increaseQuantity}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Add to Cart Button */}
            <Button 
              className={cn(
                "w-full font-semibold gap-2 h-10",
                quantity === 0 
                  ? "opacity-50 cursor-not-allowed bg-gray-400 text-gray-200" 
                  : "bg-brand-primary hover:bg-brand-primary-hover text-white"
              )}
              disabled={quantity === 0}
            >
              <ShoppingCart className="h-4 w-4" />
              Tilføj til kurv
            </Button>

            {/* **FIXED HEIGHT TOTAL AREA** */}
            <div className="h-12 flex flex-col justify-center">
              {quantity > 0 ? (
                <div className="text-center space-y-1">
                  <div 
                    className="font-semibold text-brand-primary"
                    style={{ fontSize: '14px' }}
                  >
                    Total: {new Intl.NumberFormat('da-DK', {
                      style: 'currency',
                      currency: 'DKK'
                    }).format(getTotalPrice())}
                  </div>
                  
                  {/* **SUBTLE total savings** */}
                  {savingsInfo && quantity > 0 && (
                    <div className="text-xs text-green-700">
                      Total besparelse: {new Intl.NumberFormat('da-DK', {
                        style: 'currency',
                        currency: 'DKK'
                      }).format(savingsInfo.totalSavings)}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full"></div> // **PLACEHOLDER TO MAINTAIN HEIGHT**
              )}
            </div>
          </div>
        )}

        {/* Professional login button */}
        {!isLoggedIn && (
          <div className="pt-3 border-t border-gray-100 mt-auto">
            <Link to="/login" className="w-full">
              <Button className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold h-10">
                Log ind for at handle
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
