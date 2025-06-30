import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { authService } from '@/lib/auth';
import { useAuth } from '@/hooks/useAuth';

interface CartItem {
  _id: string;
  product: {
    _id: string;
    produktnavn: string;
    varenummer: string;
    basispris: number;
    billeder: any[];
    enhed: any;
    kategori: any;
  };
  quantity: number;
  customerPricing: {
    price: number;
    originalPrice: number;
    discountType: string;
    discountLabel: string | null;
    discountPercentage: number;
    showStrikethrough: boolean;
    offerDetails?: any;
    saleDetails?: any;
    groupDetails?: any;
  };
  itemTotal: number;
  itemOriginalTotal: number;
  itemSavings: number;
  addedAt: string;
  updatedAt: string;
}

interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  totalOriginalPrice: number;
  totalSavings: number;
  updatedAt?: string;
}

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
  refreshCart: () => Promise<void>;
  addToCart: (productId: string, quantity: number) => Promise<boolean>;
  updateCartItem: (productId: string, quantity: number) => Promise<boolean>;
  removeFromCart: (productId: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isCustomerAuthenticated, customerUser } = useAuth();

  const refreshCart = useCallback(async () => {
    if (!isCustomerAuthenticated || !customerUser) {
      setCart(null);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const response = await authService.getCart();
      
      if (response.success) {
        setCart(response.cart);
      } else {
        setError('Kunne ikke indlæse kurv');
        setCart(null);
      }
    } catch (error) {
      console.error('Cart refresh error:', error);
      setError('Der opstod en fejl ved indlæsning af kurv');
      setCart(null);
    } finally {
      setIsLoading(false);
    }
  }, [isCustomerAuthenticated, customerUser]);

  const addToCart = useCallback(async (productId: string, quantity: number): Promise<boolean> => {
    try {
      const response = await authService.addToCart(productId, quantity);
      
      if (response.success) {
        await refreshCart(); // Refresh cart after successful addition
        return true;
      } else {
        setError(response.message);
        return false;
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      setError('Kunne ikke tilføje til kurv');
      return false;
    }
  }, [refreshCart]);

  const updateCartItem = useCallback(async (productId: string, quantity: number): Promise<boolean> => {
    try {
      const response = await authService.updateCartItem(productId, quantity);
      
      if (response.success) {
        await refreshCart(); // Refresh cart after successful update
        return true;
      } else {
        setError(response.message);
        return false;
      }
    } catch (error) {
      console.error('Update cart item error:', error);
      setError('Kunne ikke opdatere kurv');
      return false;
    }
  }, [refreshCart]);

  const removeFromCart = useCallback(async (productId: string): Promise<boolean> => {
    try {
      const response = await authService.removeFromCart(productId);
      
      if (response.success) {
        await refreshCart(); // Refresh cart after successful removal
        return true;
      } else {
        setError(response.message);
        return false;
      }
    } catch (error) {
      console.error('Remove from cart error:', error);
      setError('Kunne ikke fjerne fra kurv');
      return false;
    }
  }, [refreshCart]);

  const clearCart = useCallback(async (): Promise<boolean> => {
    try {
      const response = await authService.clearCart();
      
      if (response.success) {
        await refreshCart(); // Refresh cart after successful clearing
        return true;
      } else {
        setError(response.message);
        return false;
      }
    } catch (error) {
      console.error('Clear cart error:', error);
      setError('Kunne ikke tømme kurv');
      return false;
    }
  }, [refreshCart]);

  // Load cart on mount and when authentication changes
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const value: CartContextType = {
    cart,
    isLoading,
    error,
    refreshCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 