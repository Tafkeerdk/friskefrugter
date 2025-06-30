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
  Plus
} from "lucide-react";
import { useLocation } from "react-router-dom";
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
import { useAuth } from "@/hooks/useAuth";
import { useOrders } from "@/hooks/useOrders";
import { useToast } from "@/hooks/use-toast";
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

const DashboardOrders: React.FC = () => {
  const location = useLocation();
  const { user, isAdminAuthenticated } = useAuth();
  const { toast } = useToast();
  
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
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [bulkInvoiceDialogOpen, setBulkInvoiceDialogOpen] = useState(false);
  const [isProcessingInvoice, setIsProcessingInvoice] = useState(false);

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

  // Parse order number to extract readable components
  const parseOrderNumber = (orderNum: string) => {
    // Format: YYYYMMDD-HHMMSS-customerId-###
    const parts = orderNum.split('-');
    if (parts.length >= 4) {
      const datePart = parts[0]; // YYYYMMDD
      const timePart = parts[1]; // HHMMSS
      const sequencePart = parts[parts.length - 1]; // ###
      
      // Parse date
      const year = datePart.substring(0, 4);
      const month = datePart.substring(4, 6);
      const day = datePart.substring(6, 8);
      
      // Parse time
      const hours = timePart.substring(0, 2);
      const minutes = timePart.substring(2, 4);
      
      return {
        shortDate: `${day}/${month}/${year}`,
        time: `${hours}:${minutes}`,
        sequence: sequencePart,
        fullOrderNumber: orderNum
      };
    }
    
    return {
      shortDate: null,
      time: null,
      sequence: null,
      fullOrderNumber: orderNum
    };
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Henter ordrer...</p>
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
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
              {isAdminContext ? 'Ordrer' : 'Mine Ordrer'}
            </h2>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              {isAdminContext 
                ? 'Administrer og følg kunders ordrer med faktura funktionalitet'
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
          <Button variant="outline" className="gap-1">
            <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Eksporter</span>
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
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">
                    {searchTerm ? 'Ingen ordrer matchede søgningen' : 'Ingen ordrer fundet'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchTerm ? 'Prøv at ændre dine søgekriterier' : 
                     isAdminContext ? 'Der er ingen ordrer endnu' : 'Du har ikke afgivet nogen ordrer endnu'}
                  </p>
            </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Desktop Table View */}
              <Card className="hidden md:block">
          <CardContent className="p-0">
            <div className="rounded-md">
                    <div className="grid grid-cols-7 items-center border-b px-4 py-3 font-medium text-sm">
                      {isAdminContext && (
                        <div className="flex items-center">
                          <Checkbox 
                            checked={selectedOrders.length === displayOrders.length}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedOrders(displayOrders.map(o => o._id));
                              } else {
                                setSelectedOrders([]);
                              }
                            }}
                          />
                        </div>
                      )}
                      <div className={isAdminContext ? 'col-span-1' : 'col-span-2'}>Ordrenr.</div>
                      {isAdminContext && <div>Kunde</div>}
                <div>Dato</div>
                <div>Status</div>
                <div>Beløb</div>
                <div className="text-right">Handlinger</div>
              </div>
                    
                    {displayOrders.map((order) => (
                <div
                        key={order._id}
                        className="grid grid-cols-7 items-center border-b px-4 py-4 last:border-0 hover:bg-muted/50 transition-colors"
                >
                        {isAdminContext && (
                          <div className="flex items-center">
                            <Checkbox 
                              checked={selectedOrders.includes(order._id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedOrders(prev => [...prev, order._id]);
                                } else {
                                  setSelectedOrders(prev => prev.filter(id => id !== order._id));
                                }
                              }}
                            />
                          </div>
                        )}
                        
                        <div className={isAdminContext ? 'col-span-1' : 'col-span-2'}>
                          <div className="font-medium text-sm">
                            #{parseOrderNumber(order.orderNumber).sequence}
                          </div>
                          <div className="font-mono text-xs text-brand-primary break-all">
                            {order.orderNumber}
                          </div>
                  </div>
                        
                        {isAdminContext && (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {getInitials(order.customer.companyName)}
                      </AvatarFallback>
                    </Avatar>
                            <div className="min-w-0">
                              <div className="font-medium truncate">{order.customer.companyName}</div>
                              <div className="text-xs text-muted-foreground truncate">{order.customer.contactPersonName}</div>
                            </div>
                  </div>
                        )}
                        
                        <div className="text-sm">{formatDate(order.placedAt)}</div>
                        
                  <div>
                    <Badge
                      variant={getStatusVariant(order.status)}
                            className="rounded-full px-2.5 gap-1"
                    >
                            {getStatusIcon(order.statusDisplay)}
                            {order.statusDisplay}
                    </Badge>
                  </div>
                        
                        <div className="font-medium">
                          {order.totalAmount.toLocaleString('da-DK')} kr
                        </div>
                        
                  <div className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Handlinger</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Handlinger</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                Se detaljer
                              </DropdownMenuItem>
                              
                              {isAdminContext && (
                                <>
                                  <DropdownMenuItem>Opdater status</DropdownMenuItem>
                                  {!order.isInvoiced && ['order_confirmed', 'in_transit', 'delivered'].includes(order.status) && (
                                    <DropdownMenuItem 
                                      onClick={() => {
                                        setSelectedOrder(order);
                                        setInvoiceDialogOpen(true);
                                      }}
                                    >
                                      <Send className="h-4 w-4 mr-2" />
                                      Send Faktura
                                    </DropdownMenuItem>
                                  )}
                                  {order.isInvoiced && (
                                    <DropdownMenuItem>
                                      <Receipt className="h-4 w-4 mr-2" />
                                      Se faktura #{order.invoiceNumber}
                        </DropdownMenuItem>
                                  )}
                                </>
                              )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

              {/* Mobile Card View */}
              <div className="grid gap-4 md:hidden">
                {displayOrders.map((order) => (
                  <Card key={order._id}>
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="min-w-0">
                            <div className="font-medium text-sm">
                              #{parseOrderNumber(order.orderNumber).sequence}
                            </div>
                            <div className="font-mono text-xs text-brand-primary break-all">
                              {order.orderNumber}
                            </div>
                          </div>
                          <Badge
                            variant={getStatusVariant(order.status)}
                            className="rounded-full px-2 gap-1 text-xs flex-shrink-0"
                          >
                            {getStatusIcon(order.statusDisplay)}
                            {order.statusDisplay}
                          </Badge>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Se detaljer</DropdownMenuItem>
                            {isAdminContext && !order.isInvoiced && (
                              <DropdownMenuItem 
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setInvoiceDialogOpen(true);
                                }}
                              >
                                Send Faktura
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="space-y-2">
                        {isAdminContext && (
                          <div className="flex items-center gap-2 text-sm">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {getInitials(order.customer.companyName)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{order.customer.companyName}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(order.placedAt)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-lg">
                            {order.totalAmount.toLocaleString('da-DK')} kr
                          </span>
                          {order.isInvoiced && (
                            <Badge variant="outline">
                              <Receipt className="h-3 w-3 mr-1" />
                              #{order.invoiceNumber}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

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
