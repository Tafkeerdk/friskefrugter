import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  id: string;
  name: string;
  image: string;
  category: string;
  isLoggedIn?: boolean;
  price?: number;
}

export function ProductCard({ id, name, image, category, isLoggedIn = false, price }: ProductCardProps) {
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

  const handleImageError = () => {
    console.log('Image failed to load in ProductCard:', image);
    setImageError(true);
    setImageLoaded(true);
  };

  const renderImage = () => {
    if (imageError) {
      return (
        <div className="h-full w-full bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-500">Billede ikke tilgængeligt</p>
          </div>
        </div>
      );
    }

    return (
      <>
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
            <div className="text-center">
              <div className="h-8 w-8 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs text-gray-500">Indlæser...</p>
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
          // Add crossorigin for external images (like Unsplash)
          crossOrigin="anonymous"
          // Add referrer policy for better compatibility
          referrerPolicy="no-referrer-when-downgrade"
        />
      </>
    );
  };

  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all duration-300 shadow-sm rounded-xl group",
        !isMobile && "hover:scale-[1.02] hover:shadow-lg",
        isMobile && isPressed && "scale-[0.98]",
        "bg-white border-0"
      )}
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <Link to={`/products/${id}`}>
        <div className={cn(
          "aspect-square overflow-hidden bg-gray-50 relative",
          isMobile ? "rounded-t-xl" : "rounded-t-xl"
        )}>
          {renderImage()}
          
          <div className={cn(
            "absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent transition-opacity duration-300",
            isHovered && !isMobile ? "opacity-100" : "opacity-0"
          )} />
          
          <div className={cn(
            "absolute bottom-3 left-3 transition-all duration-300",
            isHovered && !isMobile ? "translate-y-0 opacity-100" : isMobile ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          )}>
            <span className={cn(
              "text-xs font-medium uppercase px-2 py-1 rounded-full backdrop-blur-sm",
              isMobile ? "bg-white/90 text-gray-800" : "bg-green-600 text-white"
            )}>
              {category}
            </span>
          </div>
          
          {/* Mobile: Show price overlay */}
          {isMobile && isLoggedIn && price && (
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
              <span className="text-xs font-semibold text-gray-800">{price.toFixed(2)} kr</span>
            </div>
          )}
        </div>
      </Link>
      
      <CardContent className={cn(
        "bg-white",
        isMobile ? "p-3" : "p-4"
      )}>
        <Link to={`/products/${id}`}>
          <h3 className={cn(
            "font-medium text-gray-900 hover:text-green-600 transition-colors line-clamp-2",
            isMobile ? "text-sm leading-tight" : "text-base"
          )}>
            {name}
          </h3>
        </Link>
        
        {/* Desktop: Show price */}
        {!isMobile && isLoggedIn && price && (
          <p className="mt-2 text-gray-700 font-semibold text-lg">{price.toFixed(2)} kr</p>
        )}
        
        {!isLoggedIn && (
          <p className={cn(
            "mt-1 text-gray-500",
            isMobile ? "text-xs" : "text-sm"
          )}>
            Log ind for at se priser
          </p>
        )}
      </CardContent>
      
      <CardFooter className={cn(
        "bg-white border-t border-gray-50",
        isMobile ? "p-3 pt-2" : "p-4 pt-3",
        "flex justify-between items-center"
      )}>
        {isLoggedIn ? (
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              className={cn(
                "rounded-full transition-all duration-200 border-gray-200",
                isMobile ? "h-8 w-8" : "h-9 w-9",
                quantity === 0 
                  ? "opacity-50" 
                  : "hover:bg-green-50 hover:text-green-700 hover:border-green-300 active:scale-95"
              )}
              onClick={decreaseQuantity}
              disabled={quantity === 0}
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
                "rounded-full transition-all duration-200 border-gray-200 hover:bg-green-50 hover:text-green-700 hover:border-green-300 active:scale-95",
                isMobile ? "h-8 w-8" : "h-9 w-9"
              )}
              onClick={increaseQuantity}
            >
              <Plus className={cn(isMobile ? "h-3 w-3" : "h-4 w-4")} />
            </Button>
          </div>
        ) : (
          <div className="flex-1"></div>
        )}
        
        {isLoggedIn && (
          <Button 
            size={isMobile ? "sm" : "default"}
            className={cn(
              "rounded-full gap-1 transition-all duration-200 shadow-sm",
              isMobile ? "h-8 px-3 text-xs" : "h-9 px-4 text-sm",
              quantity === 0 
                ? "opacity-50 cursor-not-allowed" 
                : "bg-green-600 hover:bg-green-700 active:scale-95 hover:shadow-md"
            )}
            disabled={quantity === 0}
          >
            <ShoppingCart className={cn(isMobile ? "h-3 w-3" : "h-4 w-4")} />
            <span className="font-medium">
              {isMobile ? "Tilføj" : "Tilføj til kurv"}
            </span>
          </Button>
        )}
        
        {!isLoggedIn && (
          <Link to="/login" className="flex-1 flex justify-end">
            <Button 
              size={isMobile ? "sm" : "default"}
              className={cn(
                "rounded-full transition-all duration-200 shadow-sm bg-green-600 hover:bg-green-700 active:scale-95 hover:shadow-md",
                isMobile ? "h-8 px-4 text-xs" : "h-9 px-6 text-sm"
              )}
            >
              <span className="font-medium">Log ind</span>
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
