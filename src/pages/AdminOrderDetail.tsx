import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Package, User, Calendar, MapPin, Banknote, FileText, Clock, AlertTriangle, CheckCircle, Truck, Send, ArrowRight, Receipt, Box, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { authService, type Order } from '@/lib/auth';
import { cn } from '@/lib/utils';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

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

const STATUS_PROGRESSION = ['order_placed', 'order_confirmed', 'in_transit', 'delivered', 'invoiced'] as const;

const AdminOrderDetail: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdminAuthenticated } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  // Delivery date modal state
  const [deliveryDateDialogOpen, setDeliveryDateDialogOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<string>('');
  const [skippedStatuses, setSkippedStatuses] = useState<string[]>([]);
  const [deliveryDate, setDeliveryDate] = useState<string>('tomorrow');
  const [deliveryTime, setDeliveryTime] = useState<string>('09:00-12:00');
  const [customDeliveryDate, setCustomDeliveryDate] = useState<string>('');

  // Delivery edit state (for standalone delivery updates)
  const [deliveryEditDialogOpen, setDeliveryEditDialogOpen] = useState(false);
  const [isUpdatingDelivery, setIsUpdatingDelivery] = useState(false);
  const [editDeliveryDate, setEditDeliveryDate] = useState<string>('tomorrow');
  const [editDeliveryTime, setEditDeliveryTime] = useState<string>('09:00-12:00');
  const [editCustomDeliveryDate, setEditCustomDeliveryDate] = useState<string>('');

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

  const formatDeliveryDate = (date: string | Date): string => {
    return new Intl.DateTimeFormat('da-DK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  };

  const handleStatusUpdate = async (status: string) => {
    if (!order || isUpdatingStatus) return;

    const currentIndex = STATUS_PROGRESSION.indexOf(order.status as any);
    const targetIndex = STATUS_PROGRESSION.indexOf(status as any);
    const skipStatuses = targetIndex > currentIndex + 1 
      ? STATUS_PROGRESSION.slice(currentIndex + 1, targetIndex)
      : [];

    // Special handling for "in_transit" (Pakket) status - requires delivery date
    if (status === 'in_transit') {
      setTargetStatus(status);
      setSkippedStatuses(skipStatuses);
      setDeliveryDate('tomorrow');
      setDeliveryTime('09:00-12:00');
      setCustomDeliveryDate('');
      setDeliveryDateDialogOpen(true);
      return;
    }

    // For other statuses, update directly
    try {
      setIsUpdatingStatus(true);

      const response = await authService.updateOrderStatus(order._id, status, {
        skippedStatuses: skipStatuses,
        sendEmailNotification: true
      });

      if (response.success) {
        setOrder(prev => prev ? {
          ...prev,
          status: status as Order['status'],
          statusHistory: [
            ...(prev.statusHistory || []),
            {
              status: status,
              timestamp: new Date().toISOString(),
              notes: `Status opdateret til ${STATUS_LABELS[status as keyof typeof STATUS_LABELS]}`
            }
          ]
        } : null);

        toast({
          title: "Status opdateret",
          description: `Ordre ${order.orderNumber} er nu markeret som ${STATUS_LABELS[status as keyof typeof STATUS_LABELS]}`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Fejl",
        description: error.message || "Kunne ikke opdatere status",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const updateOrderStatusWithDelivery = async () => {
    if (!order || !targetStatus) return;

    // Validate delivery information
    if (deliveryDate === 'custom' && !customDeliveryDate) {
      toast({
        title: "Fejl",
        description: "Vælg venligst en leveringsdato",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUpdatingStatus(true);
      
      // Calculate actual delivery date
      let actualDeliveryDate: Date;
      if (deliveryDate === 'today') {
        actualDeliveryDate = new Date();
      } else if (deliveryDate === 'tomorrow') {
        actualDeliveryDate = new Date();
        actualDeliveryDate.setDate(actualDeliveryDate.getDate() + 1);
      } else if (deliveryDate === 'day_after_tomorrow') {
        actualDeliveryDate = new Date();
        actualDeliveryDate.setDate(actualDeliveryDate.getDate() + 2);
      } else if (deliveryDate === 'custom' && customDeliveryDate) {
        actualDeliveryDate = new Date(customDeliveryDate);
      } else {
        throw new Error('Invalid delivery date selection');
      }

      // Call backend API with delivery information
      const response = await authService.updateOrderStatus(order._id, targetStatus, {
        skippedStatuses: skippedStatuses || [],
        sendEmailNotification: true,
        deliveryInfo: {
          expectedDelivery: actualDeliveryDate.toISOString(),
          deliveryTimeSlot: deliveryTime,
          deliveryDate: deliveryDate
        }
      });

      if (response.success) {
        setOrder(prev => prev ? {
          ...prev,
          status: targetStatus as Order['status'],
          delivery: {
            ...prev.delivery,
            expectedDelivery: actualDeliveryDate.toISOString(),
            deliveryTimeSlot: deliveryTime
          },
          statusHistory: [
            ...(prev.statusHistory || []),
            {
              status: targetStatus,
              timestamp: new Date().toISOString(),
              notes: `Status opdateret til ${STATUS_LABELS[targetStatus as keyof typeof STATUS_LABELS]} med leveringsdato`
            }
          ]
        } : null);
        
        // Format delivery info for display
        const deliveryDateStr = actualDeliveryDate.toLocaleDateString('da-DK', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        toast({
          title: "Status opdateret med leveringsdato",
          description: `Ordre ${order.orderNumber} er nu ${STATUS_LABELS[targetStatus as keyof typeof STATUS_LABELS]}. Leveringsdato: ${deliveryDateStr}, ${deliveryTime}`,
        });

        setDeliveryDateDialogOpen(false);
        setTargetStatus('');
        setSkippedStatuses([]);
        setDeliveryDate('tomorrow');
        setDeliveryTime('09:00-12:00');
        setCustomDeliveryDate('');
      }
    } catch (error: any) {
      toast({
        title: "Fejl",
        description: error.message || "Kunne ikke opdatere status med leveringsdato",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle standalone delivery edit
  const handleDeliveryEdit = () => {
    if (!order) return;
    
    // Pre-fill with existing delivery info if available
    if (order.delivery?.deliveryTimeSlot) {
      setEditDeliveryTime(order.delivery.deliveryTimeSlot);
    } else {
      setEditDeliveryTime('09:00-12:00');
    }
    
    if (order.delivery?.expectedDelivery) {
      // Determine delivery date type based on existing date
      const existingDate = new Date(order.delivery.expectedDelivery);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const dayAfter = new Date(today);
      dayAfter.setDate(today.getDate() + 2);
      
      // Compare dates (ignore time)
      const existingDateStr = existingDate.toDateString();
      const todayStr = today.toDateString();
      const tomorrowStr = tomorrow.toDateString();
      const dayAfterStr = dayAfter.toDateString();
      
      if (existingDateStr === todayStr) {
        setEditDeliveryDate('today');
      } else if (existingDateStr === tomorrowStr) {
        setEditDeliveryDate('tomorrow');
      } else if (existingDateStr === dayAfterStr) {
        setEditDeliveryDate('day_after_tomorrow');
      } else {
        setEditDeliveryDate('custom');
        setEditCustomDeliveryDate(existingDate.toISOString().split('T')[0]);
      }
    } else {
      setEditDeliveryDate('tomorrow');
      setEditCustomDeliveryDate('');
    }
    
    setDeliveryEditDialogOpen(true);
  };

  // Update delivery information standalone
  const updateDeliveryInfo = async () => {
    if (!order) return;

    // Validate delivery information
    if (editDeliveryDate === 'custom' && !editCustomDeliveryDate) {
      toast({
        title: "Fejl",
        description: "Vælg venligst en leveringsdato",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUpdatingDelivery(true);
      
      // Call the delivery update API
      const response = await authService.updateOrderDelivery(order._id, {
        deliveryDateType: editDeliveryDate as any,
        customDeliveryDate: editDeliveryDate === 'custom' ? editCustomDeliveryDate : undefined,
        deliveryTimeSlot: editDeliveryTime as any,
        reason: 'Delivery information updated from admin order detail interface'
      });
      
      if (response.success) {
        // Update local order state
        setOrder(prev => prev ? {
          ...prev,
          delivery: {
            ...prev.delivery,
            expectedDelivery: response.newDelivery.expectedDelivery,
            deliveryTimeSlot: response.newDelivery.deliveryTimeSlot,
            isManuallySet: true,
            setBy: response.updatedBy.id,
            setAt: new Date().toISOString()
          }
        } : null);

        // Format delivery info for display
        const deliveryDateStr = new Date(response.newDelivery.expectedDelivery).toLocaleDateString('da-DK', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        let description = `Leveringsinformation er opdateret for ordre ${order.orderNumber}`;
        description += `\n\nNy leveringsdato: ${deliveryDateStr}`;
        description += `\nNyt tidsinterval: ${response.newDelivery.deliveryTimeSlot}`;
        description += `\n\nKunden har modtaget email med den opdaterede leveringsinformation.`;

        toast({
          title: "Leveringsinformation opdateret",
          description,
        });

        setDeliveryEditDialogOpen(false);
        setEditDeliveryDate('tomorrow');
        setEditDeliveryTime('09:00-12:00');
        setEditCustomDeliveryDate('');
      }
    } catch (error: any) {
      toast({
        title: "Fejl",
        description: error.message || "Kunne ikke opdatere leveringsinformation",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingDelivery(false);
    }
  };

  const getCurrentStatusIndex = (status: string) => {
    return STATUS_PROGRESSION.indexOf(status as any);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'order_placed':
        return <Clock className="h-4 w-4" />;
      case 'order_confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'in_transit':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <Package className="h-4 w-4" />;
      case 'invoiced':
        return <Receipt className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Status Progression Component
  const StatusProgression: React.FC = () => {
    if (!order) return null;
    
    const currentIndex = getCurrentStatusIndex(order.status);
    
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Status progression
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 py-3">
            {STATUS_PROGRESSION.map((status, index) => {
              const isComplete = index <= currentIndex;
              const isCurrent = index === currentIndex;
              const canProgress = index > currentIndex && !isUpdatingStatus;
              const isNext = index === currentIndex + 1;
              const willSkipSteps = index > currentIndex + 1;
              
              return (
                <React.Fragment key={status}>
                  <div 
                    className={cn(
                      "relative flex items-center justify-center transition-all duration-300",
                      "border-2 rounded-full text-xs font-medium w-8 h-8 sm:w-10 sm:h-10",
                      isComplete 
                        ? "bg-blue-600 text-white border-blue-600" 
                        : "bg-gray-50 text-gray-400 border-gray-200",
                      canProgress && "cursor-pointer hover:scale-110 hover:shadow-md",
                      isCurrent && "ring-2 ring-blue-300 shadow-md",
                      willSkipSteps && canProgress && "hover:ring-2 hover:ring-yellow-300"
                    )}
                    onClick={() => canProgress && handleStatusUpdate(status)}
                    title={
                      canProgress 
                        ? `${STATUS_LABELS[status]} ${isNext ? '(Næste)' : '(Spring til)'}`
                        : STATUS_LABELS[status]
                    }
                  >
                    {getStatusIcon(status)}
                    {isCurrent && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full animate-pulse" />
                    )}
                    {willSkipSteps && canProgress && (
                      <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full" />
                    )}
                    {isUpdatingStatus && canProgress && (
                      <div className="absolute inset-0 bg-gray-200 rounded-full animate-pulse" />
                    )}
                  </div>
                  
                  {index < STATUS_PROGRESSION.length - 1 && (
                    <div className={cn(
                      "flex-1 h-0.5 transition-all duration-300",
                      index < currentIndex 
                        ? "bg-blue-600" 
                        : "bg-gray-200"
                    )} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Klik på en status for at opdatere ordren. Kunden vil modtage email om ændringen.
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="dashboard-page-container">
          <div className="content-width">
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
      </DashboardLayout>
    );
  }

  if (error || !order) {
    return (
      <DashboardLayout>
        <div className="dashboard-page-container">
          <div className="content-width">
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
      </DashboardLayout>
    );
  }

  return (
    <>
      <DashboardLayout>
        <div className="dashboard-page-container">
          <div className="content-width">
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Banknote className="h-5 w-5 text-green-600" />
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
                    <Banknote className="h-5 w-5 text-orange-600" />
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

            {/* Status Progression */}
            <StatusProgression />

            {/* Main Content */}
            <div className="grid gap-6 xl:grid-cols-3">
              {/* Left Column - Order Items & Customer */}
              <div className="xl:col-span-2 space-y-6">
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
                        <div key={index} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0">
                            {item.product.billeder && item.product.billeder.length > 0 ? (
                              <img
                                src={item.product.billeder[0].url}
                                alt={item.product.produktnavn}
                                className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling!.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={cn(
                              "w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center border border-gray-200 shadow-sm",
                              item.product.billeder && item.product.billeder.length > 0 ? "hidden" : ""
                            )}>
                              <Package className="h-4 w-4 sm:h-6 sm:w-6 text-gray-400" />
                            </div>
                          </div>
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
                    <div className="grid gap-4 sm:grid-cols-2">
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
                          <Badge 
                            className="mt-2 text-white font-medium"
                            style={{ backgroundColor: order.customerSnapshot.discountGroup.color }}
                          >
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
                    <div className="space-y-4">
                      {order.delivery.expectedDelivery && order.delivery.isManuallySet && (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-blue-600" />
                              <p className="text-sm font-medium text-blue-900">Forventet levering:</p>
                            </div>
                            {/* Edit button for delivery */}
                            {!order.delivery.deliveredAt && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDeliveryEdit}
                                className="h-6 px-2 text-xs border-blue-300 text-blue-700 hover:bg-blue-100"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Rediger
                              </Button>
                            )}
                          </div>
                          <div className="space-y-2">
                                                        <p className="text-blue-800 font-semibold text-lg">
                              {formatDeliveryDate(order.delivery.expectedDelivery)}
                            </p>
                            {/* Show time slot if available */}
                            {order.delivery.deliveryTimeSlot && !order.delivery.deliveredAt && (
                              <div className="flex items-center gap-2 text-blue-700">
                                <Clock className="h-4 w-4" />
                                <p className="text-sm font-medium">
                                  <strong>Tidsinterval:</strong> {order.delivery.deliveryTimeSlot}
                                </p>
                              </div>
                            )}
                            {/* Show manual delivery indicator */}
                            {order.delivery.isManuallySet && !order.delivery.deliveredAt && (
                              <div className="text-xs text-blue-600 opacity-75">
                                ✓ Manuelt fastsat leveringsdato
                              </div>
                            )}
                          </div>

                        </div>
                      )}
                      
                      {order.delivery.deliveryAddress && (
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-4 w-4 text-green-600" />
                            <p className="text-sm font-medium text-green-900">Leveringsadresse:</p>
                          </div>
                          <div className="text-green-800 font-medium space-y-1">
                            <p className="text-base">{order.delivery.deliveryAddress.street}</p>
                            <p className="text-base">
                              {order.delivery.deliveryAddress.postalCode} {order.delivery.deliveryAddress.city}
                            </p>
                            <p className="text-sm">{order.delivery.deliveryAddress.country}</p>
                          </div>
                        </div>
                      )}

                      {order.delivery.courierInfo && (
                        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <div className="flex items-center gap-2 mb-1">
                            <Truck className="h-4 w-4 text-purple-600" />
                            <p className="text-sm font-medium text-purple-900">Fragtfirma:</p>
                          </div>
                          <p className="text-purple-800 font-medium">{order.delivery.courierInfo.company}</p>
                          {order.delivery.courierInfo.trackingNumber && (
                            <p className="text-sm text-purple-700 mt-1">
                              Sporings nr: {order.delivery.courierInfo.trackingNumber}
                            </p>
                          )}
                        </div>
                      )}

                      {order.delivery.deliveryInstructions && (
                        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="h-4 w-4 text-yellow-600" />
                            <p className="text-sm font-medium text-yellow-900">Leveringsinstruktioner:</p>
                          </div>
                          <p className="text-yellow-800">{order.delivery.deliveryInstructions}</p>
                        </div>
                      )}

                      {!order.delivery.deliveryAddress && !order.delivery.expectedDelivery && !order.delivery.courierInfo && !order.delivery.deliveryInstructions && (
                        <div className="text-center py-4 text-gray-500">
                          <Truck className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">Ingen leveringsoplysninger tilgængelige</p>
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
      </DashboardLayout>

      {/* Delivery Date Dialog for "Pakket" Status */}
      <AlertDialog open={deliveryDateDialogOpen} onOpenChange={setDeliveryDateDialogOpen}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-600" />
              Leveringsdato og tid
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  Indstil leveringsdato og tidsinterval for ordre <strong>{order?.orderNumber}</strong>
                </p>
                
                {skippedStatuses.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium text-yellow-800">Springede steps:</span>
                    </div>
                    <div className="text-sm text-yellow-700">
                      {skippedStatuses.map(status => STATUS_LABELS[status as keyof typeof STATUS_LABELS]).join(' → ')}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="delivery-date" className="text-sm font-medium">
                      Leveringsdato *
                    </Label>
                    <select
                      id="delivery-date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="today">I dag</option>
                      <option value="tomorrow">I morgen (standard)</option>
                      <option value="day_after_tomorrow">I overmorgen</option>
                      <option value="custom">Vælg specifik dato</option>
                    </select>
                  </div>

                  {deliveryDate === 'custom' && (
                    <div className="space-y-2">
                      <Label htmlFor="custom-date" className="text-sm font-medium">
                        Specifik dato *
                      </Label>
                      <Input
                        id="custom-date"
                        type="date"
                        value={customDeliveryDate}
                        onChange={(e) => setCustomDeliveryDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="delivery-time" className="text-sm font-medium">
                      Tidsinterval *
                    </Label>
                    <select
                      id="delivery-time"
                      value={deliveryTime}
                      onChange={(e) => setDeliveryTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="09:00-12:00">09:00-12:00 (standard)</option>
                      <option value="12:00-16:00">12:00-16:00</option>
                      <option value="16:00-20:00">16:00-20:00</option>
                      <option value="09:00-20:00">Hele dagen (09:00-20:00)</option>
                    </select>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Send className="h-4 w-4" />
                    <span className="font-medium text-sm">Email notifikation</span>
                  </div>
                  <p className="text-sm text-blue-600 mt-1">
                    Kunden vil modtage en email med leveringsinformation og opdateret status.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatingStatus}>Annuller</AlertDialogCancel>
            <AlertDialogAction
              onClick={updateOrderStatusWithDelivery}
              disabled={isUpdatingStatus || (deliveryDate === 'custom' && !customDeliveryDate)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUpdatingStatus ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Opdaterer...
                </>
              ) : (
                <>
                  <Truck className="h-4 w-4 mr-2" />
                  Opdater med leveringsdato
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Standalone Delivery Edit Dialog */}
      <AlertDialog open={deliveryEditDialogOpen} onOpenChange={setDeliveryEditDialogOpen}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" />
              Rediger leveringsinformation
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  Opdater leveringsdato og tidsinterval for ordre <strong>{order?.orderNumber}</strong>
                </p>
                
                {/* Current delivery info display - Only show if manually set */}
                {order?.delivery?.expectedDelivery && order?.delivery?.isManuallySet && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Nuværende leveringsinformation:</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><strong>Dato:</strong> {formatDeliveryDate(order.delivery.expectedDelivery)}</p>
                      {order.delivery.deliveryTimeSlot && (
                        <p><strong>Tidsinterval:</strong> {order.delivery.deliveryTimeSlot}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-delivery-date" className="text-sm font-medium">
                      Ny leveringsdato *
                    </Label>
                    <select
                      id="edit-delivery-date"
                      value={editDeliveryDate}
                      onChange={(e) => setEditDeliveryDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="today">I dag</option>
                      <option value="tomorrow">I morgen</option>
                      <option value="day_after_tomorrow">I overmorgen</option>
                      <option value="custom">Vælg specifik dato</option>
                    </select>
                  </div>

                  {editDeliveryDate === 'custom' && (
                    <div className="space-y-2">
                      <Label htmlFor="edit-custom-date" className="text-sm font-medium">
                        Specifik dato *
                      </Label>
                      <Input
                        id="edit-custom-date"
                        type="date"
                        value={editCustomDeliveryDate}
                        onChange={(e) => setEditCustomDeliveryDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="edit-delivery-time" className="text-sm font-medium">
                      Nyt tidsinterval *
                    </Label>
                    <select
                      id="edit-delivery-time"
                      value={editDeliveryTime}
                      onChange={(e) => setEditDeliveryTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="09:00-12:00">09:00-12:00</option>
                      <option value="12:00-16:00">12:00-16:00</option>
                      <option value="16:00-20:00">16:00-20:00</option>
                      <option value="09:00-20:00">Hele dagen (09:00-20:00)</option>
                    </select>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Send className="h-4 w-4" />
                    <span className="font-medium text-sm">Email notifikation</span>
                  </div>
                  <p className="text-sm text-blue-600 mt-1">
                    Kunden vil modtage en email med den opdaterede leveringsinformation.
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatingDelivery}>Annuller</AlertDialogCancel>
            <AlertDialogAction
              onClick={updateDeliveryInfo}
              disabled={isUpdatingDelivery || (editDeliveryDate === 'custom' && !editCustomDeliveryDate)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUpdatingDelivery ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Opdaterer...
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Opdater leveringsinformation
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminOrderDetail; 