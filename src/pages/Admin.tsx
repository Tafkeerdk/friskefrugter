import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { isAdmin } from '../lib/auth';
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StatCard from "@/components/dashboard/cards/StatCard";
import ChartCard from "@/components/dashboard/cards/ChartCard";
import PopularProductsCard from "@/components/dashboard/cards/PopularProductsCard";
import OrderStatusCard from "@/components/dashboard/cards/OrderStatusCard";
import RecentActivitiesCard from "@/components/dashboard/cards/RecentActivitiesCard";
import { AdminDashboard } from '../components/auth/AdminDashboard';
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useDashboardStatistics } from "../hooks/useDashboardStatistics";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const Admin: React.FC = () => {
  const { adminUser, isAdminAuthenticated } = useAuth();
  const isMobile = useIsMobile();
  const { statistics, loading, error, refetch } = useDashboardStatistics();

  // Enhanced security check - redirect if not authenticated or not admin
  if (!isAdminAuthenticated || !adminUser || !isAdmin(adminUser)) {
    return <Navigate to="/super/admin" replace />;
  }

  return (
    <DashboardLayout>
      <div className={cn(
        "space-y-6",
        isMobile ? "space-y-4" : "space-y-8"
      )}>
        {/* Mobile-Optimized Admin Header */}
        <div className={cn(
          "bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-lg",
          isMobile ? "p-4" : "p-6"
        )}>
          <div className={cn(
            "flex items-center justify-between",
            isMobile ? "flex-col space-y-3 text-center" : "flex-row"
          )}>
            <div className={cn(isMobile ? "w-full" : "")}>
              <h2 className={cn(
                "font-bold tracking-tight",
                isMobile ? "text-xl" : "text-3xl"
              )}>
                Administrator Dashboard
              </h2>
              <p className={cn(
                "text-blue-100 mt-1",
                isMobile ? "text-sm" : "text-base"
              )}>
                Velkommen {adminUser?.name || adminUser?.email || 'Administrator'}
              </p>
              {isMobile && (
                <p className="text-xs text-blue-200 mt-1">
                  Sikker admin adgang til B2B systemet
                </p>
              )}
            </div>
            <div className={cn(
              "text-sm text-blue-100",
              isMobile ? "w-full flex justify-between text-xs" : "text-right"
            )}>
              <div>
                <p>Rolle: {adminUser.role}</p>
                <p>Sikkerhedsniveau: Høj</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile-First Statistics Grid */}
        <div className={cn(
          "grid gap-4",
          isMobile 
            ? "grid-cols-1 sm:grid-cols-2" 
            : "grid-cols-2 lg:grid-cols-4"
        )}>
          {loading ? (
            // Loading skeleton for statistics
            Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-full border border-gray-200 rounded-lg p-4 animate-pulse",
                  isMobile ? "min-h-[120px]" : "min-h-[140px]"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                  <div className="h-8 w-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))
          ) : error ? (
            // Error state with retry button
            <div className="col-span-full">
              <div className="text-center p-8 bg-red-50 rounded-lg border border-red-200">
                <p className="text-red-600 mb-4">Fejl ved indlæsning af statistikker</p>
                <Button 
                  onClick={refetch} 
                  variant="outline" 
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Prøv igen
                </Button>
              </div>
            </div>
          ) : (
            // Actual statistics data
            statistics?.dashboardStats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <StatCard
                  key={index}
                  title={stat.title}
                  value={stat.value}
                  description={stat.description}
                  icon={<IconComponent className={cn(isMobile ? "h-4 w-4" : "h-5 w-5")} />}
                  trend={stat.trend}
                  className={cn(
                    "h-full border-l-4 border-l-blue-500 hover:shadow-md transition-shadow",
                    isMobile ? "min-h-[120px]" : ""
                  )}
                />
              );
            })
          )}
        </div>

        {/* Mobile-Optimized B2B Application Management */}
        <div className={cn(
          "bg-white rounded-lg shadow-sm border",
          isMobile ? "p-4" : "p-6"
        )}>
          <h3 className={cn(
            "font-semibold mb-4 text-gray-900",
            isMobile ? "text-lg" : "text-xl"
          )}>
            {isMobile ? "B2B Ansøgninger" : "B2B Ansøgningshåndtering"}
          </h3>
          <AdminDashboard />
        </div>

        {/* Mobile-First Analytics Layout */}
        <div className={cn(
          "grid gap-6",
          isMobile 
            ? "grid-cols-1" 
            : "md:grid-cols-2 lg:grid-cols-7"
        )}>
          {loading ? (
            <>
              {/* Chart skeleton */}
              <div className={cn(
                "bg-white rounded-lg border p-6 animate-pulse",
                isMobile ? "" : "lg:col-span-4"
              )}>
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
              {/* Products skeleton */}
              <div className={cn(
                "bg-white rounded-lg border p-6 animate-pulse",
                isMobile ? "mt-0" : "lg:col-span-3"
              )}>
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-gray-200 rounded"></div>
                      <div className="flex-1 space-y-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <ChartCard
                title={isMobile ? "B2B Omsætning" : "B2B Omsætning denne uge"}
                description={isMobile ? "Daglig omsætning" : "Daglig B2B omsætning fordelt på ugedage"}
                data={statistics?.salesChartData || []}
                type="line"
                dataKey="sales"
                className={cn(isMobile ? "" : "lg:col-span-4")}
              />
              <PopularProductsCard
                products={statistics?.popularProducts || []}
                className={cn(isMobile ? "mt-0" : "lg:col-span-3")}
              />
            </>
          )}
        </div>

        {/* Mobile-Stacked Order Management */}
        <div className={cn(
          "grid gap-6",
          isMobile ? "grid-cols-1" : "md:grid-cols-2"
        )}>
          {loading ? (
            <>
              {/* Order status skeleton */}
              <div className="bg-white rounded-lg border p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-6 bg-gray-200 rounded w-8"></div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Activities skeleton */}
              <div className="bg-white rounded-lg border p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-start space-x-3">
                      <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <OrderStatusCard statuses={statistics?.orderStatuses || []} />
              <RecentActivitiesCard activities={statistics?.recentActivities || []} />
            </>
          )}
        </div>

        {/* Mobile-Friendly Security Footer */}
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
              🔒 {isMobile ? "Sikret session" : "Sikret admin session - Alle handlinger logges"}
            </span>
            {!isMobile && (
              <span>Netlify Compatible • Enterprise Grade Security</span>
            )}
            {isMobile && (
              <span className="text-xs text-gray-500">
                Netlify Compatible • Enterprise Security
              </span>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Admin; 