import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Minus, 
  Plus, 
  ShoppingCart, 
  Info, 
  Truck, 
  CalendarCheck, 
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  Package,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductPricing, CustomerPricing } from "@/components/products/card/ProductPricing";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { api, handleApiError } from "@/lib/api";
import { authService } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Types
interface Unit {
  _id: string;
  value: string;
  label: string;
  description?: string;
  isActive: boolean;
}

interface Product {
  _id: string;
  produktnavn: string;
  varenummer?: string;
  beskrivelse?: string;
  eanNummer?: string;
  enhed: string | Unit; // Can be either string or Unit object
  basispris: number;
  kategori: {
    _id: string;
    navn: string;
  };
  billeder: Array<{
    _id: string;
    url: string;
    filename: string;
    isPrimary: boolean;
  }>;
  aktiv: boolean;
  lagerstyring?: {
    enabled: boolean;
    antalPaaLager?: number;
    minimumslager?: number;
  };
  createdAt: string;
  updatedAt: string;
  // Customer-specific pricing (only for logged-in users)
  customerPricing?: CustomerPricing;
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { toast } = useToast();
  
  // State management
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [quantityInput, setQuantityInput] = useState("1");
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  // Image gallery states
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Update quantityInput when quantity changes programmatically
  useEffect(() => {
    setQuantityInput(quantity.toString());
  }, [quantity]);

  // Load product data
  useEffect(() => {
    if (id) {
      // Force reload on mount if no product data exists (handles force refresh)
      const shouldForceRefresh = !product && !!id;
      loadProductData(shouldForceRefresh);
    }
  }, [id, isAuthenticated]);
  
