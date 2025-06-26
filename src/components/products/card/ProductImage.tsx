import React, { useState } from "react";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProductImageProps {
  images?: Array<{
    _id: string;
    url: string;
    filename: string;
    isPrimary?: boolean;
  }>;
  productName: string;
  categoryName: string;
  isHovered: boolean;
  onImageLoad?: () => void;
  onImageError?: () => void;
}

export function ProductImage({ 
  images, 
  productName, 
  categoryName, 
  isHovered, 
  onImageLoad, 
  onImageError 
}: ProductImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const isMobile = useIsMobile();

  // Get primary image or first image
  const primaryImage = images?.find(img => img.isPrimary) || images?.[0];
  const imageUrl = primaryImage?.url;

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
    onImageLoad?.();
  };

  const handleImageError = () => {
    console.error('❌ ProductImage failed to load:', {
      src: imageUrl,
      productName
    });
    
    setImageError(true);
    setImageLoaded(true);
    onImageError?.();
  };

  const renderPlaceholder = () => (
    <div className="h-full w-full bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-2" />
        <p className="text-xs text-gray-500">Billede ikke tilgængeligt</p>
        <p className="text-xs text-gray-400 mt-1 truncate px-2">{productName}</p>
      </div>
    </div>
  );

  const renderLoadingState = () => (
    <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 border-2 border-gray-300 border-t-green-600 rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-xs text-gray-500">Indlæser...</p>
      </div>
    </div>
  );

  return (
    <div className={cn(
      "aspect-square overflow-hidden bg-gray-50 relative",
      isMobile ? "rounded-t-xl" : "rounded-t-xl"
    )}>
      {!imageUrl || imageError ? (
        renderPlaceholder()
      ) : (
        <>
          {!imageLoaded && renderLoadingState()}
          <img 
            src={imageUrl} 
            alt={productName} 
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
            data-product-name={productName}
            data-image-src={imageUrl}
            data-debug="product-card-image"
          />
        </>
      )}
      
      {/* Gradient overlay */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent transition-opacity duration-300",
        isHovered && !isMobile ? "opacity-100" : "opacity-0"
      )} />
      
      {/* Category badge */}
      <div className={cn(
        "absolute bottom-3 left-3 transition-all duration-300",
        isHovered && !isMobile ? "translate-y-0 opacity-100" : isMobile ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      )}>
        <span className={cn(
          "text-xs font-medium uppercase px-2 py-1 rounded-full backdrop-blur-sm",
          isMobile ? "bg-white/90 text-gray-800" : "bg-brand-primary text-white"
        )}>
          {categoryName}
        </span>
      </div>
    </div>
  );
} 