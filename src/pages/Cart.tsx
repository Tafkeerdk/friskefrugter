import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, ShoppingCart, Plus, Minus, Trash2, Package, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CartItem, Cart as CartType, authService, PlaceOrderRequest } from '@/lib/auth';
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
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

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

  const placeOrder = async () => {
    try {
      setIsPlacingOrder(true);

      // Prepare order data
      const orderData: PlaceOrderRequest = {
        orderNotes: orderNotes.trim() || undefined,
        deliveryInstructions: deliveryInstructions.trim() || undefined
      };

      // Place the order
      const result = await authService.placeOrder(orderData);

      if (result.success) {
        toast({
          title: "Ordre afgivet!",
          description: `Din ordre ${result.order.orderNumber} er blevet afgivet. Du vil modtage en bekræftelse på email.`,
          duration: 5000,
        });

        // Navigate to order confirmation or orders page
        navigate('/orders');
      } else {
        toast({
          title: "Fejl ved bestilling",
          description: result.message || "Der opstod en fejl ved afgivelse af ordren",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to place order:', error);
      toast({
        title: "Fejl ved bestilling",
        description: "Der opstod en uventet fejl. Prøv venligst igen.",
        variant: "destructive",
      });
    } finally {
      setIsPlacingOrder(false);
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
        <Card className="mb-6 overflow-hidden shadow-sm border-gray-200">
          <CardContent className={cn("p-6", isMobile ? "p-4" : "p-8")}>
            <div className={cn("flex gap-6", isMobile ? "flex-col gap-4" : "flex-row")}>
              {/* Product Image - CLEAN LAYOUT WITHOUT OVERLAPPING BADGE */}
              <div className="flex-shrink-0">
                <div className={cn(
                  "bg-gray-100 rounded-lg border border-gray-200 flex flex-col items-center justify-center",
                  isMobile ? "w-20 h-20" : "w-28 h-28"
                )}>
                  {product.billeder && product.billeder.length > 0 && product.billeder[0].url ? (
                    <img
                      src={product.billeder[0].url}
                      alt={product.produktnavn}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        // If image fails to load, show placeholder
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const container = target.parentElement;
                        if (container) {
                          container.innerHTML = `
                            <div class="w-full h-full flex flex-col items-center justify-center">
                              <svg class="w-6 h-6 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                              </svg>
                              <span class="text-xs text-gray-500 text-center font-medium leading-tight">Billede ikke tilgængeligt</span>
                            </div>
                          `;
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-2">
                      <Package className={cn("text-gray-400 mb-2", isMobile ? "w-5 h-5" : "w-6 h-6")} />
                      <span className={cn(
                        "text-gray-500 text-center leading-tight font-medium",
                        isMobile ? "text-xs" : "text-sm"
                      )}>
                        Billede ikke tilgængeligt
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Product Details */}
              <div className="flex-1 min-w-0">
                <div className={cn("flex gap-2", isMobile ? "flex-col" : "flex-row justify-between items-start")}>
                  <div className="flex-1 min-w-0">
                    {/* Product Name with Discount Badge */}
                    <div className="flex items-start gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <Link to={`/products/${product._id}`}>
                          <h3 className={cn(
                            "font-bold text-gray-900 hover:text-brand-primary transition-colors cursor-pointer line-clamp-2",
                            isMobile ? "text-sm" : "text-lg"
                          )}>
                            {product.produktnavn}
                          </h3>
                        </Link>
                      </div>
                      
                      {/* Discount Badge - MOVED TO SIDE OF PRODUCT NAME */}
                      {customerPricing.discountType !== 'none' && customerPricing.discountLabel && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge 
                              className="text-xs font-medium px-2 py-1 cursor-help shadow-sm border-0 flex-shrink-0"
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
                      )}
                    </div>
                    
                    {/* Product Details */}
                    <div className="space-y-2 mb-4">
                      <p className="text-xs text-gray-500">
                        Varenr: {product.varenummer}
                      </p>
                      
                      {/* Category Badge */}
                      <div className="flex gap-2">
                        <Badge 
                          variant="secondary" 
                          className="bg-brand-primary/10 text-brand-primary-dark text-xs font-medium px-2 py-1 rounded-full w-fit"
                        >
                          {getCategoryDisplay().toUpperCase()}
                        </Badge>
                      </div>
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
                  <div className={cn("flex", isMobile ? "flex-col gap-4" : "flex-col items-end gap-4")}>
                    {/* Quantity Controls - WITH INPUT FIELD */}
                    <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 border border-gray-200">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateQuantity(product._id, Math.max(1, quantity - 1))}
                        disabled={isUpdating || quantity <= 1}
                        className="h-10 w-10 p-0 hover:bg-white rounded-md"
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
                        className="h-10 w-16 text-center text-sm font-medium border-0 bg-white rounded-md shadow-sm focus:ring-2 focus:ring-brand-primary/20"
                      />
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateQuantity(product._id, Math.min(1000, quantity + 1))}
                        disabled={isUpdating || quantity >= 1000}
                        className="h-10 w-10 p-0 hover:bg-white rounded-md"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Item Total and Remove Button */}
                    <div className={cn("text-right", isMobile ? "flex flex-col items-center" : "flex flex-col items-end")}>
                      <div className="space-y-2 mb-3">
                        <div className={cn("font-bold text-gray-900", isMobile ? "text-lg" : "text-xl")}>
                          {formatPrice(item.itemTotal)}
                        </div>
                        {item.itemSavings > 0 && (
                          <div className="text-sm text-brand-success font-medium">
                            Besparelse: {formatPrice(item.itemSavings)}
                          </div>
                        )}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(product._id)}
                        disabled={isUpdating}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 px-4 py-2"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
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

                        {/* Order Notes */}
                        <div className="space-y-3 mt-4">
                          <div>
                            <Label htmlFor="orderNotes" className="text-sm font-medium text-gray-700">
                              Bemærkninger til ordren (valgfrit)
                            </Label>
                            <Textarea
                              id="orderNotes"
                              placeholder="Særlige ønsker eller bemærkninger til din ordre..."
                              value={orderNotes}
                              onChange={(e) => setOrderNotes(e.target.value)}
                              className="mt-1 resize-none"
                              rows={3}
                              maxLength={500}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              {orderNotes.length}/500 tegn
                            </p>
                          </div>

                          <div>
                            <Label htmlFor="deliveryInstructions" className="text-sm font-medium text-gray-700">
                              Leveringsinstruktioner (valgfrit)
                            </Label>
                            <Textarea
                              id="deliveryInstructions"
                              placeholder="Specielle instruktioner for levering..."
                              value={deliveryInstructions}
                              onChange={(e) => setDeliveryInstructions(e.target.value)}
                              className="mt-1 resize-none"
                              rows={2}
                              maxLength={300}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              {deliveryInstructions.length}/300 tegn
                            </p>
                          </div>
                        </div>

                        <Button 
                          className="w-full btn-brand-primary mt-6" 
                          onClick={placeOrder}
                          disabled={isPlacingOrder || isUpdating}
                        >
                          {isPlacingOrder ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Afgiver ordre...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Afgiv ordre
                            </>
                          )}
                        </Button>

                        <Button 
                          variant="outline" 
                          className="w-full mt-3"
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
