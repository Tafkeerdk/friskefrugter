import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, ShoppingCart, Plus, Minus, Trash2, Package, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { authService, CartItem, Cart as CartType } from '@/lib/auth';
import { useAuth } from '@/hooks/useAuth';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface CartPageState {
  cart: CartType | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
}

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const isMobile = useIsMobile();
  
  const [state, setState] = useState<CartPageState>({
    cart: null,
    isLoading: true,
    isUpdating: false,
    error: null
  });

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated || !user || user.userType !== 'customer') {
      navigate('/login');
      return;
    }
  }, [isAuthenticated, user, navigate]);

  const loadCart = async () => {
    if (!isAuthenticated || !user || user.userType !== 'customer') {
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await authService.getCart();
      
      if (response.success) {
        setState(prev => ({ 
          ...prev, 
          cart: response.cart, 
          isLoading: false,
          error: null
        }));
      } else {
        setState(prev => ({ 
          ...prev, 
          error: 'Kunne ikke indlæse kurv', 
          isLoading: false 
        }));
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Der opstod en fejl ved indlæsning af kurv', 
        isLoading: false 
      }));
    }
  };

  const updateQuantity = async (productId: string, newQuantity: number) => {
    try {
      setState(prev => ({ ...prev, isUpdating: true }));
      
      const response = await authService.updateCartItem(productId, newQuantity);
      
      if (response.success) {
        await loadCart(); // Reload cart with updated pricing
        toast({
          title: "Kurv opdateret",
          description: response.message,
        });
      } else {
        toast({
          title: "Fejl",
          description: response.message || "Kunne ikke opdatere kurv",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to update cart item:', error);
      toast({
        title: "Fejl",
        description: "Der opstod en fejl ved opdatering af kurv",
        variant: "destructive",
      });
    } finally {
      setState(prev => ({ ...prev, isUpdating: false }));
    }
  };

  const removeItem = async (productId: string) => {
    try {
      setState(prev => ({ ...prev, isUpdating: true }));
      
      const response = await authService.removeFromCart(productId);
      
      if (response.success) {
        await loadCart(); // Reload cart
        toast({
          title: "Produkt fjernet",
          description: response.message,
        });
      } else {
        toast({
          title: "Fejl",
          description: response.message || "Kunne ikke fjerne produkt",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to remove cart item:', error);
      toast({
        title: "Fejl",
        description: "Der opstod en fejl ved fjernelse af produkt",
        variant: "destructive",
      });
    } finally {
      setState(prev => ({ ...prev, isUpdating: false }));
    }
  };

  const clearEntireCart = async () => {
    try {
      setState(prev => ({ ...prev, isUpdating: true }));
      
      const response = await authService.clearCart();
      
      if (response.success) {
        await loadCart(); // Reload cart
        toast({
          title: "Kurv tømt",
          description: response.message,
        });
      } else {
        toast({
          title: "Fejl",
          description: response.message || "Kunne ikke tømme kurv",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to clear cart:', error);
      toast({
        title: "Fejl",
        description: "Der opstod en fejl ved tømning af kurv",
        variant: "destructive",
      });
    } finally {
      setState(prev => ({ ...prev, isUpdating: false }));
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const getDiscountBadgeColor = (customerPricing: any): object => {
    if (customerPricing.discountType === 'unique_offer') {
      return { backgroundColor: '#9333EA', color: 'white' }; // Purple for unique offers
    } else if (customerPricing.discountType === 'fast_udsalgspris') {
      return { backgroundColor: '#DC2626', color: 'white' }; // Red for fast sales  
    } else if (customerPricing.discountType === 'rabat_gruppe') {
      return { backgroundColor: customerPricing.groupDetails?.groupColor || '#F59E0B', color: 'white' }; // Group color or fallback
    }
    return { backgroundColor: '#6b7280', color: 'white' };
  };

  const getDiscountTooltipText = (discountType: string): string => {
    switch (discountType) {
      case 'unique_offer':
        return 'Særligt tilbud kun til dig';
      case 'fast_udsalgspris':
        return 'Produkt på tilbud';
      case 'rabat_gruppe':
        return 'Rabatteret pris for din gruppe';
      default:
        return 'Rabat';
    }
  };

  const renderCartItem = (item: CartItem) => {
    const { product, quantity, customerPricing } = item;
    const hasDiscount = customerPricing.showStrikethrough && customerPricing.originalPrice > customerPricing.price;
                        const getUnitDisplay = () => {
      if (product.enhed && typeof product.enhed === 'object') {
        return product.enhed.label || product.enhed.value;
      } else if (typeof product.enhed === 'string') {
        return product.enhed;
      }
      return 'Stykker';
    };

    const getCategoryDisplay = () => {
      if (product.kategori && typeof product.kategori === 'object') {
        return product.kategori.navn || 'KATEGORI';
      } else if (typeof product.kategori === 'string') {
        return product.kategori;
      }
      return 'KATEGORI';
    };

    return (
      <TooltipProvider key={item._id}>
        <Card className="mb-4 overflow-hidden">
          <CardContent className={cn("p-4", isMobile ? "p-3" : "p-6")}>
            <div className={cn("flex gap-4", isMobile ? "flex-col" : "flex-row")}>
              {/* Product Image */}
              <div className="flex-shrink-0">
                <div className="relative">
                  {product.billeder && product.billeder.length > 0 ? (
                    <img
                      src={product.billeder[0].url}
                      alt={product.produktnavn}
                      className={cn(
                        "object-cover rounded-lg border border-gray-200",
                        isMobile ? "w-16 h-16" : "w-24 h-24"
                      )}
                    />
                  ) : (
                    <div className={cn(
                      "bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center",
                      isMobile ? "w-16 h-16" : "w-24 h-24"
                    )}>
                      <Package className={cn("text-gray-400", isMobile ? "w-6 h-6" : "w-8 h-8")} />
                    </div>
                  )}

                  {/* Discount Badge - Same as ProductCard */}
                  {customerPricing.discountType !== 'none' && customerPricing.discountLabel && (
                    <div className="absolute -top-1 -right-1 z-10">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge 
                            className="text-xs font-medium px-2 py-1 cursor-help shadow-lg border-0"
                            style={getDiscountBadgeColor(customerPricing)}
                          >
                            {customerPricing.discountType === 'unique_offer' 
                              ? 'Særlig tilbud'
                              : customerPricing.discountLabel
                            }
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">
                            {getDiscountTooltipText(customerPricing.discountType)}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Details */}
              <div className="flex-1 min-w-0">
                <div className={cn("flex gap-2", isMobile ? "flex-col" : "flex-row justify-between items-start")}>
                  <div className="flex-1 min-w-0">
                    {/* Product Name */}
                    <Link to={`/products/${product._id}`}>
                      <h3 className={cn(
                        "font-bold text-gray-900 hover:text-brand-primary transition-colors cursor-pointer line-clamp-2",
                        isMobile ? "text-sm mb-1" : "text-lg mb-2"
                      )}>
                        {product.produktnavn}
                      </h3>
                    </Link>
                    
                    {/* Product Details */}
                    <div className="space-y-1 mb-3">
                      <p className="text-xs text-gray-500">
                        Varenr: {product.varenummer}
                      </p>
                      
                      {/* Category Badge */}
                      <Badge 
                        variant="secondary" 
                        className="bg-brand-primary/10 text-brand-primary-dark text-xs font-medium px-2 py-1 rounded-full w-fit"
                      >
                        {getCategoryDisplay().toUpperCase()}
                      </Badge>
                    </div>

                    {/* Pricing Display - Same Logic as ProductCard */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {/* Original Price with Strikethrough - Show FIRST like products page */}
                        {hasDiscount && customerPricing.originalPrice && customerPricing.originalPrice > customerPricing.price && (
                          <span className={cn(
                            "text-gray-500 line-through font-medium",
                            isMobile ? "text-sm" : "text-base",
                            customerPricing.discountType === 'unique_offer' ? "text-gray-600" : ""
                          )}>
                            {formatPrice(customerPricing.originalPrice)}
                          </span>
                        )}
                        
                        {/* Current (Discounted) Price */}
                        <span className={cn(
                          "font-bold",
                          customerPricing.discountType === 'unique_offer' 
                            ? "text-purple-600" 
                            : "text-brand-primary-dark",
                          isMobile ? "text-base" : "text-lg"
                        )}>
                          {formatPrice(customerPricing.price)}
                        </span>
                      </div>
                      
                      {/* Unit Information */}
                      <p className="text-xs text-gray-500">
                        per {getUnitDisplay()}
                      </p>
                    </div>
                  </div>

                  {/* Actions - Right Side */}
                  <div className={cn("flex gap-3", isMobile ? "flex-row items-center justify-between" : "flex-col items-end")}>
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1 border">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateQuantity(product._id, Math.max(1, quantity - 1))}
                        disabled={state.isUpdating || quantity <= 1}
                        className="h-8 w-8 p-0 hover:bg-white"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="px-2 py-1 text-sm font-medium min-w-[2rem] text-center">
                        {quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateQuantity(product._id, Math.min(1000, quantity + 1))}
                        disabled={state.isUpdating || quantity >= 1000}
                        className="h-8 w-8 p-0 hover:bg-white"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Item Total and Remove Button */}
                    <div className={cn("text-right", isMobile ? "flex flex-col items-end" : "space-y-2")}>
                      <div className="space-y-1">
                        <div className={cn("font-bold text-gray-900", isMobile ? "text-base" : "text-lg")}>
                          {formatPrice(item.itemTotal)}
                        </div>
                        {item.itemSavings > 0 && (
                          <div className="text-xs text-brand-success font-medium">
                            Besparelse: {formatPrice(item.itemSavings)}
                          </div>
                        )}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(product._id)}
                        disabled={state.isUpdating}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Fjern
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TooltipProvider>
    );
  };

  useEffect(() => {
    loadCart();
  }, []);

  if (state.isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <div className="page-container">
            <div className="content-width">
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-brand-primary" />
                  <p className="text-gray-600">Indlæser kurv...</p>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <div className="page-container">
            <div className="content-width">
              <Alert variant="destructive">
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { cart } = state;
  const isEmpty = !cart || cart.items.length === 0;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <div className="page-container">
          <div className="content-width">
            {/* Header */}
            <div className={cn("flex items-center gap-4 mb-8 py-6", isMobile ? "py-4" : "py-8")}>
              <Button
                variant="ghost"
                onClick={() => navigate('/products')}
                className="p-2 hover:bg-brand-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className={cn("font-bold text-gray-900", isMobile ? "text-2xl" : "text-3xl")}>
                  Din Kurv
                </h1>
                <p className="text-gray-600 mt-1">
                  {isEmpty ? 'Din kurv er tom' : `${cart.totalItems} vare${cart.totalItems !== 1 ? 'r' : ''} i kurven`}
                </p>
              </div>
            </div>

            {isEmpty ? (
              /* Empty Cart */
              <div className="text-center py-16">
                <ShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-6" />
                <h2 className={cn("font-semibold text-gray-900 mb-4", isMobile ? "text-xl" : "text-2xl")}>
                  Din kurv er tom
                </h2>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Tilføj produkter til din kurv for at få vist dem her. Fortsæt med at handle for at finde de produkter, du har brug for.
                </p>
                <Button asChild className="btn-brand-primary">
                  <Link to="/products">
                    Fortsæt med at handle
                  </Link>
                </Button>
              </div>
            ) : (
              /* Cart with Items */
              <div className={cn("grid gap-8", isMobile ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3")}>
                {/* Cart Items */}
                <div className="lg:col-span-2">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className={cn("font-semibold text-gray-900", isMobile ? "text-lg" : "text-xl")}>
                      Kurv indhold
                    </h2>
                    <Button
                      variant="outline"
                      onClick={clearEntireCart}
                      disabled={state.isUpdating}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Tøm kurv
                    </Button>
                  </div>

                  {cart.items.map(renderCartItem)}
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                  <div className="sticky top-8">
                    <Card className="card-brand">
                      <CardHeader>
                        <CardTitle className="text-brand-primary-dark">Kurv sammendrag</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between text-sm">
                          <span>Antal varer:</span>
                          <span className="font-medium">{cart.totalItems}</span>
                        </div>
                        
                        {cart.totalSavings > 0 && (
                          <>
                            <div className="flex justify-between text-sm">
                              <span>Oprindelig pris:</span>
                              <span className="line-through text-gray-500">
                                {formatPrice(cart.totalOriginalPrice)}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm text-brand-success font-medium">
                              <span>Besparelse:</span>
                              <span>-{formatPrice(cart.totalSavings)}</span>
                            </div>
                          </>
                        )}
                        
                        <hr className="my-4" />
                        
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total:</span>
                          <span className="text-brand-primary-dark">{formatPrice(cart.totalPrice)}</span>
                        </div>

                        <Alert className="mt-4 border-brand-gray-200 bg-brand-gray-50">
                          <AlertDescription className="text-sm text-brand-gray-700">
                            Dette er en demo. Bestillingsfunktionalitet er ikke implementeret endnu.
                          </AlertDescription>
                        </Alert>

                        <Button 
                          className="w-full btn-brand-primary mt-4" 
                          disabled
                        >
                          Gå til bestilling (Kommer snart)
                        </Button>

                        <Button 
                          variant="outline" 
                          className="w-full"
                          asChild
                        >
                          <Link to="/products">
                            Fortsæt med at handle
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Cart;
