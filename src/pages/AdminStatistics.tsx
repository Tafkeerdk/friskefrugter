import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { isAdmin } from '../lib/auth';
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CalendarDays,
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingCart, 
  DollarSign,
  Package,
  Loader2,
  RefreshCw,
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react";
import { authService } from '../lib/auth';
import { toast } from '../hooks/use-toast';

// Types for detailed statistics
interface DetailedStatistics {
  period: string;
  startDate: string;
  endDate: string;
  overview: {
    totalRevenue: number;
    revenueGrowth: number;
    totalOrders: number;
    orderGrowth: number;
    newCustomers: number;
    customerGrowth: number;
    averageOrderValue: number;
    totalSavings: number;
  };
  orders: {
    byStatus: Array<{
      status: string;
      count: number;
      revenue: number;
      percentage: number;
    }>;
    total: number;
  };
  revenue: {
    current: number;
    previous: number;
    growth: number;
    byDiscountGroup: Array<{
      _id: string;
      revenue: number;
      orders: number;
      averageOrderValue: number;
    }>;
  };
  customers: {
    new: number;
    total: number;
    active: number;
    byDiscountGroup: Array<{
      _id: string;
      count: number;
    }>;
  };
  products: {
    totalProducts: number;
    activeProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
  };
  topProducts: Array<{
    id: string;
    name: string;
    quantitySold: number;
    revenue: number;
    timesOrdered: number;
    averageQuantityPerOrder: number;
  }>;
  salesChart: Array<{
    name: string;
    sales: number;
    orders: number;
    date?: string;
  }>;
}

// Format currency helper
const formatCurrency = (amount: number) => {
  return `${Math.round(amount).toLocaleString('da-DK')} kr`;
};

// Growth indicator component
const GrowthIndicator: React.FC<{ value: number; size?: "sm" | "md" | "lg" }> = ({ 
  value, 
  size = "md" 
}) => {
  const isPositive = value >= 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  const colorClass = isPositive ? "text-green-600" : "text-red-600";
  const bgClass = isPositive ? "bg-green-50" : "bg-red-50";
  
  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-base px-3 py-1.5"
  };
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        `${colorClass} ${bgClass} border-current font-medium`,
        sizeClasses[size]
      )}
    >
      <Icon className={cn("mr-1", size === "sm" ? "h-3 w-3" : "h-4 w-4")} />
      {isPositive ? "+" : ""}{value}%
    </Badge>
  );
};

