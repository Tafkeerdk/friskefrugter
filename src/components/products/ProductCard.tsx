import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ShoppingCart, Minus, Plus, Package, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";

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
  const [quantityInput, setQuantityInput] = useState("0");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { addToCart } = useCart();

  // Update quantityInput when quantity changes programmatically
  React.useEffect(() => {
    setQuantityInput(quantity.toString());
  }, [quantity]);

  const increaseQuantity = () => {
    const newQuantity = quantity + 1;
    setQuantity(newQuantity);
    setQuantityInput(newQuantity.toString());
  };

  const decreaseQuantity = () => {
    const newQuantity = Math.max(0, quantity - 1);
    setQuantity(newQuantity);
    setQuantityInput(newQuantity.toString());
  };

  const handleQuantityInputChange = (value: string) => {
    // Allow only numbers and empty string (for clearing)
    if (value === '' || (/^\d+$/.test(value) && parseInt(value) <= 1000)) {
      setQuantityInput(value);
    }
  };

  const handleQuantityInputBlur = () => {
    const newQuantity = parseInt(quantityInput) || 0;
    const clampedQuantity = Math.max(0, Math.min(1000, newQuantity));
    
    setQuantity(clampedQuantity);
    setQuantityInput(clampedQuantity.toString());
  };

  const handleQuantityInputEnter = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleQuantityInputBlur();
    }
  };

  const handleAddToCart = async () => {
    if (quantity === 0 || !isLoggedIn) return;
    
    setIsAddingToCart(true);
    try {
      const success = await addToCart(id, quantity);
      if (success) {
        toast({
          title: "Tilføjet til kurv",
          description: `${quantity} x ${name} er tilføjet til din kurv`,
          variant: "default",
        });
        setQuantity(0); // Reset quantity after successful add
      } else {
        toast({
          title: "Fejl",
          description: "Kunne ikke tilføje til kurv",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      toast({
        title: "Fejl",
        description: "Der opstod en fejl ved tilføjelse til kurv",
        variant: "destructive",
      });
    } finally {
      setIsAddingToCart(false);
    }
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
          <Package className="h-5 w-5 text-gray-400 mb-1" />
          <span className="text-[10px] text-gray-500 text-center px-2 leading-none font-medium">
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
        "overflow-hidden transition-all duration-300 bg-white border border-gray-200 rounded-lg group h-full flex flex-col",
        // **RESPONSIVE WIDTH - OPTIMIZED FOR 4:3 IMAGES**
        isMobile ? "w-full max-w-[240px] mx-auto" : "w-full max-w-[320px] mx-auto",
        // **HOVER EFFECTS**
        !isMobile && "hover:shadow-lg hover:shadow-gray-200/50",
        "shadow-sm"
      )}
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
    >
      {/* **🖼️ 1. PRODUCT IMAGE AREA - 4:3 ASPECT RATIO** */}
      <Link to={`/products/${id}`}>
        <div className="relative w-full bg-gray-50 overflow-hidden rounded-t-lg aspect-[4/3]">
          {renderImage()}
          
          {/* **DISCOUNT BADGE - TOP RIGHT CORNER OF IMAGE** */}
          {isLoggedIn && customerPricing && customerPricing.discountType !== 'none' && customerPricing.discountLabel && (
            <div className="absolute top-2 right-2 z-10">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge 
                      className="text-xs font-medium px-2 py-1 text-white cursor-help shadow-lg"
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
            </div>
          )}
          
          {/* Hover overlay for interactivity */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent transition-opacity duration-300",
            isHovered && !isMobile ? "opacity-100" : "opacity-0"
          )} />
        </div>
      </Link>
      
      <CardContent className={cn(
        "flex flex-col h-full",
        isMobile ? "p-3" : "p-4"
      )}>
        {/* **📝 2. INFORMATION & PRICING (MIDDLE BLOCK)** */}
        <div className="flex-1 flex flex-col">
          {/* **Product Name - Bold, FIXED HEIGHT for consistency** */}
          <div className={cn(
            "mb-2",
            isMobile ? "h-8" : "h-10" // Fixed height for 1-2 lines
          )}>
            <Link to={`/products/${id}`}>
              <h3 
                className="font-bold text-gray-900 hover:text-brand-primary transition-colors leading-tight line-clamp-2 cursor-pointer"
                style={{ fontSize: isMobile ? '14px' : '16px', lineHeight: '1.2' }}
              >
                {name}
              </h3>
            </Link>
          </div>
          
          {/* **Category Label - FIXED HEIGHT for consistency** */}
          <div className="mb-3 h-6 flex items-start">
            <Badge 
              variant="secondary" 
              className="bg-brand-primary/10 text-brand-primary-dark text-xs font-medium px-2 py-1 rounded-full w-fit"
            >
              {category.toUpperCase()}
            </Badge>
          </div>

          {/* **Price Display Section - CONSISTENT HEIGHT** */}
          <div className={cn(
            "flex-1 flex flex-col justify-start",
            isMobile ? "min-h-[60px]" : "min-h-[70px]"
          )}>
            {isLoggedIn && customerPricing && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {/* **Discounted Price - Bold, large, primary color** */}
                  <span 
                    className="font-bold text-gray-900"
                    style={{ fontSize: isMobile ? '16px' : '18px' }}
                  >
                    {new Intl.NumberFormat('da-DK', {
                      style: 'currency',
                      currency: 'DKK'
                    }).format(customerPricing.price)}
                  </span>
                  
                  {/* **FIXED: Original Price - Light gray, struck through** */}
                  {((customerPricing.discountType === 'unique_offer' && customerPricing.originalPrice) || 
                    (customerPricing.showStrikethrough && customerPricing.originalPrice)) && (
                    <span className="text-sm text-gray-400 line-through font-medium">
                      {new Intl.NumberFormat('da-DK', {
                        style: 'currency',
                        currency: 'DKK'
                      }).format(customerPricing.originalPrice)}
                    </span>
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
                  style={{ fontSize: isMobile ? '16px' : '18px' }}
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

            {/* **Login Required Message - CONSISTENT HEIGHT** */}
            {!isLoggedIn && (
              <div className={cn(
                "text-center bg-gray-50 rounded-lg border border-gray-200 flex flex-col justify-center",
                isMobile ? "p-2 min-h-[50px]" : "p-3 min-h-[60px]"
              )}>
                <p className={cn(
                  "text-gray-700 font-medium",
                  isMobile ? "text-xs" : "text-sm"
                )}>
                  Log ind for at se priser
                </p>
                <p className={cn(
                  "text-gray-500 mt-1",
                  isMobile ? "text-xs" : "text-xs"
                )}>
                  Enhed: {getUnitDisplay()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* **🛒 3. ACTIONS & QUANTITY (BOTTOM BLOCK) - CONSISTENT HEIGHT** */}
        <div className="mt-auto pt-3 border-t border-gray-100">
          {isLoggedIn ? (
            <div className="space-y-3">
              {/* **Quantity Selector - Horizontal layout with INPUT FIELD** */}
              <div className="flex items-center justify-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className={cn(
                    "rounded-lg border-gray-300 transition-all hover:bg-gray-50",
                    isMobile ? "h-10 w-10" : "h-11 w-11",
                    quantity === 0 
                      ? "opacity-50 cursor-not-allowed" 
                      : "hover:border-brand-primary/40 active:scale-95"
                  )}
                  onClick={decreaseQuantity}
                  disabled={quantity === 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                
                {/* QUANTITY INPUT FIELD - PRIMARY INPUT METHOD */}
                <Input
                  type="text"
                  inputMode="numeric"
                  value={quantityInput}
                  onChange={(e) => handleQuantityInputChange(e.target.value)}
                  onBlur={handleQuantityInputBlur}
                  onKeyDown={handleQuantityInputEnter}
                  className={cn(
                    "text-center font-bold border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary",
                    isMobile ? "h-10 w-16 text-base" : "h-11 w-20 text-lg"
                  )}
                  min="0"
                  max="1000"
                />
                
                <Button 
                  variant="outline" 
                  size="icon" 
                  className={cn(
                    "rounded-lg border-gray-300 transition-all hover:bg-gray-50 hover:border-brand-primary/40 active:scale-95",
                    isMobile ? "h-10 w-10" : "h-11 w-11"
                  )}
                  onClick={increaseQuantity}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* **Add to Cart Button - Full-width green button** */}
              <Button 
                className={cn(
                  "w-full rounded-lg transition-all duration-200 font-semibold gap-2",
                  isMobile ? "h-10 text-sm" : "h-11 text-base",
                  quantity === 0 || isAddingToCart
                    ? "opacity-50 cursor-not-allowed bg-gray-400 text-gray-200" 
                    : "bg-brand-primary hover:bg-brand-primary-hover active:scale-[0.98] shadow-sm hover:shadow-md text-white"
                )}
                disabled={quantity === 0 || isAddingToCart}
                onClick={handleAddToCart}
                aria-label="Tilføj til kurv"
              >
                <ShoppingCart className="h-4 w-4" />
                {isAddingToCart ? "Tilføjer..." : (isMobile ? "Tilføj" : "Tilføj til kurv")}
              </Button>

              {/* **Total Price (Dynamic) - Only appears if quantity > 0** */}
              {quantity > 0 && (
                <div className="text-center">
                  <span 
                    className="font-semibold text-brand-primary-dark"
                    style={{ fontSize: isMobile ? '14px' : '16px' }}
                  >
                    Total: {new Intl.NumberFormat('da-DK', {
                      style: 'currency',
                      currency: 'DKK'
                    }).format(getTotalPrice())}
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* **Login Button for Non-Authenticated Users** */
            <Link to="/login" className="w-full">
              <Button className={cn(
                "w-full rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold transition-all",
                isMobile ? "h-10 text-sm" : "h-11 text-base"
              )}>
                {isMobile ? "Log ind" : "Log ind for at handle"}
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