  // Handle force refresh - refetch data when component mounts without product
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !product && id) {
        console.log('🔄 Page became visible without product data, refetching...');
        loadProductData(true);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [product, id]);

     const loadProductData = async (forceRefresh = false) => {
     if (!id) return;
     
     try {
       setIsLoading(true);
       setError(null);
       
       console.log('🔄 Loading product data...', { id, isAuthenticated, forceRefresh });
       
       if (!isAuthenticated) {
         // For public users, use public endpoint
         const publicResponse = await api.getProduct(id);
         if (publicResponse.success && publicResponse.data) {
           const productData = publicResponse.data as Product;
           const publicProductData = {
             ...productData,
             customerPricing: {
               price: 0, // Hide price for public users
               originalPrice: 0,
               discountType: 'none' as const,
               discountLabel: null,
               discountPercentage: 0,
               showStrikethrough: false
             }
           };
           setProduct(publicProductData);
           
           // Load related products from same category
           if (productData.kategori?._id) {
             loadRelatedProducts(productData.kategori._id);
           }
         } else {
           setError('Produktet blev ikke fundet');
         }
       } else {
         // For authenticated users, try multiple approaches for robust data fetching
         let productData = null;
         
         try {
           // First: Try to get from customer products with pricing
           console.log('🔄 Attempting customer products fetch...');
           const customerResponse = await api.getCustomerProducts({ 
             limit: 1000 // Get enough to find our product
           });
           
           if (customerResponse.success && customerResponse.data && (customerResponse.data as any).products) {
             const products = (customerResponse.data as any).products;
             console.log('🔍 Looking for product ID:', id);
             console.log('📦 Available product IDs:', products.map((p: Product) => p._id).slice(0, 10));
             console.log('🔍 First product enhed:', products[0]?.enhed);
             productData = products.find((p: Product) => p._id === id);
             
             if (productData) {
               console.log('✅ Found product in customer list:', productData.produktnavn);
               console.log('🔧 Product enhed:', productData.enhed);
             }
           }
         } catch (customerError) {
           console.warn('⚠️ Customer products fetch failed:', customerError);
         }
         
         // Fallback: Always try single product endpoint if customer fetch failed or product not found
         if (!productData) {
           try {
             console.log('🔄 Using fallback: api.getProduct()');
             const singleProductResponse = await api.getProduct(id);
             if (singleProductResponse.success && singleProductResponse.data) {
               const fallbackData = singleProductResponse.data as Product;
               console.log('📦 Fallback product enhed:', fallbackData.enhed);
               
               // For authenticated users, create basic customer pricing structure
               productData = {
                 ...fallbackData,
                 customerPricing: {
                   price: fallbackData.basispris,
                   originalPrice: fallbackData.basispris,
                   discountType: 'none' as const,
                   discountLabel: null,
                   discountPercentage: 0,
                   showStrikethrough: false
                 }
               };
               console.log('✅ Fallback product loaded:', productData.produktnavn);
             }
           } catch (fallbackError) {
             console.error('❌ Fallback product fetch failed:', fallbackError);
           }
         }
         
         if (productData) {
           setProduct(productData);
           
           // Load related products from same category
           if (productData.kategori?._id) {
             loadRelatedProducts(productData.kategori._id);
           }
         } else {
           setError('Produktet blev ikke fundet');
         }
       }
       
     } catch (error) {
       console.error('Error loading product:', error);
       const apiError = handleApiError(error);
       setError(apiError.message);
       
       toast({
         title: 'Fejl',
         description: 'Kunne ikke indlæse produktet',
         variant: 'destructive',
         duration: 5000,
       });
     } finally {
       setIsLoading(false);
     }
   };

  const loadRelatedProducts = async (categoryId: string) => {
    try {
      const response = isAuthenticated 
        ? await api.getCustomerProducts({ kategori: categoryId, limit: 6 })
        : await api.getPublicProducts({ kategori: categoryId, limit: 6 });
      
             if (response.success && response.data && (response.data as any).products) {
         // Filter out current product
         const filtered = (response.data as any).products.filter((p: Product) => p._id !== id);
         // Show 4 products for PC, responsive grid will handle mobile
         setRelatedProducts(filtered.slice(0, 4));
       }
    } catch (error) {
      console.warn('Could not load related products:', error);
    }
  };

  const increaseQuantity = () => {
    const newQuantity = quantity + 1;
    setQuantity(newQuantity);
    setQuantityInput(newQuantity.toString());
  };

  const decreaseQuantity = () => {
    const newQuantity = quantity > 1 ? quantity - 1 : 1;
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
    const newQuantity = parseInt(quantityInput) || 1;
    const clampedQuantity = Math.max(1, Math.min(1000, newQuantity));
    
    setQuantity(clampedQuantity);
    setQuantityInput(clampedQuantity.toString());
  };

  const handleQuantityInputEnter = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleQuantityInputBlur();
    }
  };

  const handleAddToCart = async () => {
    if (!product || !isAuthenticated) return;
    
    setIsAddingToCart(true);
    try {
      const success = await addToCart(product._id, quantity);
      if (success) {
        toast({
          title: 'Tilføjet til kurv',
          description: `${quantity} x ${product.produktnavn} er tilføjet til din kurv`,
          duration: 3000,
        });
        setQuantity(1); // Reset quantity after successful add
      } else {
        toast({
          title: 'Fejl',
          description: 'Kunne ikke tilføje til kurv',
          variant: 'destructive',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke tilføje til kurv',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Get primary product image
  const getPrimaryImage = () => {
    if (!product?.billeder?.length) return '';
    const primary = product.billeder.find(img => img.isPrimary);
    return primary?.url || product.billeder[0]?.url || '';
  };

  // Image gallery functions
  const openImageGallery = (startIndex: number = 0) => {
    setCurrentImageIndex(startIndex);
    setIsImageGalleryOpen(true);
  };

  const nextImage = () => {
    if (product?.billeder?.length) {
      setCurrentImageIndex((prev) => (prev + 1) % product.billeder.length);
    }
  };

  const prevImage = () => {
    if (product?.billeder?.length) {
      setCurrentImageIndex((prev) => (prev - 1 + product.billeder.length) % product.billeder.length);
    }
  };

  // Get unit display value
  const getUnitDisplay = () => {
    if (!product?.enhed) return '';
    if (typeof product.enhed === 'string') return product.enhed;
    return product.enhed.label || product.enhed.value || '';
  };

  // Check stock availability
  const getStockStatus = () => {
    if (!product?.lagerstyring?.enabled) {
      return { status: 'available', text: 'På lager', color: 'bg-green-500' };
    }
    
    const stock = product.lagerstyring.antalPaaLager || 0;
    const minimum = product.lagerstyring.minimumslager || 0;
    
    if (stock === 0) {
      return { status: 'out', text: 'Udsolgt', color: 'bg-red-500' };
    } else if (stock <= minimum) {
      return { status: 'low', text: `Få på lager (${stock})`, color: 'bg-yellow-500' };
    } else {
      return { status: 'available', text: `På lager (${stock})`, color: 'bg-green-500' };
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-8">
            <Skeleton className="h-6 w-48 mb-6" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Skeleton className="h-96 w-full" />
              <div className="space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Produkt ikke fundet</h1>
              <p className="text-gray-600 mb-6">
                {error || 'Det anmodede produkt kunne ikke findes.'}
              </p>
              <Button onClick={() => navigate('/products')}>
                Tilbage til produkter
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const stockStatus = getStockStatus();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <div className="mb-6">
            <Link to="/products" className="text-brand-primary hover:text-brand-primary-hover flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span>Tilbage til produkter</span>
            </Link>
          </div>

          {/* Product Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Product Images Section - ENHANCED WITH MULTIPLE IMAGE SUPPORT */}
            <div className="space-y-4">
              {/* Main Image Display */}
              <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
                <div className="relative aspect-square">
                  {product?.billeder?.length > 0 ? (
                    <>
                      <img 
                        src={product.billeder[currentImageIndex]?.url || getPrimaryImage()} 
                        alt={product.produktnavn} 
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                        onClick={() => openImageGallery(currentImageIndex)}
                        onError={(e) => {
                          // If image fails to load, replace with placeholder
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const placeholder = target.nextElementSibling as HTMLElement;
                          if (placeholder) placeholder.style.display = 'flex';
                        }}
                      />
                      {/* Fallback placeholder for broken images */}
                      <div 
                        className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center"
                        style={{ display: 'none' }}
                      >
                        <Package className="h-12 w-12 text-gray-400 mb-2" />
                        <span className="text-gray-500 text-center text-xs px-4 leading-tight font-medium">
                          Billede ikke tilgængeligt
                        </span>
                      </div>
                      
                      {/* Image counter badge for multiple images */}
                      {product.billeder.length > 1 && (
                        <div className="absolute top-4 right-4 bg-black/70 text-white px-2 py-1 rounded-lg text-sm font-medium">
                          {currentImageIndex + 1} / {product.billeder.length}
                        </div>
                      )}
                      
                      {/* Navigation arrows for multiple images */}
                      {product.billeder.length > 1 && (
                        <>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg"
                            onClick={(e) => {
                              e.stopPropagation();
                              prevImage();
                            }}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="icon"
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white shadow-lg"
                            onClick={(e) => {
                              e.stopPropagation();
                              nextImage();
                            }}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </>
                  ) : (
                    /* No images placeholder */
                    <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center">
                      <Package className="h-12 w-12 text-gray-400 mb-2" />
                      <span className="text-gray-500 text-center text-xs px-4 leading-tight font-medium">
                        Billede ikke tilgængeligt
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Image Thumbnails - Only show if multiple images */}
              {product?.billeder?.length > 1 && (
                <div className="grid grid-cols-3 gap-2">
                  {product.billeder.map((image, index) => (
                    <div
                      key={image._id || index}
                      className={cn(
                        "relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all duration-200",
                        currentImageIndex === index 
                          ? "border-brand-primary ring-2 ring-brand-primary/20" 
                          : "border-gray-200 hover:border-brand-primary/50"
                      )}
                      onClick={() => setCurrentImageIndex(index)}
                    >
                      <img
                        src={image.url}
                        alt={`${product.produktnavn} billede ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const placeholder = target.nextElementSibling as HTMLElement;
                          if (placeholder) placeholder.style.display = 'flex';
                        }}
                      />
                      {/* Thumbnail placeholder */}
                      <div 
                        className="absolute inset-0 bg-gray-100 flex items-center justify-center"
                        style={{ display: 'none' }}
                      >
                        <Package className="h-4 w-4 text-gray-400" />
                      </div>
                      
                      {/* Primary image indicator */}
                      {image.isPrimary && (
                        <div className="absolute top-1 right-1 bg-brand-primary text-white rounded-full p-1">
                          <Star className="h-3 w-3 fill-current" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">{product.kategori.navn}</Badge>
                {isAuthenticated && (
                  <Badge variant="default" className="bg-brand-primary">
                    B2B Kunde
                  </Badge>
                )}
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.produktnavn}</h1>
              
              {product.varenummer && (
                <p className="text-sm text-gray-500 mb-4">Varenr: {product.varenummer}</p>
              )}
              
              {/* Pricing Section - FIXED TO MATCH PRODUCTCARD EXACTLY */}
              {isAuthenticated ? (
                <div className="mb-6">
                                     {product.customerPricing ? (
                    <div className="space-y-3">
                      {/* Discount Badge - Same as ProductCard */}
                      {product.customerPricing.discountType !== 'none' && product.customerPricing.discountLabel && (
                        <div className="flex items-center gap-2">
                          <Badge 
                            className="text-sm font-medium px-3 py-1 text-white shadow-lg border-0"
                            style={{
                              backgroundColor: product.customerPricing.discountType === 'unique_offer' 
                                ? '#9333EA' // Purple for unique offers
                                : product.customerPricing.discountType === 'fast_udsalgspris'
                                  ? '#DC2626' // Red for fast sales
                                  : product.customerPricing.groupDetails?.groupColor || '#F59E0B' // Group color or fallback
                            }}
                          >
                            {product.customerPricing.discountType === 'unique_offer' 
                              ? 'Særlig tilbud'
                              : product.customerPricing.discountLabel
                            }
                          </Badge>
                          {product.customerPricing.discountPercentage > 0 && (
                            <span className="text-sm font-medium text-brand-success">
                              -{product.customerPricing.discountPercentage}%
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Price Display - EXACT SAME LOGIC AS PRODUCTCARD */}
                      <div className="flex items-center gap-3">
                        {/* FIXED: Original Price with Strikethrough - UNIQUE OFFERS ALWAYS SHOW BEFORE PRICE */}
                        {((product.customerPricing.discountType === 'unique_offer' && product.customerPricing.originalPrice) || 
                          (product.customerPricing.showStrikethrough && product.customerPricing.originalPrice)) && (
                          <span className="text-xl text-gray-500 line-through font-medium">
                            {new Intl.NumberFormat('da-DK', {
                              style: 'currency',
                              currency: 'DKK',
                              minimumFractionDigits: 2
                            }).format(product.customerPricing.originalPrice)}
                          </span>
                        )}
                        
                        {/* Current (Discounted) Price */}
                        <span className={`text-3xl font-bold ${
                          product.customerPricing.discountType === 'unique_offer' 
                            ? 'text-purple-600' 
                            : 'text-brand-primary-dark'
                        }`}>
                          {new Intl.NumberFormat('da-DK', {
                            style: 'currency',
                            currency: 'DKK',
                            minimumFractionDigits: 2
                          }).format(product.customerPricing.price)}
                        </span>
                      </div>
                      
                      {/* Unit Information */}
                      <p className="text-sm text-gray-500">
                        Per {getUnitDisplay()}
                      </p>
                    </div>
                   ) : (
                     <>
                      <div className="text-3xl font-bold text-brand-primary-dark">
                         {new Intl.NumberFormat('da-DK', {
                           style: 'currency',
                           currency: 'DKK',
                           minimumFractionDigits: 2
                         }).format(product.basispris)}
                       </div>
                       <p className="text-sm text-gray-500 mt-1">Per {getUnitDisplay()}</p>
                     </>
                   )}
                </div>
              ) : (
                <div className="p-4 mb-6 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center">
                    <Info className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-blue-900 font-medium">Log ind for at se priser</p>
                      <p className="text-blue-700 text-sm">
                        Få adgang til B2B-priser, specialtilbud og bestil direkte
                      </p>
                    </div>
                  </div>
                  <Link to="/login" className="block mt-3">
                    <Button size="sm" className="btn-brand-primary">
                      Log ind nu
                    </Button>
                  </Link>
                </div>
              )}

              {product.beskrivelse && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-2">Beskrivelse</h3>
                  <p className="text-gray-700">{product.beskrivelse}</p>
                </div>
              )}

              {/* Delivery & Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <Truck className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">Levering</p>
                    <p className="text-green-700 text-sm">Næste arbejdsdag*</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">Bestil inden</p>
                    <p className="text-blue-700 text-sm">Kl. 15:00 på hverdage</p>
                  </div>
                </div>
              </div>

              {/* Product Specifications */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">Produktinfo</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Enhed:</span>
                    <span className="ml-2 font-medium">{getUnitDisplay()}</span>
                  </div>
                  {product.eanNummer && (
                    <div>
                      <span className="text-gray-500">EAN:</span>
                      <span className="ml-2 font-medium">{product.eanNummer}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Add to Cart Section */}
              {isAuthenticated ? (
                <div className="mt-auto">
                  {/* **SAME ROW: Quantity Selector + Add to Cart Button** */}
                  <div className="flex items-center gap-3 mb-4">
                    {/* Quantity Selector - MOBILE-OPTIMIZED WITH INPUT FIELD */}
                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 border border-gray-200">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-10 w-10 p-0 hover:bg-white rounded-md" 
                        onClick={decreaseQuantity}
                        disabled={isAddingToCart || quantity <= 1}
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
                        disabled={isAddingToCart}
                        className="h-10 w-16 text-center text-sm font-medium border-0 bg-white rounded-md shadow-sm focus:ring-2 focus:ring-brand-primary/20"
                        min="1"
                        max="1000"
                      />
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-10 w-10 p-0 hover:bg-white rounded-md" 
                        onClick={increaseQuantity}
                        disabled={isAddingToCart || quantity >= 1000}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Add to Cart Button - Takes remaining space */}
                    <Button 
                      className="btn-brand-primary flex-1 h-10" 
                      onClick={handleAddToCart}
                      disabled={isAddingToCart || stockStatus.status === 'out'}
                    >
                      {isAddingToCart ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Tilføjer...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">Tilføj til kurv</span>
                          <span className="sm:hidden">Tilføj</span>
                        </>
                      )}
                    </Button>
                  </div>

                  {/* **NEW LINE: Total Price Formula (Always Show if Quantity > 0)** */}
                  {quantity > 0 && product.customerPricing && (
                    <div className="p-3 bg-brand-gray-50 rounded-lg border border-brand-gray-200 mb-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <span className="text-sm font-medium text-brand-gray-700">
                          Total ({quantity} × {getUnitDisplay() || 'stk'}):
                        </span>
                        <span className="text-xl font-bold text-brand-primary">
                          {new Intl.NumberFormat('da-DK', {
                            style: 'currency',
                            currency: 'DKK'
                          }).format(product.customerPricing.price * quantity)}
                        </span>
                      </div>
                      {product.customerPricing.showStrikethrough && product.customerPricing.originalPrice && quantity > 0 && (
                        <div className="text-xs text-brand-success mt-2 font-medium">
                          Du sparer: {new Intl.NumberFormat('da-DK', {
                            style: 'currency',
                            currency: 'DKK'
                          }).format((product.customerPricing.originalPrice - product.customerPricing.price) * quantity)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Fallback for products without customerPricing but with basispris */}
                  {quantity > 0 && !product.customerPricing && product.basispris && (
                    <div className="p-3 bg-brand-gray-50 rounded-lg border border-brand-gray-200 mb-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <span className="text-sm font-medium text-brand-gray-700">
                          Total ({quantity} × {getUnitDisplay() || 'stk'}):
                        </span>
                        <span className="text-xl font-bold text-brand-primary">
                          {new Intl.NumberFormat('da-DK', {
                            style: 'currency',
                            currency: 'DKK'
                          }).format(product.basispris * quantity)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Stock Status */}
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${stockStatus.color}`}></span>
                    <span className="text-gray-700 text-sm">{stockStatus.text}</span>
                  </div>
                </div>
              ) : (
                <div className="mt-auto">
                  <Link to="/login">
                    <Button className="w-full sm:w-auto btn-brand-primary">
                      Log ind for at bestille
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Information */}
          <Card className="mb-12">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Truck className="h-5 w-5 mr-2 text-brand-primary" />
                Levering & Betingelser
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Næste dag levering</h4>
                    <p className="text-sm text-gray-600">
                      Bestil inden kl. 15:00 på hverdage og modtag varen næste arbejdsdag
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Fri fragt</h4>
                    <p className="text-sm text-gray-600">
                      På ordrer over 500 kr. til hele Danmark
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Kvalitetsgaranti</h4>
                    <p className="text-sm text-gray-600">
                      Friske råvarer direkte fra producenten
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Related Products Section */}
          {relatedProducts.length > 0 && (
          <div className="border-t border-gray-200 pt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Star className="h-6 w-6 mr-2 text-brand-primary" />
                Relaterede produkter
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                  <ProductCard 
                    key={relatedProduct._id}
                    id={relatedProduct._id}
                    name={relatedProduct.produktnavn}
                    image={relatedProduct.billeder?.find(img => img.isPrimary)?.url || relatedProduct.billeder?.[0]?.url || ''}
                    category={relatedProduct.kategori.navn}
                    isLoggedIn={isAuthenticated}
                    userType={isAuthenticated ? 'customer' : 'public'}
                    price={!isAuthenticated ? undefined : relatedProduct.basispris}
                    customerPricing={relatedProduct.customerPricing as any}
                  />
              ))}
            </div>
          </div>
          )}

          {/* Image Gallery Dialog */}
          <Dialog open={isImageGalleryOpen} onOpenChange={setIsImageGalleryOpen}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>{product?.produktnavn} - Billeder</DialogTitle>
              </DialogHeader>
              <div className="relative">
                {product?.billeder?.length > 0 && (
                  <>
                    <img
                      src={product.billeder[currentImageIndex]?.url}
                      alt={`${product.produktnavn} billede ${currentImageIndex + 1}`}
                      className="w-full object-contain rounded-lg max-h-[70vh]"
                    />
                    {product.billeder.length > 1 && (
                      <>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute left-2 top-1/2 transform -translate-y-1/2"
                          onClick={prevImage}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2"
                          onClick={nextImage}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                          {currentImageIndex + 1} / {product.billeder.length}
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
