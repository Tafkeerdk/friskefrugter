import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Eye, 
  Search, 
  Loader2, 
  Package,
  Calendar,
  User,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { authService, CustomerCartSummary, AdminCartResponse, CartItem } from '@/lib/auth';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CartState {
  carts: CustomerCartSummary[];
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

interface DetailState {
  isOpen: boolean;
  customer: any | null;
  cart: any | null;
  isLoading: boolean;
  error: string | null;
}

const DashboardCustomerCarts: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  
  const [state, setState] = useState<CartState>({
    carts: [],
    isLoading: true,
    error: null,
    searchTerm: '',
    currentPage: 1,
    totalPages: 1,
    totalCount: 0
  });

  const [detailState, setDetailState] = useState<DetailState>({
    isOpen: false,
    customer: null,
    cart: null,
    isLoading: false,
    error: null
  });

  // Check admin authentication
  useEffect(() => {
    if (!isAuthenticated || !user || user.userType !== 'admin') {
      navigate('/admin');
      return;
    }
  }, [isAuthenticated, user, navigate]);

  const loadCarts = async (page: number = 1, search: string = '') => {
    if (!isAuthenticated || !user || user.userType !== 'admin') {
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await authService.getCustomerCarts({
        page,
        limit: 20,
        search: search.trim() || undefined
      });
      
      if (response.success && response.carts) {
        setState(prev => ({ 
          ...prev, 
          carts: response.carts || [],
          currentPage: response.pagination?.currentPage || 1,
          totalPages: response.pagination?.totalPages || 1,
          totalCount: response.pagination?.totalCount || 0,
          isLoading: false,
          error: null
        }));
      } else {
        setState(prev => ({ 
          ...prev, 
          error: 'Kunne ikke indlæse kunde kurve', 
          isLoading: false 
        }));
      }
    } catch (error) {
      console.error('Failed to load customer carts:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Der opstod en fejl ved indlæsning af kurve', 
        isLoading: false 
      }));
    }
  };

  const viewCartDetails = async (customerId: string) => {
    try {
      setDetailState({
        isOpen: true,
        customer: null,
        cart: null,
        isLoading: true,
        error: null
      });
      
      const response = await authService.getCustomerCart(customerId);
      
      if (response.success) {
        setDetailState({
          isOpen: true,
          customer: response.customer || null,
          cart: response.cart || null,
          isLoading: false,
          error: null
        });
      } else {
        setDetailState(prev => ({
          ...prev,
          error: 'Kunne ikke indlæse kurv detaljer',
          isLoading: false
        }));
      }
    } catch (error) {
      console.error('Failed to load cart details:', error);
      setDetailState(prev => ({
        ...prev,
        error: 'Der opstod en fejl ved indlæsning af kurv detaljer',
        isLoading: false
      }));
    }
  };

  const handleSearch = (searchTerm: string) => {
    setState(prev => ({ ...prev, searchTerm, currentPage: 1 }));
    loadCarts(1, searchTerm);
  };

  const handlePageChange = (page: number) => {
    setState(prev => ({ ...prev, currentPage: page }));
    loadCarts(page, state.searchTerm);
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('da-DK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const renderCartDetail = (item: CartItem) => {
    const { product, quantity, customerPricing } = item;

    const getUnitDisplay = () => {
      if (product.enhed && typeof product.enhed === 'object') {
        return product.enhed.label || product.enhed.value;
      } else if (typeof product.enhed === 'string') {
        return product.enhed;
      }
      return 'Stykker';
    };

    const getDiscountBadgeStyle = (customerPricing: any): object => {
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

    return (
      <TooltipProvider key={item._id}>
        <div className="border rounded-lg p-4 mb-4">
          <div className="flex gap-4">
            {/* Product Image - IMPROVED PLACEHOLDER LIKE PRODUCTCARD */}
            <div className="flex-shrink-0">
              <div className="relative">
                {product.billeder && product.billeder.length > 0 && product.billeder[0].url ? (
                  <img
                    src={product.billeder[0].url}
                    alt={product.produktnavn}
                    className="w-16 h-16 object-cover rounded-lg border border-gray-200"
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
                  className={`w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex flex-col items-center justify-center ${
                    product.billeder && product.billeder.length > 0 && product.billeder[0].url ? 'absolute inset-0 hidden' : 'flex'
                  }`}
                  style={{ display: product.billeder && product.billeder.length > 0 && product.billeder[0].url ? 'none' : 'flex' }}
                >
                  <Package className="w-3 h-3 text-gray-400 mb-1" />
                  <span className="text-[8px] text-gray-500 text-center px-1 leading-none font-medium">
                    Billede ikke tilgængeligt
                  </span>
                </div>

                {/* Discount Badge - Same as Cart/ProductCard */}
                {customerPricing.discountType !== 'none' && customerPricing.discountLabel && (
                  <div className="absolute -top-1 -right-1 z-10">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge 
                          className="text-xs font-medium px-2 py-1 cursor-help shadow-lg border-0"
                          style={getDiscountBadgeStyle(customerPricing)}
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
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 mb-1 line-clamp-2">
                    {product.produktnavn}
                  </h4>
                  <p className="text-xs text-gray-500 mb-2">
                    Varenr: {product.varenummer}
                  </p>

                  {/* FIXED: Pricing Display - EXACT SAME LOGIC AS CUSTOMER CART */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {/* FIXED: Original Price with Strikethrough - UNIQUE OFFERS ALWAYS SHOW BEFORE PRICE */}
                      {((customerPricing.discountType === 'unique_offer' && customerPricing.originalPrice) || 
                        (customerPricing.showStrikethrough && customerPricing.originalPrice)) && (
                        <span className="text-sm text-gray-500 line-through font-medium">
                          {formatPrice(customerPricing.originalPrice)}
                        </span>
                      )}
                      
                      {/* Current (Discounted) Price */}
                      <span className={`font-bold text-base ${
                        customerPricing.discountType === 'unique_offer' 
                          ? 'text-purple-600' 
                          : 'text-brand-primary-dark'
                      }`}>
                        {formatPrice(customerPricing.price)}
                      </span>
                    </div>
                    
                    {/* Unit Information */}
                    <p className="text-xs text-gray-500">
                      per {getUnitDisplay()}
                    </p>
                  </div>
                </div>

                {/* Quantity and Total */}
                <div className="text-right ml-4">
                  <div className="text-sm text-gray-500 mb-1">
                    Antal: {quantity}
                  </div>
                  <div className="font-bold text-gray-900 text-base">
                    {formatPrice(item.itemTotal)}
                  </div>
                  {item.itemSavings > 0 && (
                    <div className="text-sm text-brand-success font-medium">
                      Besparelse: {formatPrice(item.itemSavings)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </TooltipProvider>
    );
  };

  useEffect(() => {
    loadCarts();
  }, []);

  if (state.isLoading && state.carts.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-green-600" />
            <p className="text-gray-600">Indlæser kunde kurve...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="dashboard-page-container">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Kunde Kurve</h1>
        <p className="text-gray-600">
          Oversigt over alle kunde kurve med produkter
        </p>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Søg efter firmanavn, kontaktperson eller email..."
                value={state.searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {state.error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Results Summary */}
      {!state.isLoading && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Viser {state.carts.length} af {state.totalCount} kurve
            {state.searchTerm && ` for "${state.searchTerm}"`}
          </p>
        </div>
      )}

      {/* Carts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Aktive Kurve
          </CardTitle>
        </CardHeader>
        <CardContent>
          {state.carts.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Ingen kurve fundet
              </h3>
              <p className="text-gray-600">
                {state.searchTerm ? 
                  'Ingen kurve matcher din søgning.' : 
                  'Der er ingen aktive kurve i øjeblikket.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kunde</TableHead>
                    <TableHead>Firmanavn</TableHead>
                    <TableHead>Rabat Gruppe</TableHead>
                    <TableHead className="text-center">Antal Varer</TableHead>
                    <TableHead>Sidst Opdateret</TableHead>
                    <TableHead className="w-[100px]">Handlinger</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.carts.map((cart) => (
                    <TableRow key={cart.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900">
                              {cart.customer.contactPersonName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {cart.customer.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {cart.customer.companyName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {cart.customer.discountGroup?.name || 'Standard'} 
                          {cart.customer.discountGroup?.discountPercentage ? 
                            ` (${cart.customer.discountGroup.discountPercentage}%)` : 
                            ' (0%)'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {cart.totalItems}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {formatDate(cart.updatedAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewCartDetails(cart.customer.id)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          Se kurv
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {state.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => handlePageChange(state.currentPage - 1)}
            disabled={state.currentPage <= 1 || state.isLoading}
          >
            Forrige
          </Button>
          <span className="flex items-center px-4 text-sm text-gray-600">
            Side {state.currentPage} af {state.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => handlePageChange(state.currentPage + 1)}
            disabled={state.currentPage >= state.totalPages || state.isLoading}
          >
            Næste
          </Button>
        </div>
      )}

      {/* Cart Detail Dialog */}
      <Dialog open={detailState.isOpen} onOpenChange={(open) => 
        setDetailState(prev => ({ ...prev, isOpen: open }))
      }>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              {detailState.customer ? 
                `${detailState.customer.companyName} - Kurv` : 
                'Kurv Detaljer'}
            </DialogTitle>
          </DialogHeader>

          {detailState.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          ) : detailState.error ? (
            <Alert variant="destructive">
              <AlertDescription>{detailState.error}</AlertDescription>
            </Alert>
          ) : detailState.customer && detailState.cart ? (
            <div className="space-y-6">
              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Kunde Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-900">Firmanavn:</span>
                      <p>{detailState.customer.companyName}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Kontaktperson:</span>
                      <p>{detailState.customer.contactPersonName}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Email:</span>
                      <p>{detailState.customer.email}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Rabat Gruppe:</span>
                      <p>{detailState.customer.discountGroup?.name || 'Standard'} 
                         ({detailState.customer.discountGroup?.discountPercentage || 0}%)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cart Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Kurv Sammendrag</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-900">Antal varer:</span>
                      <p>{detailState.cart.totalItems}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Total pris:</span>
                      <p className="font-semibold">{formatPrice(detailState.cart.totalPrice)}</p>
                    </div>
                    {detailState.cart.totalSavings > 0 && (
                      <>
                        <div>
                          <span className="font-medium text-gray-900">Oprindelig pris:</span>
                          <p className="line-through text-gray-500">
                            {formatPrice(detailState.cart.totalOriginalPrice)}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">Besparelse:</span>
                          <p className="text-green-600 font-semibold">
                            {formatPrice(detailState.cart.totalSavings)}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Cart Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Kurv Indhold</CardTitle>
                </CardHeader>
                <CardContent>
                  {detailState.cart.items.length === 0 ? (
                    <p className="text-gray-600 py-4">Kurven er tom</p>
                  ) : (
                    <div>
                      {detailState.cart.items.map(renderCartDetail)}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <p className="text-gray-600 py-4">Ingen kurv data tilgængelig</p>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default DashboardCustomerCarts; 