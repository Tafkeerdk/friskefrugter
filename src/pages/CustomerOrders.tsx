import React, { useState } from "react";
import { Package, Calendar, Eye, Truck, CheckCircle, Clock, Receipt } from "lucide-react";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useOrders } from "@/hooks/useOrders";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

const CustomerOrders: React.FC = () => {
  const { user } = useAuth();
  const { 
    orders,
    ordersPagination,
    isLoadingOrders,
    ordersError,
    loadOrders
  } = useOrders();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Log ind for at se dine ordrer</h2>
            <p className="text-gray-600 mb-6">Du skal være logget ind for at se din ordrehistorik.</p>
            <Link to="/login">
              <Button>Log ind</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'order_placed':
        return 'Afgivet';
      case 'order_confirmed':
        return 'Bekræftet';
      case 'in_transit':
        return 'Pakket';
      case 'delivered':
        return 'Leveret';
      case 'invoiced':
        return 'Faktureret';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('da-DK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter orders based on search and status
  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchTerm || 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some(item => 
        item.productSnapshot.produktnavn.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (isLoadingOrders) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto mb-4"></div>
            <p className="text-brand-gray-600">Henter dine ordrer...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-50">
        <div className="page-container py-6 md:py-8 space-y-6 md:space-y-8">
          {/* Header */}
          <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Mine Ordrer
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              Se dine ordrer og følg deres status
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input 
                placeholder="Søg i ordrer..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle status" />
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
            </div>
          </div>

          {ordersError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{ordersError}</AlertDescription>
            </Alert>
          )}

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-16">
                <div className="text-center">
                  <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm || statusFilter !== 'all' ? 'Ingen ordrer matchede søgningen' : 'Ingen ordrer endnu'}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Prøv at ændre dine søgekriterier'
                      : 'Du har ikke afgivet nogen ordrer endnu'
                    }
                  </p>
                  {!searchTerm && statusFilter === 'all' && (
                    <Link to="/products">
                      <Button>
                        <Package className="mr-2 h-4 w-4" />
                        Se produkter
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card key={order._id} className="overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg font-semibold">
                          Ordre {order.orderNumber}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(order.placedAt)}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={getStatusVariant(order.status)}
                          className="gap-1 px-3 py-1"
                        >
                          {getStatusIcon(order.status)}
                          {getStatusDisplay(order.status)}
                        </Badge>
                        <div className="text-right">
                          <div className="font-semibold text-lg">
                            {order.orderTotals.totalAmount.toLocaleString('da-DK')} kr
                          </div>
                          {order.orderTotals.totalSavings > 0 && (
                            <div className="text-sm text-green-600">
                              Du sparede {order.orderTotals.totalSavings.toLocaleString('da-DK')} kr
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    {/* Order Items Preview */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-gray-700">
                        Ordreindhold ({order.orderTotals.totalItems} {order.orderTotals.totalItems === 1 ? 'produkt' : 'produkter'})
                      </h4>
                      <div className="grid gap-2">
                        {order.items.slice(0, 3).map((item, index) => (
                          <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {item.productSnapshot.produktnavn}
                              </p>
                              <p className="text-xs text-gray-500">
                                {item.quantity} {item.productSnapshot.enhed?.label || 'stk'} × {item.staticPricing.price.toLocaleString('da-DK')} kr
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-sm">
                                {item.itemTotal.toLocaleString('da-DK')} kr
                              </p>
                              {item.itemSavings > 0 && (
                                <p className="text-xs text-green-600">
                                  -{item.itemSavings.toLocaleString('da-DK')} kr
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {order.items.length > 3 && (
                          <div className="text-center py-2">
                            <p className="text-sm text-gray-500">
                              ... og {order.items.length - 3} flere produkter
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Status Timeline */}
                    <div className="mt-6 pt-4 border-t">
                      <h4 className="font-medium text-sm text-gray-700 mb-3">Ordrestatus</h4>
                      <div className="space-y-2">
                        {order.statusHistory.map((status, index) => (
                          <div key={index} className="flex items-center gap-3 text-sm">
                            <div className="flex-shrink-0">
                              {getStatusIcon(status.status)}
                            </div>
                            <div className="flex-1">
                              <span className="font-medium">{getStatusDisplay(status.status)}</span>
                              {status.notes && (
                                <span className="text-gray-500 ml-2">- {status.notes}</span>
                              )}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {new Date(status.timestamp).toLocaleDateString('da-DK', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Actions */}
                    <div className="mt-6 pt-4 border-t flex flex-col sm:flex-row gap-3">
                      <Button variant="outline" className="flex-1 sm:flex-none gap-2">
                        <Eye className="h-4 w-4" />
                        Se fulde detaljer
                      </Button>
                      
                      {order.delivery.courierInfo?.trackingUrl && (
                        <Button variant="outline" className="flex-1 sm:flex-none gap-2">
                          <Truck className="h-4 w-4" />
                          Følg forsendelse
                        </Button>
                      )}
                      
                      {order.invoice.isInvoiced && order.invoice.invoiceUrl && (
                        <Button variant="outline" className="flex-1 sm:flex-none gap-2">
                          <Receipt className="h-4 w-4" />
                          Se faktura
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {ordersPagination && ordersPagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button 
                variant="outline" 
                disabled={ordersPagination.currentPage === 1}
                onClick={() => loadOrders({ 
                  page: ordersPagination.currentPage - 1, 
                  limit: ordersPagination.limit 
                })}
              >
                Forrige
              </Button>
              <span className="px-4 py-2 text-sm text-gray-600">
                Side {ordersPagination.currentPage} af {ordersPagination.totalPages}
              </span>
              <Button 
                variant="outline" 
                disabled={ordersPagination.currentPage === ordersPagination.totalPages}
                onClick={() => loadOrders({ 
                  page: ordersPagination.currentPage + 1, 
                  limit: ordersPagination.limit 
                })}
              >
                Næste
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CustomerOrders; 