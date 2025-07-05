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
        <div className="flex-grow bg-gray-50">
          <div className="page-container py-6 md:py-8">
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
        </div>
      </DashboardLayout>
    );
  }

  if (error || !order) {
    return (
      <DashboardLayout>
        <div className="flex-grow bg-gray-50">
          <div className="page-container py-6 md:py-8">
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
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex-grow bg-gray-50">
        <div className="page-container py-6 md:py-8">
          <div className="content-width space-y-6">
            {/* Back button and title */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/admin/orders')}
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tilbage til ordrer
              </Button>
              {!isLoading && order && (
                <h1 className="text-2xl font-bold">
                  Ordre #{order.orderNumber}
                </h1>
              )}
            </div>

            {isLoading ? (
              // Loading skeleton
              <div className="space-y-6">
                <Skeleton className="h-[200px] w-full" />
                <Skeleton className="h-[400px] w-full" />
              </div>
            ) : error ? (
              // Error state
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : order ? (
              // Order details content
              <div className="space-y-6">
                {/* Status progression */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <StatusProgression />
                  </CardContent>
                </Card>

                {/* Customer information */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Kunde information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-medium text-brand-gray-900">{order.customer?.company}</h3>
                        <p className="text-brand-gray-600">{order.customer?.name}</p>
                        <p className="text-brand-gray-600">{order.customer?.email}</p>
                        <p className="text-brand-gray-600">{order.customer?.phone}</p>
                      </div>
                      <div>
                        <h3 className="font-medium text-brand-gray-900">CVR: {order.customer?.cvr}</h3>
                        {order.customer?.discountGroup && (
                          <Badge variant="secondary" className="mt-2">
                            {order.customer.discountGroup.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Delivery information */}
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <CardTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5" />
                        Levering
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDeliveryEdit}
                        className="w-full sm:w-auto"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Rediger levering
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-medium text-brand-gray-900">Leveringsadresse</h3>
                        <p className="text-brand-gray-600">{order.deliveryAddress?.street}</p>
                        <p className="text-brand-gray-600">
                          {order.deliveryAddress?.postalCode} {order.deliveryAddress?.city}
                        </p>
                      </div>
                      <div>
                        <h3 className="font-medium text-brand-gray-900">Leveringstidspunkt</h3>
                        {order.delivery?.expectedDelivery ? (
                          <>
                            <p className="text-brand-gray-600">
                              {formatDeliveryDate(order.delivery.expectedDelivery)}
                            </p>
                            {order.delivery.deliveryTimeSlot && (
                              <p className="text-brand-gray-600">
                                {order.delivery.deliveryTimeSlot}
                              </p>
                            )}
                            {order.delivery.isManuallySet && (
                              <Badge variant="outline" className="mt-2">
                                Manuelt fastsat
                              </Badge>
                            )}
                          </>
                        ) : (
                          <p className="text-brand-gray-500 italic">Ikke fastsat endnu</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Order items */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Ordre detaljer
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b last:border-0">
                          <div className="flex-grow">
                            <h3 className="font-medium text-brand-gray-900">{item.product.name}</h3>
                            <p className="text-sm text-brand-gray-600">
                              {item.quantity} {item.product.unit?.name || 'stk'} á {formatPrice(item.price)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-brand-gray-900">
                              {formatPrice(item.quantity * item.price)}
                            </p>
                            {item.discountPercent > 0 && (
                              <Badge variant="secondary" className="ml-2">
                                {item.discountPercent}% rabat
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      <div className="pt-4 space-y-2">
                        <div className="flex justify-between text-brand-gray-600">
                          <span>Subtotal</span>
                          <span>{formatPrice(order.subtotal)}</span>
                        </div>
                        {order.discountAmount > 0 && (
                          <div className="flex justify-between text-brand-gray-600">
                            <span>Rabat</span>
                            <span>-{formatPrice(order.discountAmount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-medium text-brand-gray-900 text-lg">
                          <span>Total</span>
                          <span>{formatPrice(order.total)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Order history */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Ordre historik
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {order.statusHistory?.map((history, index) => (
                        <div key={index} className="flex gap-4 pb-4 last:pb-0 border-b last:border-0">
                          <div className="flex-shrink-0">
                            {getStatusIcon(history.status)}
                          </div>
                          <div>
                            <p className="font-medium text-brand-gray-900">
                              {STATUS_LABELS[history.status as keyof typeof STATUS_LABELS]}
                            </p>
                            <p className="text-sm text-brand-gray-600">
                              {formatDate(history.timestamp)}
                            </p>
                            {history.notes && (
                              <p className="text-sm text-brand-gray-500 mt-1">
                                {history.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </div>
        </div>
      </div>

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
    </DashboardLayout>
  );
};

export default AdminOrderDetail; 