import React, { useState, useEffect } from "react";
import { 
  MoreHorizontal, 
  Download, 
  Filter, 
  Package, 
  Calendar, 
  CreditCard,
  AlertTriangle,
  Truck,
  CheckCircle,
  Clock,
  Send,
  Receipt,
  Eye,
  Plus,
  ArrowRight,
  ChevronRight,
  FileText,
  Zap,
  TrendingUp
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authService } from "@/lib/auth";
import { OrderNumberDisplay, OrderNumberCompact } from "@/components/ui/order-number-display";
import { exportOrdersToPDF } from "@/lib/pdf-export";
import { useAuth } from "@/hooks/useAuth";
import { useOrders } from "@/hooks/useOrders";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import type { OrderSummary, Order, OrderStatistics } from "@/lib/auth";

interface AdminOrderData {
  orders: OrderSummary[];
  pagination: {
    currentPage: number;
    limit: number;
    totalOrders: number;
    totalPages: number;
  } | null;
  statistics?: OrderStatistics;
}

// Status progression order
const STATUS_PROGRESSION = [
  'order_placed',
  'order_confirmed', 
  'in_transit',
  'delivered',
  'invoiced'
] as const;

const STATUS_LABELS = {
  order_placed: 'Afgivet',
  order_confirmed: 'Bekræftet',
  in_transit: 'Pakket',
  delivered: 'Leveret',
  invoiced: 'Faktureret'
} as const;

const STATUS_COLORS = {
  order_placed: 'bg-brand-gray-100 text-brand-gray-700 border-brand-gray-200',
  order_confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
  in_transit: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  delivered: 'bg-brand-primary/10 text-brand-primary-dark border-brand-primary/20',
  invoiced: 'bg-brand-success/10 text-brand-success border-brand-success/20'
} as const;

