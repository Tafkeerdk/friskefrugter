import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, ShoppingCart, Plus, Minus, Trash2, Package, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { CartItem, Cart as CartType } from '@/lib/auth';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { cart, isLoading, error, updateCartItem, removeFromCart, clearCart } = useCart();
  const isMobile = useIsMobile();
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [quantityInputs, setQuantityInputs] = useState<Record<string, string>>({});

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated || !user || user.userType !== 'customer') {
      navigate('/login');
      return;
    }
  }, [isAuthenticated, user, navigate]);

  // Initialize quantity inputs when cart loads
  useEffect(() => {
    if (cart?.items) {
      const initialInputs: Record<string, string> = {};
      cart.items.forEach(item => {
        initialInputs[item.product._id] = item.quantity.toString();
      });
      setQuantityInputs(initialInputs);
    }
  }, [cart?.items]);

  const updateQuantity = async (productId: string, newQuantity: number) => {
    try {
      setIsUpdating(true);
      
      const success = await updateCartItem(productId, newQuantity);
      
      if (success) {
        toast({
          title: "Kurv opdateret",
          description: newQuantity > 0 ? "Antal opdateret" : "Produkt fjernet fra kurv",
        });
        // Update the input field to reflect the new quantity
        setQuantityInputs(prev => ({
          ...prev,
          [productId]: newQuantity.toString()
        }));
      } else {
        toast({
          title: "Fejl",
          description: "Kunne ikke opdatere kurv",
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
      setIsUpdating(false);
    }
  };

  const handleQuantityInputChange = (productId: string, value: string) => {
    // Allow only numbers and empty string (for clearing)
    if (value === '' || (/^\d+$/.test(value) && parseInt(value) <= 1000)) {
      setQuantityInputs(prev => ({
        ...prev,
        [productId]: value
      }));
    }
  };

  const handleQuantityInputBlur = (productId: string) => {
    const inputValue = quantityInputs[productId];
    const newQuantity = parseInt(inputValue) || 1;
    const clampedQuantity = Math.max(1, Math.min(1000, newQuantity));
    
    // Update the input to show the clamped value
    setQuantityInputs(prev => ({
      ...prev,
      [productId]: clampedQuantity.toString()
    }));
    
    // Only update if quantity actually changed
    const currentQuantity = cart?.items.find(item => item.product._id === productId)?.quantity || 1;
    if (clampedQuantity !== currentQuantity) {
      updateQuantity(productId, clampedQuantity);
    }
  };

  const handleQuantityInputEnter = (productId: string, event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleQuantityInputBlur(productId);
    }
  };

  const removeItem = async (productId: string) => {
    try {
      setIsUpdating(true);
      
      const success = await removeFromCart(productId);
      
      if (success) {
        toast({
          title: "Produkt fjernet",
          description: "Produktet er fjernet fra kurven",
        });
      } else {
        toast({
          title: "Fejl",
          description: "Kunne ikke fjerne produkt",
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
      setIsUpdating(false);
    }
  };

  const clearEntireCart = async () => {
    try {
      setIsUpdating(true);
      
      const success = await clearCart();
      
      if (success) {
        toast({
          title: "Kurv tømt",
          description: "Alle produkter er fjernet fra kurven",
        });
      } else {
        toast({
          title: "Fejl",
          description: "Kunne ikke tømme kurv",
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
      setIsUpdating(false);
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
              {/* Product Image - IMPROVED PLACEHOLDER LIKE PRODUCTCARD */}
              <div className="flex-shrink-0">
                <div className="relative">
                  {product.billeder && product.billeder.length > 0 && product.billeder[0].url ? (
                    <img
                      src={product.billeder[0].url}
                      alt={product.produktnavn}
                      className={cn(
                        "object-cover rounded-lg border border-gray-200",
                        isMobile ? "w-16 h-16" : "w-24 h-24"
                      )}
                      onError={(e) => {
                        // If image fails to load, replace with placeholder
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const placeholder = target.nextElementSibling as HTMLElement;
                        if (placeholder) placeholder.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  
                  {/* Placeholder - Always present as fallback */}
                  <div 
                    className={cn(
                      "bg-gray-100 rounded-lg border border-gray-200 flex flex-col items-center justify-center",
                      isMobile ? "w-16 h-16" : "w-24 h-24",
                      product.billeder && product.billeder.length > 0 && product.billeder[0].url ? "absolute inset-0 hidden" : "flex"
                    )}
                    style={{ display: product.billeder && product.billeder.length > 0 && product.billeder[0].url ? 'none' : 'flex' }}
                  >
                    <Package className={cn("text-gray-400", isMobile ? "w-3 h-3 mb-1" : "w-4 h-4 mb-1")} />
                    <span className={cn(
                      "text-gray-500 text-center leading-none font-medium",
                      isMobile ? "text-[8px] px-1" : "text-[10px] px-1"
                    )}>
                      Billede ikke tilgængeligt
                    </span>
                  </div>

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

                    {/* Pricing Display - FIXED TO MATCH PRODUCTCARD EXACTLY */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {/* FIXED: Original Price with Strikethrough - UNIQUE OFFERS ALWAYS SHOW BEFORE PRICE */}
                        {((customerPricing.discountType === 'unique_offer' && customerPricing.originalPrice) || 
                          (customerPricing.showStrikethrough && customerPricing.originalPrice)) && (
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
                    {/* Quantity Controls - WITH INPUT FIELD */}
                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1 border">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateQuantity(product._id, Math.max(1, quantity - 1))}
                        disabled={isUpdating || quantity <= 1}
                        className="h-8 w-8 p-0 hover:bg-white"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      
                      {/* ADDED: Input field for quantity */}
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={quantityInputs[product._id] || quantity.toString()}
                        onChange={(e) => handleQuantityInputChange(product._id, e.target.value)}
                        onBlur={() => handleQuantityInputBlur(product._id)}
                        onKeyDown={(e) => handleQuantityInputEnter(product._id, e)}
                        disabled={isUpdating}
                        className="h-8 w-12 text-center text-sm font-medium border-0 bg-transparent p-0 focus:ring-1 focus:ring-brand-primary"
                      />
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateQuantity(product._id, Math.min(1000, quantity + 1))}
                        disabled={isUpdating || quantity >= 1000}
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
                        disabled={isUpdating}
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

  if (isLoading) {
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

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <div className="page-container">
            <div className="content-width">
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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
                      disabled={isUpdating}
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
