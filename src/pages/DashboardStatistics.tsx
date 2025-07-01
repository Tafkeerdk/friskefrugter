
import React, { useState, useEffect } from "react";
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { isAdmin } from '../lib/auth';
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ChartCard from "@/components/dashboard/cards/ChartCard";
import StatCard from "@/components/dashboard/cards/StatCard";
import { BarChart3, TrendingUp, ShoppingBag, Users, Loader2, RefreshCw, Activity } from "lucide-react";
import { authService } from '../lib/auth';
import { toast } from '../hooks/use-toast';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
    totalVisitors?: number;
    visitorGrowth?: number;
    newVisitors?: number;
    totalPageViews?: number;
  };
  salesChart: Array<{
    name: string;
    sales: number;
    orders: number;
    date?: string;
  }>;
  visitors?: {
    monthlyChart: Array<{
      month: string;
      visitors: number;
      pageViews: number;
      newVisitors: number;
    }>;
  };
}

// Format currency helper
const formatCurrency = (amount: number) => {
  if (amount === 0) return '0 kr';
  return `${Math.round(amount).toLocaleString('da-DK')} kr`;
};

const DashboardStatistics: React.FC = () => {
  const { adminUser, isAdminAuthenticated } = useAuth();
  const [statistics, setStatistics] = useState<DetailedStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Enhanced security check
  if (!isAdminAuthenticated || !adminUser || !isAdmin(adminUser)) {
    return <Navigate to="/super/admin" replace />;
  }

  // Fetch detailed statistics for current month
  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authService.getDetailedStatistics('month');
      
      if (response.success && response.statistics) {
        setStatistics(response.statistics);
      } else {
        throw new Error(response.message || 'Kunne ikke hente statistikker');
      }
    } catch (error: any) {
      console.error('Error fetching statistics:', error);
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

  // Load statistics on component mount
  useEffect(() => {
    fetchStatistics();
  }, []);

  // Loading state
  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Statistik</h2>
            <p className="text-muted-foreground">
              Overblik over salg og brugeraktivitet.
            </p>
          </div>
          
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Indlæser statistikker...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error && !statistics) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Statistik</h2>
              <p className="text-muted-foreground">
                Overblik over salg og brugeraktivitet.
              </p>
            </div>
            <Button onClick={fetchStatistics} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Prøv igen
            </Button>
          </div>
          
          <div className="text-center p-8 bg-red-50 rounded-lg border border-red-200">
            <p className="text-red-600 mb-4">{error}</p>
            <Button 
              onClick={fetchStatistics} 
              variant="outline" 
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Genindlæs
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Statistik</h2>
            <p className="text-muted-foreground">
              Overblik over salg og brugeraktivitet.
            </p>
          </div>
          <Button onClick={fetchStatistics} variant="outline" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>

        {statistics && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Omsætning"
                value={formatCurrency(statistics.overview.totalRevenue)}
                trend={{ 
                  value: Math.abs(statistics.overview.revenueGrowth), 
                  isPositive: statistics.overview.revenueGrowth >= 0 
                }}
                icon={<BarChart3 className="h-4 w-4" />}
                description="Denne måned"
              />
              <StatCard
                title="Salg i dag"
                value={statistics.overview.totalOrders.toString()}
                trend={{ 
                  value: Math.abs(statistics.overview.orderGrowth), 
                  isPositive: statistics.overview.orderGrowth >= 0 
                }}
                icon={<TrendingUp className="h-4 w-4" />}
                description="Ordrer denne måned"
              />
              <StatCard
                title="Besøgende"
                value={(statistics.overview.totalVisitors || 0).toString()}
                trend={{ 
                  value: Math.abs(statistics.overview.visitorGrowth || 0), 
                  isPositive: (statistics.overview.visitorGrowth || 0) >= 0 
                }}
                icon={<Activity className="h-4 w-4" />}
                description="Besøgende denne måned"
              />
              <StatCard
                title="Nye kunder"
                value={statistics.overview.newCustomers.toString()}
                trend={{ 
                  value: Math.abs(statistics.overview.customerGrowth), 
                  isPositive: statistics.overview.customerGrowth >= 0 
                }}
                icon={<Users className="h-4 w-4" />}
                description="Nye kunder denne måned"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <ChartCard
                title="Omsætning"
                description="Månedlig omsætning"
                data={statistics.salesChart.map(item => ({
                  name: item.name,
                  revenue: item.sales
                }))}
                type="bar"
                dataKey="revenue"
              />
              <ChartCard
                title="Besøgende"
                description="Månedlige besøgende"
                data={statistics.visitors?.monthlyChart || []}
                type="line"
                dataKey="visitors"
              />
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardStatistics;
