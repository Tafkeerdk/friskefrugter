import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Package, User, Calendar, MapPin, DollarSign, FileText, Clock, AlertTriangle, CheckCircle, Truck, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { authService, type Order } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { Navbar, Footer } from '@/components/layout';

const STATUS_LABELS = {
  'order_placed': 'Ordre afgivet',
  'order_confirmed': 'Bekræftet',
  'in_transit': 'Pakket',
  'delivered': 'Leveret',
  'invoiced': 'Faktureret',
  'rejected': 'Afvist'
} as const;

const STATUS_COLORS = {
  'order_placed': 'bg-gray-100 text-gray-800',
  'order_confirmed': 'bg-blue-100 text-blue-800',
  'in_transit': 'bg-yellow-100 text-yellow-800',
  'delivered': 'bg-green-100 text-green-800',
  'invoiced': 'bg-purple-100 text-purple-800',
  'rejected': 'bg-red-100 text-red-800'
} as const;

const AdminOrderDetail: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdminAuthenticated } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdminAuthenticated) {
      navigate('/admin/login');
      return;
    }

    if (!orderId) {
      setError('Ordre ID mangler');
      setIsLoading(false);
      return;
    }

    loadOrderDetails();
  }, [orderId, isAdminAuthenticated, navigate]);

  const loadOrderDetails = async () => {
    if (!orderId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await authService.getOrder(orderId);
      
      if (response.success && response.order) {
        setOrder(response.order);
      } else {
        setError(response.message || 'Ordre ikke fundet');
      }
    } catch (error: any) {
      console.error('❌ Error loading order details:', error);
      setError(error.message || 'Fejl ved indlæsning af ordre');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK'
    }).format(price);
  };

  const formatDate = (date: string | Date): string => {
    return new Intl.DateTimeFormat('da-DK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header Skeleton */}
            <div className="flex items-center gap-4 mb-6">
              <Skeleton className="h-10 w-10" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>

            {/* Content Skeletons */}
            <div className="grid gap-6 md:grid-cols-2">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin/orders')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Tilbage til ordrer
              </Button>
            </div>

            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {error || 'Ordre ikke fundet'}
              </AlertDescription>
            </Alert>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin/orders')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Tilbage til ordrer
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Ordre {order.orderNumber}
                </h1>
                <p className="text-sm text-gray-600">
                  Afgivet {formatDate(order.placedAt)}
                </p>
              </div>
            </div>
            <Badge 
              className={cn(
                "text-sm font-medium",
                STATUS_COLORS[order.status as keyof typeof STATUS_COLORS] || STATUS_COLORS['order_placed']
              )}
            >
              {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS] || order.status}
            </Badge>
          </div>

          {/* Order Summary */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatPrice(order.orderTotals.totalAmount)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Antal varer</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {order.orderTotals.totalItems}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Besparelse</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatPrice(order.orderTotals.totalSavings)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Faktura</p>
                    <p className="text-lg font-bold text-gray-900">
                      {order.invoice.isInvoiced ? (
                        <span className="text-green-600">✓ Sendt</span>
                      ) : (
                        <span className="text-gray-500">Ikke sendt</span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Order Items & Customer */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Ordre varer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                        {item.product.billeder && item.product.billeder.length > 0 && (
                          <img
                            src={item.product.billeder[0].url}
                            alt={item.product.produktnavn}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {item.product.produktnavn}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Varenr: {item.product.varenummer}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-sm text-gray-600">
                              Antal: {item.quantity}
                            </span>
                            <span className="text-sm font-medium">
                              {formatPrice(item.staticPricing.price)} stk.
                            </span>
                            {item.staticPricing.discountPercentage > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                -{item.staticPricing.discountPercentage}%
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            {formatPrice(item.itemTotal)}
                          </p>
                          {item.itemSavings > 0 && (
                            <p className="text-sm text-green-600">
                              Besparelse: {formatPrice(item.itemSavings)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  {/* Order Totals */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>{formatPrice(order.orderTotals.subtotal)}</span>
                    </div>
                    {order.orderTotals.totalSavings > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Total besparelse:</span>
                        <span>-{formatPrice(order.orderTotals.totalSavings)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>{formatPrice(order.orderTotals.totalAmount)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Kunde information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {order.customerSnapshot.companyName}
                      </h4>
                      <p className="text-gray-600">
                        {order.customerSnapshot.contactPersonName}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {order.customerSnapshot.email}
                      </p>
                      {order.customerSnapshot.phone && (
                        <p className="text-sm text-gray-600">
                          {order.customerSnapshot.phone}
                        </p>
                      )}
                    </div>
                    <div>
                      {order.customerSnapshot.cvrNumber && (
                        <p className="text-sm text-gray-600">
                          CVR: {order.customerSnapshot.cvrNumber}
                        </p>
                      )}
                      {order.customerSnapshot.discountGroup && (
                        <Badge variant="outline" className="mt-2">
                          {order.customerSnapshot.discountGroup.name} 
                          ({order.customerSnapshot.discountGroup.discountPercentage}%)
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Status & Delivery */}
            <div className="space-y-6">
              {/* Status History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Status historik
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.statusHistory && order.statusHistory.length > 0 ? (
                      order.statusHistory.map((status, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2" />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {STATUS_LABELS[status.status as keyof typeof STATUS_LABELS] || status.status}
                            </p>
                            <p className="text-sm text-gray-600">
                              {formatDate(status.timestamp)}
                            </p>
                            {status.notes && (
                              <p className="text-sm text-gray-500 mt-1">
                                {status.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-600">Ingen status historik tilgængelig</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Levering
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {order.delivery.expectedDelivery && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Forventet levering:</p>
                        <p className="text-gray-900">
                          {formatDate(order.delivery.expectedDelivery)}
                        </p>
                      </div>
                    )}
                    
                    {order.delivery.deliveryAddress && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Leveringsadresse:</p>
                        <div className="text-gray-900">
                          <p>{order.delivery.deliveryAddress.street}</p>
                          <p>
                            {order.delivery.deliveryAddress.postalCode} {order.delivery.deliveryAddress.city}
                          </p>
                          <p>{order.delivery.deliveryAddress.country}</p>
                        </div>
                      </div>
                    )}

                    {order.delivery.courierInfo && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Fragtfirma:</p>
                        <p className="text-gray-900">{order.delivery.courierInfo.company}</p>
                        {order.delivery.courierInfo.trackingNumber && (
                          <p className="text-sm text-gray-600">
                            Sporings nr: {order.delivery.courierInfo.trackingNumber}
                          </p>
                        )}
                      </div>
                    )}

                    {order.delivery.deliveryInstructions && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Leveringsinstruktioner:</p>
                        <p className="text-gray-900">{order.delivery.deliveryInstructions}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Invoice Information */}
              {order.invoice.isInvoiced && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Faktura
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium">Faktura sendt</span>
                      </div>
                      
                      {order.invoice.invoicedAt && (
                        <div>
                          <p className="text-sm font-medium text-gray-600">Sendt dato:</p>
                          <p className="text-gray-900">
                            {formatDate(order.invoice.invoicedAt)}
                          </p>
                        </div>
                      )}

                      {order.invoice.invoiceNumber && (
                        <div>
                          <p className="text-sm font-medium text-gray-600">Faktura nummer:</p>
                          <p className="text-gray-900">{order.invoice.invoiceNumber}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Order Notes */}
              {(order.orderNotes || order.internalNotes) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Noter
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {order.orderNotes && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Kunde noter:</p>
                        <p className="text-gray-900">{order.orderNotes}</p>
                      </div>
                    )}
                    
                    {order.internalNotes && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Interne noter:</p>
                        <p className="text-gray-900">{order.internalNotes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminOrderDetail; 