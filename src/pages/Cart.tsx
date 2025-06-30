import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, ShoppingCart, Plus, Minus, Trash2, Package, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { authService, CartItem, Cart as CartType } from '@/lib/auth';
import { useAuth } from '@/hooks/useAuth';

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

  const getDiscountBadgeColor = (discountType: string): string => {
    switch (discountType) {
      case 'unique_offer':
        return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white';
      case 'fast_udsalgspris':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white';
      case 'rabat_gruppe':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderCartItem = (item: CartItem) => {
    const { product, quantity, customerPricing } = item;
    const hasDiscount = customerPricing.showStrikethrough && customerPricing.originalPrice > customerPricing.price;

    return (
      <Card key={item._id} className="mb-4">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Product Image */}
            <div className="flex-shrink-0">
              {product.billeder && product.billeder.length > 0 ? (
                <img
                  src={product.billeder[0].url}
                  alt={product.produktnavn}
                  className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-lg border"
                />
              ) : (
                <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-100 rounded-lg border flex items-center justify-center">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900 mb-1">
                    {product.produktnavn}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">
                    Varenr: {product.varenummer}
                  </p>
                  
                  {/* Discount Badge */}
                  {hasDiscount && (
                    <Badge className={`${getDiscountBadgeColor(customerPricing.discountType)} mb-2`}>
                      {customerPricing.discountLabel} ({customerPricing.discountPercentage}% rabat)
                    </Badge>
                  )}

                  {/* Pricing */}
                  <div className="flex items-center gap-2 mb-3">
                    {hasDiscount && (
                      <span className="text-sm text-gray-500 line-through">
                        {formatPrice(customerPricing.originalPrice)}
                      </span>
                    )}
                    <span className="text-lg font-bold text-gray-900">
                      {formatPrice(customerPricing.price)}
                    </span>
                    {product.enhed && (
                      <span className="text-sm text-gray-500">
                        / {product.enhed.label || product.enhed.value}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end gap-3">
                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateQuantity(product._id, Math.max(1, quantity - 1))}
                      disabled={state.isUpdating || quantity <= 1}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="px-3 py-1 text-sm font-medium min-w-[3rem] text-center">
                      {quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateQuantity(product._id, Math.min(1000, quantity + 1))}
                      disabled={state.isUpdating || quantity >= 1000}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Remove Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeItem(product._id)}
                    disabled={state.isUpdating}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Fjern
                  </Button>

                  {/* Item Total */}
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {formatPrice(item.itemTotal)}
                    </div>
                    {item.itemSavings > 0 && (
                      <div className="text-sm text-green-600">
                        Besparelse: {formatPrice(item.itemSavings)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  useEffect(() => {
    loadCart();
  }, []);

  if (state.isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-green-600" />
            <p className="text-gray-600">Indlæser kurv...</p>
          </div>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const { cart } = state;
  const isEmpty = !cart || cart.items.length === 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/products')}
          className="p-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Din Kurv</h1>
          <p className="text-gray-600 mt-1">
            {isEmpty ? 'Din kurv er tom' : `${cart.totalItems} vare${cart.totalItems !== 1 ? 'r' : ''} i kurven`}
          </p>
        </div>
      </div>

      {isEmpty ? (
        /* Empty Cart */
        <div className="text-center py-16">
          <ShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Din kurv er tom
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Tilføj produkter til din kurv for at få vist dem her. Fortsæt med at handle for at finde de produkter, du har brug for.
          </p>
          <Button asChild className="bg-green-600 hover:bg-green-700">
            <Link to="/products">
              Fortsæt med at handle
            </Link>
          </Button>
        </div>
      ) : (
        /* Cart with Items */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Kurv indhold
              </h2>
              <Button
                variant="outline"
                onClick={clearEntireCart}
                disabled={state.isUpdating}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
              <Card>
                <CardHeader>
                  <CardTitle>Kurv sammendrag</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Antal varer:</span>
                    <span>{cart.totalItems}</span>
                  </div>
                  
                  {cart.totalSavings > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span>Oprindelig pris:</span>
                        <span className="line-through text-gray-500">
                          {formatPrice(cart.totalOriginalPrice)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Besparelse:</span>
                        <span>-{formatPrice(cart.totalSavings)}</span>
                      </div>
                    </>
                  )}
                  
                  <hr className="my-4" />
                  
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>{formatPrice(cart.totalPrice)}</span>
                  </div>

                  <Alert className="mt-4">
                    <AlertDescription className="text-sm">
                      Dette er en demo. Bestillingsfunktionalitet er ikke implementeret endnu.
                    </AlertDescription>
                  </Alert>

                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 mt-4" 
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
  );
};

export default Cart;