const DashboardOrders: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdminAuthenticated } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Customer order state (from useOrders hook)
  const { 
    orders: customerOrders,
    ordersPagination: customerPagination,
    isLoadingOrders: isLoadingCustomerOrders,
    ordersError: customerOrdersError,
    loadOrders: loadCustomerOrders
  } = useOrders();

  // Admin order state (separate from customer orders)
  const [adminOrders, setAdminOrders] = useState<OrderSummary[]>([]);
  const [adminPagination, setAdminPagination] = useState<AdminOrderData['pagination']>(null);
  const [adminStatistics, setAdminStatistics] = useState<OrderStatistics | null>(null);
  const [isLoadingAdminOrders, setIsLoadingAdminOrders] = useState(false);
  const [adminOrdersError, setAdminOrdersError] = useState<string | null>(null);

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderSummary | null>(null);
  const [orderDetailsDialogOpen, setOrderDetailsDialogOpen] = useState(false);
  const [statusUpdateDialogOpen, setStatusUpdateDialogOpen] = useState(false);
  const [statusJumpDialogOpen, setStatusJumpDialogOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [bulkInvoiceDialogOpen, setBulkInvoiceDialogOpen] = useState(false);
  const [isProcessingInvoice, setIsProcessingInvoice] = useState(false);
  const [isProcessingStatusUpdate, setIsProcessingStatusUpdate] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [skippedStatuses, setSkippedStatuses] = useState<string[]>([]);

  // Determine if we're in admin or customer context
  const isAdminContext = isAdminAuthenticated && location.pathname.includes('/admin');

  useEffect(() => {
    if (isAdminContext) {
      loadAdminOrders();
      loadAdminStatistics();
    }
    // Customer orders are loaded automatically by useOrders hook
  }, [isAdminContext, searchTerm, statusFilter]);

  const loadAdminOrders = async () => {
    if (!isAdminContext) return;

    try {
      setIsLoadingAdminOrders(true);
      setAdminOrdersError(null);

      const response = await authService.getOrders({
        page: 1,
        limit: 20,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        sortBy: 'placedAt',
        sortOrder: 'desc'
      });

      if (response.success) {
        setAdminOrders(response.orders);
        setAdminPagination(response.pagination);
      } else {
        setAdminOrdersError(response.message || 'Kunne ikke hente ordrer');
      }
    } catch (error: any) {
      console.error('❌ Error loading admin orders:', error);
      setAdminOrdersError(error.message || 'Fejl ved indlæsning af ordrer');
    } finally {
      setIsLoadingAdminOrders(false);
    }
  };

  const loadAdminStatistics = async () => {
    if (!isAdminContext) return;

    try {
      const response = await authService.getOrderStatistics();
      if (response.success) {
        setAdminStatistics(response.statistics);
      }
    } catch (error) {
      console.error('❌ Error loading order statistics:', error);
    }
  };

  const handleOrderDetails = (order: OrderSummary) => {
    setSelectedOrder(order);
    setOrderDetailsDialogOpen(true);
  };

  const handleStatusUpdate = (order: OrderSummary, targetStatus: string) => {
    const currentIndex = getCurrentStatusIndex(order.status);
    const targetIndex = getCurrentStatusIndex(targetStatus);
    
    // If jumping to next status, use simple update
    if (targetIndex === currentIndex + 1) {
      setSelectedOrder(order);
      setNewStatus(targetStatus);
      setSkippedStatuses([]);
      setStatusUpdateDialogOpen(true);
    } 
    // If jumping multiple steps, show jump confirmation
    else if (targetIndex > currentIndex + 1) {
      const skipped = STATUS_PROGRESSION.slice(currentIndex + 1, targetIndex);
      setSelectedOrder(order);
      setNewStatus(targetStatus);
      setSkippedStatuses(skipped);
      setStatusJumpDialogOpen(true);
    }
  };

  const updateOrderStatus = async (includeSkippedSteps: boolean = false) => {
    if (!selectedOrder || !newStatus) return;

    try {
      setIsProcessingStatusUpdate(true);
      // TODO: Implement status update API call
      // const response = await authService.updateOrderStatus(selectedOrder._id, newStatus, includeSkippedSteps);
      
      // For now, simulate success
      const statusLabel = STATUS_LABELS[newStatus as keyof typeof STATUS_LABELS];
      let description = `Ordre ${selectedOrder.orderNumber} er nu markeret som ${statusLabel}`;
      
      if (includeSkippedSteps && skippedStatuses.length > 0) {
        const skippedLabels = skippedStatuses.map(s => STATUS_LABELS[s as keyof typeof STATUS_LABELS]);
        description += `\n\nSprunget over: ${skippedLabels.join(' → ')}`;
      }

      toast({
        title: "Status opdateret",
        description,
      });

      // Update local state
      setAdminOrders(prev => prev.map(order => 
        order._id === selectedOrder._id 
          ? { ...order, status: newStatus }
          : order
      ));

      setStatusUpdateDialogOpen(false);
      setStatusJumpDialogOpen(false);
      setSelectedOrder(null);
      setSkippedStatuses([]);
    } catch (error: any) {
      toast({
        title: "Fejl",
        description: error.message || "Kunne ikke opdatere status",
        variant: "destructive",
      });
    } finally {
      setIsProcessingStatusUpdate(false);
    }
  };

  const handleSendInvoice = async () => {
    if (!selectedOrder) return;

    try {
      setIsProcessingInvoice(true);
      const response = await authService.sendInvoice(selectedOrder._id);

      if (response.success) {
        toast({
          title: "Faktura sendt",
          description: `Faktura ${response.invoiceNumber} er sendt succesfuldt`,
        });

        // Update order in local state
        setAdminOrders(prev => prev.map(order => 
          order._id === selectedOrder._id 
            ? { ...order, isInvoiced: true, invoiceNumber: response.invoiceNumber }
            : order
        ));

        setInvoiceDialogOpen(false);
        setSelectedOrder(null);
      } else {
        toast({
          title: "Fejl",
          description: response.message || "Kunne ikke sende faktura",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Fejl",
        description: error.message || "Fejl ved afsendelse af faktura",
        variant: "destructive",
      });
    } finally {
      setIsProcessingInvoice(false);
    }
  };

  const handleBulkSendInvoices = async () => {
    if (selectedOrders.length === 0) return;

    try {
      setIsProcessingInvoice(true);
      const response = await authService.bulkSendInvoices(selectedOrders);

      if (response.success) {
        toast({
          title: "Bulk fakturering gennemført",
          description: `${response.summary.success} fakturaer sendt, ${response.summary.errors} fejl`,
        });

        // Update orders in local state
        setAdminOrders(prev => prev.map(order => {
          const result = response.results.find(r => r.orderNumber === order.orderNumber);
          if (result && result.success) {
            return { ...order, isInvoiced: true, invoiceNumber: result.invoiceNumber };
          }
          return order;
        }));

        setBulkInvoiceDialogOpen(false);
        setSelectedOrders([]);
      } else {
        toast({
          title: "Fejl",
          description: response.message || "Kunne ikke sende fakturaer",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Fejl",
        description: error.message || "Fejl ved bulk fakturering",
        variant: "destructive",
      });
    } finally {
      setIsProcessingInvoice(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExportingPDF(true);
      
      // Generate PDF with order data - only export admin orders for now
      if (!isAdminContext) {
        toast({
          title: "Ikke tilgængelig",
          description: "PDF eksport er kun tilgængelig for administratorer",
          variant: "destructive",
        });
        return;
      }
      
      await exportOrdersToPDF({
        orders: adminOrders,
        includeImages: true,
        includeTechnicalDetails: true,
        filename: `multi-groent-ordrer-${new Date().toISOString().split('T')[0]}.pdf`
      });
      
      toast({
        title: "PDF genereret",
        description: "Ordre PDF er klar til download med produktbilleder og tekniske detaljer",
      });
    } catch (error: any) {
      toast({
        title: "Fejl",
        description: error.message || "Kunne ikke generere PDF",
        variant: "destructive",
      });
    } finally {
      setIsExportingPDF(false);
    }
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

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'order_placed':
        return 'outline';
      case 'order_confirmed':
        return 'secondary';
      case 'in_transit':
        return 'default';
      case 'delivered':
        return 'default';
      case 'invoiced':
        return 'default';
      default:
        return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('da-DK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getCurrentStatusIndex = (status: string) => {
    return STATUS_PROGRESSION.indexOf(status as any);
  };

  const getNextStatus = (currentStatus: string) => {
    const currentIndex = getCurrentStatusIndex(currentStatus);
    if (currentIndex >= 0 && currentIndex < STATUS_PROGRESSION.length - 1) {
      return STATUS_PROGRESSION[currentIndex + 1];
    }
    return null;
  };

  // Status Progression Component
  const StatusProgression: React.FC<{ order: OrderSummary }> = ({ order }) => {
    const currentIndex = getCurrentStatusIndex(order.status);
    
    return (
      <div className="flex items-center gap-2 py-3">
        {STATUS_PROGRESSION.map((status, index) => {
          const isComplete = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const canProgress = index > currentIndex && isAdminContext; // Can click any future status
          const isNext = index === currentIndex + 1;
          const willSkipSteps = index > currentIndex + 1;
          
          return (
            <React.Fragment key={status}>
              <div 
                className={cn(
                  "relative flex items-center justify-center transition-all duration-300",
                  "border-2 rounded-full text-xs font-medium",
                  isMobile ? "w-8 h-8" : "w-10 h-10",
                  isComplete 
                    ? STATUS_COLORS[status] 
                    : "bg-brand-gray-50 text-brand-gray-400 border-brand-gray-200",
                  canProgress && "cursor-pointer hover:scale-110 hover:shadow-md",
                  isCurrent && "ring-2 ring-brand-primary/30 shadow-md",
                  willSkipSteps && canProgress && "hover:ring-2 hover:ring-yellow-300"
                )}
                onClick={() => canProgress && handleStatusUpdate(order, status)}
                title={
                  canProgress 
                    ? `${STATUS_LABELS[status]} ${isNext ? '(Næste)' : '(Spring til)'}`
                    : STATUS_LABELS[status]
                }
              >
                {getStatusIcon(status)}
                {isCurrent && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-brand-primary rounded-full animate-pulse" />
                )}
                {willSkipSteps && canProgress && (
                  <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full" />
                )}
              </div>
              
              {index < STATUS_PROGRESSION.length - 1 && (
                <div className={cn(
                  "flex-1 h-0.5 transition-all duration-300",
                  index < currentIndex 
                    ? "bg-brand-primary" 
                    : "bg-brand-gray-200"
                )} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // Order Actions Component
  const OrderActions: React.FC<{ order: OrderSummary }> = ({ order }) => {
    const nextStatus = getNextStatus(order.status);
    
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleOrderDetails(order)}
          className="gap-1 hover:bg-brand-primary/10 hover:text-brand-primary transition-colors"
        >
          <Eye className="h-3 w-3" />
          <span className="hidden sm:inline">Se detaljer</span>
        </Button>
        
        {isAdminContext && nextStatus && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStatusUpdate(order, nextStatus)}
            className="gap-1 hover:bg-blue-50 hover:text-blue-600 transition-colors"
          >
            <ArrowRight className="h-3 w-3" />
            <span className="hidden sm:inline">Næste status</span>
          </Button>
        )}
        
        {isAdminContext && !order.isInvoiced && ['order_confirmed', 'in_transit', 'delivered'].includes(order.status) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedOrder(order);
              setInvoiceDialogOpen(true);
            }}
            className="gap-1 hover:bg-brand-success/10 hover:text-brand-success transition-colors"
          >
            <Send className="h-3 w-3" />
            <span className="hidden sm:inline">Faktura</span>
          </Button>
        )}
      </div>
    );
  };

  // Determine which data to display
  const displayOrders = isAdminContext ? adminOrders : customerOrders;
  const displayPagination = isAdminContext ? adminPagination : customerPagination;
  const isLoading = isAdminContext ? isLoadingAdminOrders : isLoadingCustomerOrders;
  const error = isAdminContext ? adminOrdersError : customerOrdersError;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto"></div>
            <p className="mt-2 text-brand-gray-600">Henter ordrer...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="dashboard-page-container">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6 mb-6">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-brand-gray-900">
              {isAdminContext ? 'Ordrer' : 'Mine Ordrer'}
            </h2>
            <p className="text-sm md:text-base text-brand-gray-600 mt-1">
              {isAdminContext 
                ? 'Administrer og følg kunders ordrer med animeret status progression'
                : 'Se dine ordrer og følg deres status'
              }
            </p>
          </div>
          
          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-2 lg:flex-shrink-0">
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle status</SelectItem>
                  <SelectItem value="order_placed">Afgivet</SelectItem>
                  <SelectItem value="order_confirmed">Bekræftet</SelectItem>
                  <SelectItem value="in_transit">Pakket</SelectItem>
                  <SelectItem value="delivered">Leveret</SelectItem>
                  <SelectItem value="invoiced">Faktureret</SelectItem>
                </SelectContent>
              </Select>
              
              <Input 
                placeholder="Søg ordrer..." 
                className="w-full sm:w-64 lg:w-72" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {isAdminContext && (
              <div className="flex gap-2">
                {selectedOrders.length > 0 && (
                  <Button 
                    variant="outline" 
                    onClick={() => setBulkInvoiceDialogOpen(true)}
                    className="gap-1"
                  >
                    <Send className="h-4 w-4" />
                    Send Fakturaer ({selectedOrders.length})
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={handleExportPDF}
                  disabled={isExportingPDF}
                  className="gap-1"
                >
                  {isExportingPDF ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-primary" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">Eksporter PDF</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Orders Content */}
        <div className="content-width">
          {displayOrders.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Package className="h-12 w-12 text-brand-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-brand-gray-600">
                    {searchTerm ? 'Ingen ordrer matchede søgningen' : 'Ingen ordrer fundet'}
                  </p>
                  <p className="text-sm text-brand-gray-500 mt-1">
                    {searchTerm ? 'Prøv at ændre dine søgekriterier' : 
                     isAdminContext ? 'Der er ingen ordrer endnu' : 'Du har ikke afgivet nogen ordrer endnu'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Order Cards with Status Progression */}
              {displayOrders.map((order) => (
                <Card key={order._id} className="overflow-hidden hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-6">
                    {/* Order Header */}
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
                      <div className="flex items-start gap-4">
                        {isAdminContext && (
                          <Checkbox 
                            checked={selectedOrders.includes(order._id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedOrders(prev => [...prev, order._id]);
                              } else {
                                setSelectedOrders(prev => prev.filter(id => id !== order._id));
                              }
                            }}
                            className="mt-1"
                          />
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <OrderNumberDisplay 
                              orderNumber={order.orderNumber}
                              variant="compact"
                              showFullOnExpand={true}
                            />
                            <Badge
                              variant={getStatusVariant(order.status)}
                              className="gap-1"
                            >
                              {getStatusIcon(order.status)}
                              {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS]}
                            </Badge>
                          </div>
                          
                          {isAdminContext && (
                            <div className="flex items-center gap-2 text-sm text-brand-gray-600">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="bg-brand-primary/10 text-brand-primary text-xs">
                                  {getInitials(order.customer.companyName)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{order.customer.companyName}</span>
                              <span>•</span>
                              <span>{order.customer.contactPersonName}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-4 mt-2 text-sm text-brand-gray-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(order.placedAt)}
                            </div>
                            <div className="flex items-center gap-1">
                              <CreditCard className="h-4 w-4" />
                              <span className="font-medium text-brand-gray-900">
                                {order.totalAmount.toLocaleString('da-DK')} kr
                              </span>
                            </div>
                            {order.isInvoiced && (
                              <Badge variant="outline" className="text-xs">
                                <Receipt className="h-3 w-3 mr-1" />
                                #{order.invoiceNumber}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <OrderActions order={order} />
                    </div>

                    {/* Status Progression */}
                    <div className="border-t border-brand-gray-100 pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-brand-gray-700">Status progression</h4>
                        <span className="text-xs text-brand-gray-500">
                          {isAdminContext ? 'Klik på enhver fremtidig status for at opdatere' : 'Automatisk opdateret'}
                        </span>
                      </div>
                      <StatusProgression order={order} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={orderDetailsDialogOpen} onOpenChange={setOrderDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-brand-primary" />
              Ordre detaljer
            </DialogTitle>
            <DialogDescription>
              Detaljeret visning af ordre {selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Ordre information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm text-brand-gray-600">Ordrenummer</Label>
                      <OrderNumberDisplay 
                        orderNumber={selectedOrder.orderNumber}
                        variant="default"
                        showFullOnExpand={true}
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-brand-gray-600">Status</Label>
                      <div className="mt-1">
                        <Badge variant={getStatusVariant(selectedOrder.status)} className="gap-1">
                          {getStatusIcon(selectedOrder.status)}
                          {STATUS_LABELS[selectedOrder.status as keyof typeof STATUS_LABELS]}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-brand-gray-600">Dato</Label>
                      <p className="text-sm">{formatDate(selectedOrder.placedAt)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-brand-gray-600">Total beløb</Label>
                      <p className="text-lg font-semibold text-brand-primary">
                        {selectedOrder.totalAmount.toLocaleString('da-DK')} kr
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {isAdminContext && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Kunde information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm text-brand-gray-600">Virksomhed</Label>
                        <p className="font-medium">{selectedOrder.customer.companyName}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-brand-gray-600">Kontaktperson</Label>
                        <p>{selectedOrder.customer.contactPersonName}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-brand-gray-600">Email</Label>
                        <p>{selectedOrder.customer.email}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Status Progression in Dialog */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Status progression</CardTitle>
                </CardHeader>
                <CardContent>
                  <StatusProgression order={selectedOrder} />
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog (Next Step) */}
      <AlertDialog open={statusUpdateDialogOpen} onOpenChange={setStatusUpdateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Opdater ordre status</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på, at du vil opdatere ordre <strong>{selectedOrder?.orderNumber}</strong> til status: <strong>{STATUS_LABELS[newStatus as keyof typeof STATUS_LABELS]}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessingStatusUpdate}>Annuller</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => updateOrderStatus(false)}
              disabled={isProcessingStatusUpdate}
              className="bg-brand-primary hover:bg-brand-primary-hover"
            >
              {isProcessingStatusUpdate ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Opdaterer...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Opdater status
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Jump Dialog (Skip Steps) */}
      <AlertDialog open={statusJumpDialogOpen} onOpenChange={setStatusJumpDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
                         <AlertDialogTitle className="flex items-center gap-2">
               <Zap className="h-5 w-5 text-yellow-500" />
               Spring til status
             </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Er du sikker på, at du vil springe til status <strong>{STATUS_LABELS[newStatus as keyof typeof STATUS_LABELS]}</strong> for ordre <strong>{selectedOrder?.orderNumber}</strong>?
                </p>
                
                {skippedStatuses.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="font-medium text-yellow-800">Du springer over følgende steps:</span>
                    </div>
                    <div className="space-y-1">
                      {skippedStatuses.map((status, index) => (
                        <div key={status} className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span className="text-yellow-700">
                            {STATUS_LABELS[status as keyof typeof STATUS_LABELS]}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-yellow-600 mt-2">
                      Disse steps vil automatisk markeres som færdige
                    </p>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessingStatusUpdate}>Annuller</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => updateOrderStatus(true)}
              disabled={isProcessingStatusUpdate}
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              {isProcessingStatusUpdate ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Springer...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Ja, spring til status
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send Invoice Dialog */}
      <AlertDialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Faktura</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på, at du vil sende faktura for ordre <strong>{selectedOrder?.orderNumber}</strong>?
              Dette vil markere ordren som faktureret.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessingInvoice}>Annuller</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSendInvoice}
              disabled={isProcessingInvoice}
            >
              {isProcessingInvoice ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sender...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Faktura
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Invoice Dialog */}
      <AlertDialog open={bulkInvoiceDialogOpen} onOpenChange={setBulkInvoiceDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Bulk Fakturaer</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på, at du vil sende fakturaer for <strong>{selectedOrders.length}</strong> valgte ordrer?
              Dette vil markere alle ordrer som faktureret.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessingInvoice}>Annuller</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkSendInvoices}
              disabled={isProcessingInvoice}
            >
              {isProcessingInvoice ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sender...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send {selectedOrders.length} Fakturaer
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default DashboardOrders;
