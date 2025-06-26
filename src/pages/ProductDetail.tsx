import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
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
  Package
} from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductPricing } from "@/components/products/card/ProductPricing";
import { useAuth } from "@/hooks/useAuth";
import { api, handleApiError } from "@/lib/api";
import { CustomerPricing } from "@/components/products/card/ProductPricing";

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
  const { toast } = useToast();
  
  // State management
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Load product data
  useEffect(() => {
    if (id) {
      loadProductData();
    }
  }, [id, isAuthenticated]);

     const loadProductData = async () => {
     if (!id) return;
     
     try {
       setIsLoading(true);
       setError(null);
       
       // Get the single product using the existing product endpoint
       const singleProductResponse = await api.getProduct(id);
       if (singleProductResponse.success && singleProductResponse.data) {
         const productData = singleProductResponse.data as Product;
         
         if (!isAuthenticated) {
           // For public users, create mock customer pricing with no discount
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
         } else {
           // For authenticated users, create proper customer pricing
           // TODO: This should come from the backend with actual customer-specific pricing
           const customerProductData = {
             ...productData,
             customerPricing: {
               price: productData.basispris,
               originalPrice: productData.basispris,
               discountType: 'none' as const,
               discountLabel: null,
               discountPercentage: 0,
               showStrikethrough: false
             }
           };
           setProduct(customerProductData);
         }
         
         // Load related products from same category
         if (productData.kategori?._id) {
           loadRelatedProducts(productData.kategori._id);
         }
       } else {
         setError('Produktet blev ikke fundet');
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
        ? await api.getCustomerProducts({ kategori: categoryId, limit: 4 })
        : await api.getPublicProducts({ kategori: categoryId, limit: 4 });
      
             if (response.success && response.data && (response.data as any).products) {
         // Filter out current product
         const filtered = (response.data as any).products.filter((p: Product) => p._id !== id);
         setRelatedProducts(filtered.slice(0, 3));
       }
    } catch (error) {
      console.warn('Could not load related products:', error);
    }
  };

  const increaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decreaseQuantity = () => {
    setQuantity(prev => (prev > 1 ? prev - 1 : 1));
  };

  const handleAddToCart = async () => {
    if (!product || !isAuthenticated) return;
    
    setIsAddingToCart(true);
    try {
      // TODO: Implement add to cart functionality
      // await api.addToCart(product._id, quantity);
      
      toast({
        title: 'Tilføjet til kurv',
        description: `${quantity} x ${product.produktnavn} er tilføjet til din kurv`,
        duration: 3000,
      });
    } catch (error) {
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
            {/* Product Image */}
            <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
              {getPrimaryImage() ? (
                <img 
                  src={getPrimaryImage()} 
                  alt={product.produktnavn} 
                  className="w-full h-auto object-cover"
                />
              ) : (
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  <Package className="h-24 w-24 text-gray-400" />
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
              
              {/* Pricing Section */}
              {isAuthenticated ? (
                <div className="mb-6">
                                     {product.customerPricing ? (
                     <ProductPricing
                       customerPricing={product.customerPricing}
                       position="detail"
                     />
                   ) : (
                     <div className="text-2xl font-bold text-gray-900">
                       {new Intl.NumberFormat('da-DK', {
                         style: 'currency',
                         currency: 'DKK',
                         minimumFractionDigits: 2
                       }).format(product.basispris)}
                     </div>
                   )}
                  <p className="text-sm text-gray-500 mt-1">Per {getUnitDisplay()}</p>
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
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center border border-gray-300 rounded-md">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 rounded-none" 
                        onClick={decreaseQuantity}
                        disabled={isAddingToCart}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-10 text-center font-medium">{quantity}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 rounded-none" 
                        onClick={increaseQuantity}
                        disabled={isAddingToCart}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <Button 
                      className="btn-brand-primary flex-1" 
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
                          <ShoppingCart className="h-5 w-5 mr-2" />
                          Tilføj til kurv
                        </>
                      )}
                    </Button>
                  </div>

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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
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
                    customerPricing={relatedProduct.customerPricing}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
