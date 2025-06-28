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

  // **SALES BOOST: Calculate savings for urgency**
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

  // **SALES BOOST: Get urgency indicator**
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

  // **OPTIMIZED IMAGE RENDERING WITH BETTER PLACEHOLDER**
  const renderImage = () => {
    if (imageError || !image) {
      return (
        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center">
          <Package className="h-8 w-8 text-gray-400 mb-2" />
          <span className="text-xs text-gray-500 text-center px-2 leading-tight font-medium">
            Produktbillede kommer snart
          </span>
        </div>
      );
    }

    return (
      <>
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse flex items-center justify-center">
            <Package className="h-8 w-8 text-gray-400" />
          </div>
        )}
        <img 
          src={image} 
          alt={name} 
          className={cn(
            "w-full h-full object-cover transition-all duration-300 rounded-t-xl",
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
        "overflow-hidden transition-all duration-300 bg-white border border-gray-200 rounded-xl group",
        // **WIDER CARDS FOR BETTER SALES PRESENTATION**
        "w-full mx-auto",
        // **ENHANCED HOVER EFFECTS FOR ENGAGEMENT**
        !isMobile && "hover:shadow-xl hover:shadow-brand-primary/10 hover:-translate-y-1",
        "shadow-md"
      )}
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
    >
      {/* **🖼️ PRODUCT IMAGE WITH SALES BADGES** */}
      <Link to={`/products/${id}`}>
        <div 
          className="relative w-full bg-gray-50 overflow-hidden rounded-t-xl"
          style={{ height: '240px' }} // **Taller image for better visual impact**
        >
          {renderImage()}
          
          {/* **SALES BOOST: Discount Badge Overlay** */}
          {customerPricing && customerPricing.discountType !== 'none' && savingsInfo && (
            <div className="absolute top-3 left-3 z-10">
              <Badge 
                className={cn(
                  "text-xs font-bold px-3 py-1.5 shadow-lg border-0 text-white",
                  customerPricing.discountType === 'uniqueOffer' && "bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse",
                  customerPricing.discountType === 'fastUdsalgspris' && "bg-gradient-to-r from-red-500 to-orange-500",
                  customerPricing.discountType === 'rabatGruppe' && "bg-gradient-to-r from-green-600 to-brand-primary"
                )}
              >
                {getDiscountIcon()}
                <span className="ml-1">-{savingsInfo.percentage}%</span>
              </Badge>
            </div>
          )}
          
          {/* **Enhanced hover overlay for interactivity** */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent transition-opacity duration-300",
            isHovered && !isMobile ? "opacity-100" : "opacity-0"
          )} />
        </div>
      </Link>
      
      <CardContent className="p-5 flex flex-col space-y-4" style={{ minHeight: '220px' }}>
        {/* **📝 PRODUCT INFO WITH BETTER HIERARCHY** */}
        <div className="flex-1 space-y-3">
          {/* **Category + Product Name Together** */}
          <div className="space-y-2">
            <Badge 
              variant="secondary" 
              className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded-full w-fit"
            >
              {category.toUpperCase()}
            </Badge>
            
            <Link to={`/products/${id}`}>
              <h3 
                className="font-bold text-gray-900 hover:text-brand-primary transition-colors leading-tight line-clamp-2 cursor-pointer"
                style={{ fontSize: '18px', lineHeight: '1.4' }}
              >
                {name}
              </h3>
            </Link>
          </div>

          {/* **💰 SALES-OPTIMIZED PRICING SECTION** */}
          {isLoggedIn && customerPricing && (
            <div className="space-y-2">
              {/* **CLOSE PRICE POSITIONING - Current + Original together** */}
              <div className="flex items-center gap-2 flex-wrap">
                <span 
                  className="font-bold text-gray-900"
                  style={{ fontSize: '20px' }}
                >
                  {new Intl.NumberFormat('da-DK', {
                    style: 'currency',
                    currency: 'DKK'
                  }).format(customerPricing.price)}
                </span>
                
                {/* **STRIKETHROUGH PRICE CLOSER - Right next to current price** */}
                {customerPricing.showStrikethrough && customerPricing.originalPrice && (
                  <span className="text-gray-500 line-through font-medium" style={{ fontSize: '16px' }}>
                    {new Intl.NumberFormat('da-DK', {
                      style: 'currency',
                      currency: 'DKK'
                    }).format(customerPricing.originalPrice)}
                  </span>
                )}
              </div>
              
              {/* **SALES BOOST: Savings highlight** */}
              {savingsInfo && (
                <div className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-md border border-green-200">
                  💰 Du sparer {new Intl.NumberFormat('da-DK', {
                    style: 'currency',
                    currency: 'DKK'
                  }).format(savingsInfo.amount)} pr. {getUnitDisplay()}
                </div>
              )}
              
              {/* **Discount Badge with better positioning** */}
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
                        {customerPricing.discountLabel.includes('Guldkunderne') ? '👑 Guldkunde' : '🎯 Rabat'}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Speciel rabat for dig!</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {/* **Unit info with better styling** */}
              <p className="text-xs text-gray-500 font-medium">
                Pris per {getUnitDisplay()}
              </p>
            </div>
          )}

          {/* **Standard Price (for non-customer pricing)** */}
          {isLoggedIn && !customerPricing && price && (
            <div className="space-y-2">
              <span 
                className="font-bold text-gray-900"
                style={{ fontSize: '20px' }}
              >
                {new Intl.NumberFormat('da-DK', {
                  style: 'currency',
                  currency: 'DKK'
                }).format(price)}
              </span>
              <p className="text-xs text-gray-500 font-medium">
                Pris per {getUnitDisplay()}
              </p>
            </div>
          )}

          {/* **Enhanced Login Required Message** */}
          {!isLoggedIn && (
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900 font-semibold">
                🔐 Log ind for priser
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Se specialpriser og tilbud • {getUnitDisplay()}
              </p>
            </div>
          )}
        </div>

        {/* **🛒 ENHANCED ACTIONS & QUANTITY SECTION** */}
        {isLoggedIn && (
          <div className="space-y-3 pt-3 border-t border-gray-100">
            {/* **Better quantity selector with enhanced styling** */}
            <div className="flex items-center justify-center gap-4">
              <Button 
                variant="outline" 
                size="icon" 
                className={cn(
                  "rounded-lg h-9 w-9 border-2 transition-all duration-200",
                  quantity === 0 
                    ? "opacity-50 cursor-not-allowed border-gray-300" 
                    : "border-brand-primary/30 hover:bg-brand-primary hover:text-white hover:border-brand-primary active:scale-95"
                )}
                onClick={decreaseQuantity}
                disabled={quantity === 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              
              <span 
                className="text-center font-bold text-gray-900 min-w-[3rem] px-3 py-1 bg-gray-50 rounded-lg border border-gray-200"
                style={{ fontSize: '18px' }}
              >
                {quantity}
              </span>
              
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-lg h-9 w-9 border-2 border-brand-primary/30 hover:bg-brand-primary hover:text-white hover:border-brand-primary active:scale-95 transition-all duration-200"
                onClick={increaseQuantity}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* **ENHANCED Add to Cart Button** */}
            <Button 
              className={cn(
                "w-full rounded-lg transition-all duration-200 font-bold gap-2 h-12 text-sm",
                quantity === 0 
                  ? "opacity-50 cursor-not-allowed bg-gray-400 text-gray-200" 
                  : "bg-brand-primary hover:bg-brand-primary-hover active:scale-[0.98] shadow-lg hover:shadow-xl text-white transform"
              )}
              disabled={quantity === 0}
              aria-label="Tilføj til kurv"
            >
              <ShoppingCart className="h-4 w-4" />
              Tilføj til kurv
            </Button>

            {/* **SALES BOOST: Dynamic Total with savings highlight** */}
            {quantity > 0 && (
              <div className="text-center space-y-1">
                <div 
                  className="font-bold text-brand-primary-dark"
                  style={{ fontSize: '16px' }}
                >
                  Total: {new Intl.NumberFormat('da-DK', {
                    style: 'currency',
                    currency: 'DKK'
                  }).format(getTotalPrice())}
                </div>
                
                {/* **Total savings indicator** */}
                {savingsInfo && quantity > 0 && (
                  <div className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">
                    🎉 Du sparer {new Intl.NumberFormat('da-DK', {
                      style: 'currency',
                      currency: 'DKK'
                    }).format(savingsInfo.totalSavings)} i alt!
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* **Enhanced Login Button for Non-Authenticated Users** */}
        {!isLoggedIn && (
          <div className="pt-3 border-t border-gray-100">
            <Link to="/login" className="w-full">
              <Button className="w-full rounded-lg bg-gradient-to-r from-brand-primary to-brand-primary-hover text-white font-bold transition-all h-12 shadow-lg hover:shadow-xl transform hover:scale-[1.02]">
                🚀 Log ind for at handle
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
