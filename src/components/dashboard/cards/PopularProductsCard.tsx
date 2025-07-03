import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  image: string;
  sales: number;
  status: "available" | "low" | "out";
}

interface PopularProductsCardProps {
  products: Product[];
  className?: string;
}

// Enhanced Product Image Component with robust error handling
const ProductImageWithFallback: React.FC<{
  src: string;
  alt: string;
  productName: string;
}> = ({ src, alt, productName }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    console.error('❌ PopularProducts image failed to load:', {
      src,
      productName
    });
    setImageError(true);
    setImageLoaded(true);
  };

  const renderPlaceholder = () => (
    <div className="h-full w-full bg-gradient-to-br from-brand-gray-100 to-brand-gray-200 flex items-center justify-center rounded-md">
      <div className="text-center">
        <Package className="h-5 w-5 text-brand-gray-400 mx-auto mb-1" />
        <p className="text-[8px] text-brand-gray-500 px-1 leading-tight font-medium">
          Billede ikke tilgængeligt
        </p>
      </div>
    </div>
  );

  const renderLoadingState = () => (
    <div className="h-full w-full bg-brand-gray-100 animate-pulse flex items-center justify-center rounded-md">
      <div className="text-center">
        <div className="h-3 w-3 border border-brand-gray-300 border-t-brand-primary rounded-full animate-spin mx-auto mb-1"></div>
        <p className="text-[8px] text-brand-gray-500">Indlæser...</p>
      </div>
    </div>
  );

  return (
    <div className="h-12 w-12 rounded-md overflow-hidden bg-brand-gray-50 flex items-center justify-center relative">
      {!src || imageError || src === 'NO_IMAGE' || src === '' ? (
        renderPlaceholder()
      ) : (
        <>
          {!imageLoaded && renderLoadingState()}
          <img
            src={src === '/placeholder.svg' ? '/placeholder.svg' : src}
            alt={alt}
            className={cn(
              "h-full w-full object-cover transition-opacity duration-300",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            loading="lazy"
            onLoad={handleImageLoad}
            onError={handleImageError}
            crossOrigin="anonymous"
            referrerPolicy="no-referrer-when-downgrade"
            data-product-name={productName}
            data-image-src={src}
            data-debug="popular-products-image"
          />
        </>
      )}
    </div>
  );
};

const PopularProductsCard: React.FC<PopularProductsCardProps> = ({ products, className }) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-brand-gray-900">Populære produkter</CardTitle>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-8 w-8 text-brand-gray-400 mx-auto mb-2" />
            <p className="text-sm text-brand-gray-500">Ingen populære produkter tilgængelige</p>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <div key={product.id} className="flex items-center gap-4 p-2 rounded-lg hover:bg-brand-gray-50/50 transition-colors">
                <ProductImageWithFallback
                  src={product.image}
                  alt={product.name}
                  productName={product.name}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-brand-gray-900">{product.name}</p>
                  <p className="text-xs text-brand-gray-500">
                    {product.sales} solgt denne uge
                  </p>
                </div>
                <Badge
                  variant={
                    product.status === "available"
                      ? "default"
                      : product.status === "low"
                        ? "secondary"
                        : "destructive"
                  }
                  className={cn(
                    "rounded-full px-2.5 text-xs",
                    product.status === "available" && "bg-brand-success text-white",
                    product.status === "low" && "bg-brand-warning text-white",
                    product.status === "out" && "bg-brand-error text-white"
                  )}
                >
                  {product.status === "available"
                    ? "På lager"
                    : product.status === "low"
                      ? "Lav lagerstatus"
                      : "Udsolgt"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PopularProductsCard;
