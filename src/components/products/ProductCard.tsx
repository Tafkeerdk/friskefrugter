import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Minus, Plus, ShoppingCart, Package } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { ProductPricing, CustomerPricing } from "./card/ProductPricing";

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

export function ProductCard({ id, name, image, category, unit, isLoggedIn = false, price, customerPricing, userType = 'public' }: ProductCardProps) {
  const [quantity, setQuantity] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const isMobile = useIsMobile();

  const increaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decreaseQuantity = () => {
    setQuantity(prev => (prev > 0 ? prev - 1 : 0));
  };

  const handleTouchStart = () => {
    if (isMobile) setIsPressed(true);
  };

  const handleTouchEnd = () => {
    if (isMobile) setTimeout(() => setIsPressed(false), 150);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = (event) => {
    console.error('❌ ProductCard image failed to load:', {
      src: image,
      productName: name
    });
    
    setImageError(true);
    setImageLoaded(true);
  };

  // Get unit display value
  const getUnitDisplay = () => {
    if (!unit) return '';
    if (typeof unit === 'string') return unit;
    return unit.label || unit.value || '';
  };

  const renderImage = () => {
    if (imageError) {
      return (
        <div className="h-full w-full bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className={cn(
              "text-gray-500 font-medium",
              isMobile ? "text-sm" : "text-xs"
            )}>
              Billede ikke tilgængeligt
            </p>
            <p className={cn(
              "text-gray-400 mt-1",
              isMobile ? "text-xs" : "text-xs"
            )}>
              {name}
            </p>
          </div>
        </div>
      );
    }

    return (
      <>
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
            <div className="text-center">
              <div className="h-8 w-8 border-2 border-gray-300 border-t-brand-primary rounded-full animate-spin mx-auto mb-2"></div>
              <p className={cn(
                "text-gray-500 font-medium",
                isMobile ? "text-sm" : "text-xs"
              )}>
                Indlæser...
              </p>
            </div>
          </div>
        )}
        <img 
          src={image} 
          alt={name} 
          className={cn(
            "h-full w-full object-cover transition-all duration-500",
            !isMobile && isHovered && "scale-110",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
          loading="lazy"
          onLoad={handleImageLoad}
          onError={handleImageError}
          crossOrigin="anonymous"
          referrerPolicy="no-referrer-when-downgrade"
          data-product-name={name}
          data-image-src={image}
          data-debug="product-card-image"
        />
      </>
    );
  };

  // Calculate total price for quantity display
  const getTotalPrice = () => {
    if (customerPricing) {
      return customerPricing.price * quantity;
    }
    if (price) {
      return price * quantity;
    }
    return 0;
  };

  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all duration-300 shadow-sm group bg-white border border-gray-200",
        isMobile ? "rounded-2xl" : "rounded-xl hover:scale-[1.02] hover:shadow-lg",
        isMobile && isPressed && "scale-[0.98]"
      )}
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <Link to={`/products/${id}`}>
        <div className={cn(
          "overflow-hidden bg-gray-50 relative",
          isMobile ? "aspect-[4/3] rounded-t-2xl" : "aspect-square rounded-t-xl"
        )}>
          {renderImage()}
          
          <div className={cn(
            "absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent transition-opacity duration-300",
            isHovered && !isMobile ? "opacity-100" : "opacity-0"
          )} />
          
          <div className="absolute top-3 left-3">
            <span className={cn(
              "font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full backdrop-blur-sm border",
              isMobile ? "text-xs bg-white/95 text-gray-800 border-white/50" : "text-xs bg-brand-primary text-white border-brand-primary/20",
              "shadow-sm"
            )}>
              {category}
            </span>
          </div>
        </div>
      </Link>
      
      <CardContent className={cn(
        "bg-white",
        isMobile ? "p-4 space-y-3" : "p-4 space-y-2"
      )}>
        <Link to={`/products/${id}`}>
          <h3 className={cn(
            "font-semibold text-gray-900 hover:text-brand-primary transition-colors leading-snug line-clamp-2",
            isMobile ? "text-base" : "text-base",
            "tracking-tight"
          )}>
            {name}
          </h3>
        </Link>

        {isLoggedIn && customerPricing && (
          <div className={cn(
            "space-y-2",
            isMobile && "pt-1 border-t border-gray-100"
          )}>
            <div className="flex items-baseline justify-between">
              <div className="flex flex-col">
                <span className={cn(
                  "font-bold text-gray-900",
                  isMobile ? "text-lg" : "text-base"
                )}>
                  {new Intl.NumberFormat('da-DK', {
                    style: 'currency',
                    currency: 'DKK'
                  }).format(customerPricing.price)}
                </span>
                {getUnitDisplay() && (
                  <span className={cn(
                    "text-gray-500 font-medium",
                    isMobile ? "text-sm" : "text-xs"
                  )}>
                    per {getUnitDisplay()}
                  </span>
                )}
                
                {/* **TOTAL PRICE - ALWAYS RENDERED FOR CONSISTENT HEIGHT** */}
                <div className={cn(
                  "min-h-[1.25rem] flex items-center",
                  isMobile ? "mt-1" : "mt-0.5"
                )}>
                  {quantity > 1 ? (
                    <span className={cn(
                      "text-brand-primary font-semibold",
                      isMobile ? "text-sm" : "text-xs"
                    )}>
                      Total: {new Intl.NumberFormat('da-DK', {
                        style: 'currency',
                        currency: 'DKK'
                      }).format(getTotalPrice())}
                    </span>
                  ) : (
                    <span className="invisible">
                      Total: 0,00 kr.
                    </span>
                  )}
                </div>
              </div>
              
              {customerPricing.discountType !== 'none' && customerPricing.discountLabel && (
                <div className="flex flex-col items-end">
                  <span 
                     className={cn(
                       "text-white font-semibold px-2 py-1 rounded-md",
                       isMobile ? "text-xs" : "text-xs"
                     )}
                     style={{
                       backgroundColor: customerPricing.groupDetails?.groupColor || '#609c14'
                     }}
                   >
                    {customerPricing.discountLabel}
                  </span>
                  {customerPricing.showStrikethrough && customerPricing.originalPrice && (
                    <span className={cn(
                      "text-gray-400 line-through font-medium mt-1",
                      isMobile ? "text-sm" : "text-xs"
                    )}>
                      {new Intl.NumberFormat('da-DK', {
                        style: 'currency',
                        currency: 'DKK'
                      }).format(customerPricing.originalPrice)}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* **MOBILE ONLY: COMPACT SAVINGS INDICATOR** */}
            {quantity > 1 && isMobile && customerPricing.showStrikethrough && customerPricing.originalPrice && (
              <div className="text-xs text-brand-success font-medium bg-green-50 px-2 py-1 rounded border-l-2 border-green-400">
                💰 Du sparer: {new Intl.NumberFormat('da-DK', {
                  style: 'currency',
                  currency: 'DKK'
                }).format((customerPricing.originalPrice - customerPricing.price) * quantity)}
              </div>
            )}
          </div>
        )}

        {isLoggedIn && !customerPricing && price && (
          <div className={cn(
            "space-y-2",
            isMobile && "pt-1 border-t border-gray-100"
          )}>
            <div className="flex items-baseline justify-between">
              <div className="flex flex-col">
                <span className={cn(
                  "font-bold text-gray-900",
                  isMobile ? "text-lg" : "text-base"
                )}>
                  {new Intl.NumberFormat('da-DK', {
                    style: 'currency',
                    currency: 'DKK'
                  }).format(price)}
                </span>
                {getUnitDisplay() && (
                  <span className={cn(
                    "text-gray-500 font-medium",
                    isMobile ? "text-sm" : "text-xs"
                  )}>
                    per {getUnitDisplay()}
                  </span>
                )}
                
                {/* **TOTAL PRICE - ALWAYS RENDERED FOR CONSISTENT HEIGHT** */}
                <div className={cn(
                  "min-h-[1.25rem] flex items-center",
                  isMobile ? "mt-1" : "mt-0.5"
                )}>
                  {quantity > 1 ? (
                    <span className={cn(
                      "text-brand-primary font-semibold",
                      isMobile ? "text-sm" : "text-xs"
                    )}>
                      Total: {new Intl.NumberFormat('da-DK', {
                        style: 'currency',
                        currency: 'DKK'
                      }).format(price * quantity)}
                    </span>
                  ) : (
                    <span className="invisible">
                      Total: 0,00 kr.
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {!isLoggedIn && (
          <div className={cn(
            "space-y-2",
            isMobile && "pt-1 border-t border-gray-100"
          )}>
            <div className={cn(
              "text-center p-3 bg-brand-gray-50 rounded-lg border border-brand-gray-200"
            )}>
              <p className={cn(
                "text-brand-gray-700 font-medium",
                isMobile ? "text-sm" : "text-sm"
              )}>
                Log ind for at se priser
              </p>
              {getUnitDisplay() && (
                <p className={cn(
                  "text-brand-gray-500 mt-1",
                  isMobile ? "text-xs" : "text-xs"
                )}>
                  Enhed: {getUnitDisplay()}
                </p>
              )}
            </div>
            
            {/* **CONSISTENT HEIGHT SPACER FOR NON-LOGGED-IN USERS** */}
            <div className="min-h-[1.25rem]"></div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className={cn(
        "bg-white border-t border-gray-100",
        isMobile ? "p-4" : "p-4",
        "flex justify-between items-center gap-3"
      )}>
        {isLoggedIn ? (
          <>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="icon" 
                className={cn(
                  "rounded-xl transition-all duration-200 border-gray-300 bg-white",
                  isMobile ? "h-11 w-11" : "h-9 w-9",
                  quantity === 0 
                    ? "opacity-50 cursor-not-allowed" 
                    : "hover:bg-brand-gray-50 hover:text-brand-primary hover:border-brand-primary/30 active:scale-95 shadow-sm"
                )}
                onClick={decreaseQuantity}
                disabled={quantity === 0}
              >
                <Minus className={cn(isMobile ? "h-4 w-4" : "h-4 w-4")} />
              </Button>
              
              <span className={cn(
                "text-center font-bold text-gray-900 min-w-[2rem]",
                isMobile ? "text-lg" : "text-base"
              )}>
                {quantity}
              </span>
              
              <Button 
                variant="outline" 
                size="icon" 
                className={cn(
                  "rounded-xl transition-all duration-200 border-gray-300 bg-white hover:bg-brand-gray-50 hover:text-brand-primary hover:border-brand-primary/30 active:scale-95 shadow-sm",
                  isMobile ? "h-11 w-11" : "h-9 w-9"
                )}
                onClick={increaseQuantity}
              >
                <Plus className={cn(isMobile ? "h-4 w-4" : "h-4 w-4")} />
              </Button>
            </div>

            {/* **WIDER CART BUTTON - BETTER SPACE UTILIZATION** */}
            <Button 
              className={cn(
                "rounded-xl transition-all duration-200 shadow-sm font-semibold flex-1 max-w-[120px]",
                isMobile ? "h-11 px-4" : "h-9 px-3",
                quantity === 0 
                  ? "opacity-50 cursor-not-allowed bg-gray-400" 
                  : "bg-brand-primary hover:bg-brand-primary-hover active:scale-95 hover:shadow-md text-white"
              )}
              disabled={quantity === 0}
              aria-label="Tilføj til kurv"
            >
              <ShoppingCart className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} />
            </Button>
          </>
        ) : (
          <Link to="/login" className="w-full">
            <Button 
              className={cn(
                "w-full rounded-xl transition-all duration-200 shadow-sm bg-brand-primary hover:bg-brand-primary-hover active:scale-95 hover:shadow-md text-white font-semibold",
                isMobile ? "h-11 text-sm" : "h-9 text-sm"
              )}
            >
              Log ind for at handle
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