// Statistics card component
const StatisticsCard: React.FC<{
  title: string;
  value: string | number;
  description?: string;
  growth?: number;
  icon: React.ReactNode;
  className?: string;
}> = ({ title, value, description, growth, icon, className }) => {
  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <div className="h-8 w-8 text-blue-600">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900 mb-1">
          {typeof value === 'number' ? formatCurrency(value) : value}
        </div>
        <div className="flex items-center justify-between">
          {description && (
            <p className="text-xs text-gray-500 flex-1">
              {description}
            </p>
          )}
          {typeof growth === 'number' && (
            <GrowthIndicator value={growth} size="sm" />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const AdminStatistics: React.FC = () => {
  const { adminUser, isAdminAuthenticated } = useAuth();
  const isMobile = useIsMobile();
  const [statistics, setStatistics] = useState<DetailedStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'year'>('month');

  // Enhanced security check
  if (!isAdminAuthenticated || !adminUser || !isAdmin(adminUser)) {
    return <Navigate to="/super/admin" replace />;
  }

  // Fetch detailed statistics
  const fetchDetailedStatistics = async (period: 'today' | 'week' | 'month' | 'year') => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authService.getDetailedStatistics(period);
      
      if (response.success && response.statistics) {
        setStatistics(response.statistics);
      } else {
        throw new Error(response.message || 'Kunne ikke hente detaljerede statistikker');
      }
    } catch (error: any) {
      console.error('Error fetching detailed statistics:', error);
      setError(error.message || 'Fejl ved indlæsning af statistikker');
      toast({
        title: "Fejl",
        description: "Kunne ikke indlæse statistikker. Prøv igen.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load statistics on component mount and period change
  React.useEffect(() => {
    fetchDetailedStatistics(selectedPeriod);
  }, [selectedPeriod]);

  // Period display names
  const periodDisplayNames = {
    today: 'I dag',
    week: 'Denne uge',
    month: 'Denne måned',
    year: 'Dette år'
  };

  return (
    <DashboardLayout>
      <div className={cn("space-y-6", isMobile ? "space-y-4" : "space-y-8")}>
        
        {/* Header with period selector */}
        <div className={cn(
          "bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-lg shadow-lg",
          isMobile ? "p-4" : "p-6"
        )}>
          <div className={cn(
            "flex justify-between items-start",
            isMobile ? "flex-col space-y-4" : "flex-row items-center"
          )}>
            <div>
              <h1 className={cn(
                "font-bold tracking-tight",
                isMobile ? "text-xl" : "text-3xl"
              )}>
                Detaljerede Statistikker
              </h1>
              <p className={cn(
                "text-indigo-100 mt-1",
                isMobile ? "text-sm" : "text-base"
              )}>
                Omfattende analyse af B2B handelsdata
              </p>
            </div>
            
            <div className={cn(
              "flex items-center gap-2",
              isMobile ? "w-full" : ""
            )}>
              <div className="flex bg-white/10 rounded-lg p-1">
                {(['today', 'week', 'month', 'year'] as const).map((period) => (
                  <Button
                    key={period}
                    variant={selectedPeriod === period ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedPeriod(period)}
                    className={cn(
                      "text-white border-none",
                      selectedPeriod === period
                        ? "bg-white text-indigo-600 shadow"
                        : "hover:bg-white/20"
                    )}
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    {periodDisplayNames[period]}
                  </Button>
                ))}
              </div>
              
              <Button 
                onClick={() => fetchDetailedStatistics(selectedPeriod)} 
                variant="outline"
                size="sm"
                disabled={loading}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-600" />
              <p className="text-gray-600">Indlæser statistikker...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center p-8 bg-red-50 rounded-lg border border-red-200">
            <p className="text-red-600 mb-4">{error}</p>
            <Button 
              onClick={() => fetchDetailedStatistics(selectedPeriod)} 
              variant="outline" 
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Prøv igen
            </Button>
          </div>
        )}

        {/* Statistics Content */}
        {statistics && !loading && (
          <>
            {/* Overview Cards */}
            <div className={cn(
              "grid gap-4",
              isMobile 
                ? "grid-cols-1 sm:grid-cols-2" 
                : "grid-cols-2 lg:grid-cols-4"
            )}>
              <StatisticsCard
                title="Samlet Omsætning"
                value={statistics.overview.totalRevenue}
                description={`${periodDisplayNames[selectedPeriod].toLowerCase()}`}
                growth={statistics.overview.revenueGrowth}
                icon={<DollarSign className="h-6 w-6" />}
              />
              <StatisticsCard
                title="Totale Ordrer"
                value={statistics.overview.totalOrders}
                description={`${periodDisplayNames[selectedPeriod].toLowerCase()}`}
                growth={statistics.overview.orderGrowth}
                icon={<ShoppingCart className="h-6 w-6" />}
              />
              <StatisticsCard
                title="Nye Kunder"
                value={statistics.overview.newCustomers}
                description={`${periodDisplayNames[selectedPeriod].toLowerCase()}`}
                growth={statistics.overview.customerGrowth}
                icon={<Users className="h-6 w-6" />}
              />
              <StatisticsCard
                title="Gennemsnitlig Ordreværdi"
                value={statistics.overview.averageOrderValue}
                description="Per ordre"
                icon={<BarChart3 className="h-6 w-6" />}
              />
            </div>

            {/* Detailed Analytics Tabs */}
            <Tabs defaultValue="orders" className="space-y-6">
              <TabsList className={cn(
                "grid w-full",
                isMobile ? "grid-cols-2" : "grid-cols-4"
              )}>
                <TabsTrigger value="orders" className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Ordrer
                </TabsTrigger>
                <TabsTrigger value="revenue" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Omsætning
                </TabsTrigger>
                <TabsTrigger value="products" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Produkter
                </TabsTrigger>
                <TabsTrigger value="customers" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Kunder
                </TabsTrigger>
              </TabsList>

              {/* Orders Tab */}
              <TabsContent value="orders" className="space-y-6">
                <div className={cn(
                  "grid gap-6",
                  isMobile ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
                )}>
                  {/* Order Status Breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PieChart className="h-5 w-5" />
                        Ordrestatus Fordeling
                      </CardTitle>
                      <CardDescription>
                        Status for ordrer {periodDisplayNames[selectedPeriod].toLowerCase()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {statistics.orders.byStatus.map((status, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{status.status}</div>
                              <div className="text-sm text-gray-500">
                                {formatCurrency(status.revenue)} • {status.percentage}% af alle ordrer
                              </div>
                            </div>
                            <Badge variant="outline" className="ml-2">
                              {status.count}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Sales Chart Preview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Salgsudvikling
                      </CardTitle>
                      <CardDescription>
                        Daglig/månedlig salgstrend
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8 text-gray-500">
                        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>Salgsgraf kommer snart</p>
                        <p className="text-sm">
                          {statistics.salesChart.length} datapunkter tilgængelige
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Revenue Tab */}
              <TabsContent value="revenue" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Omsætning efter Rabatgruppe</CardTitle>
                    <CardDescription>
                      Fordeling af omsætning på forskellige kundegrupper
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {statistics.revenue.byDiscountGroup.map((group, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {group._id || 'Standard rabatgruppe'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {group.orders} ordrer • Gennemsnit: {formatCurrency(group.averageOrderValue)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg text-gray-900">
                              {formatCurrency(group.revenue)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Products Tab */}
              <TabsContent value="products" className="space-y-6">
                <div className={cn(
                  "grid gap-6",
                  isMobile ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
                )}>
                  {/* Product Overview */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Produktoversigt</CardTitle>
                      <CardDescription>Status på produktlageret</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {statistics.products.activeProducts}
                          </div>
                          <div className="text-sm text-green-700">Aktive produkter</div>
                        </div>
                        <div className="text-center p-4 bg-yellow-50 rounded-lg">
                          <div className="text-2xl font-bold text-yellow-600">
                            {statistics.products.lowStockProducts}
                          </div>
                          <div className="text-sm text-yellow-700">Lavt lager</div>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded-lg">
                          <div className="text-2xl font-bold text-red-600">
                            {statistics.products.outOfStockProducts}
                          </div>
                          <div className="text-sm text-red-700">Udsolgt</div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {statistics.products.totalProducts}
                          </div>
                          <div className="text-sm text-blue-700">Total produkter</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top Products */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Sælgende Produkter</CardTitle>
                      <CardDescription>
                        Mest populære produkter {periodDisplayNames[selectedPeriod].toLowerCase()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {statistics.topProducts.slice(0, 5).map((product, index) => (
                          <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                                {index + 1}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 truncate max-w-40">
                                  {product.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {product.quantitySold} stk • {product.timesOrdered} ordrer
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-gray-900">
                                {formatCurrency(product.revenue)}
                              </div>
                              <div className="text-xs text-gray-500">
                                ⌀ {product.averageQuantityPerOrder} stk/ordre
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Customers Tab */}
              <TabsContent value="customers" className="space-y-6">
                <div className={cn(
                  "grid gap-6",
                  isMobile ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
                )}>
                  {/* Customer Overview */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Kundeoversigt</CardTitle>
                      <CardDescription>Kundestatistik og aktivitet</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                          <span className="font-medium text-green-800">Nye kunder {periodDisplayNames[selectedPeriod].toLowerCase()}</span>
                          <Badge className="bg-green-100 text-green-800">{statistics.customers.new}</Badge>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                          <span className="font-medium text-blue-800">Aktive kunder</span>
                          <Badge className="bg-blue-100 text-blue-800">{statistics.customers.active}</Badge>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium text-gray-800">Total kunder</span>
                          <Badge variant="outline">{statistics.customers.total}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Customer Groups */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Nye Kunder efter Rabatgruppe</CardTitle>
                      <CardDescription>
                        Fordeling af nye kundetilmeldinger {periodDisplayNames[selectedPeriod].toLowerCase()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {statistics.customers.byDiscountGroup.length > 0 ? (
                          statistics.customers.byDiscountGroup.map((group, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <span className="font-medium text-gray-900">
                                {group._id || 'Standard gruppe'}
                              </span>
                              <Badge variant="outline">{group.count}</Badge>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p>Ingen nye kunder {periodDisplayNames[selectedPeriod].toLowerCase()}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}

        {/* Footer */}
        <div className={cn(
          "bg-gray-50 rounded-lg border border-gray-200",
          isMobile ? "p-3" : "p-4"
        )}>
          <div className={cn(
            "text-gray-600",
            isMobile 
              ? "text-xs space-y-1 text-center" 
              : "flex items-center justify-between text-sm"
          )}>
            <span className="flex items-center justify-center">
              📊 {isMobile ? "Avancerede statistikker" : "Avancerede B2B statistikker - Realtid data fra backend"}
            </span>
            {!isMobile && (
              <span>Periode: {periodDisplayNames[selectedPeriod]} • Opdateret live</span>
            )}
            {isMobile && (
              <span className="text-xs text-gray-500">
                {periodDisplayNames[selectedPeriod]} • Live data
              </span>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminStatistics; 