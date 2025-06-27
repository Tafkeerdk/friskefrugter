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
import {
  dashboardStats,
  salesChartData,
  popularProducts,
  orderStatuses,
  recentActivities,
} from "@/components/dashboard/mockData";

const Admin: React.FC = () => {
  const { adminUser, isAdminAuthenticated } = useAuth();
  const isMobile = useIsMobile();

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
          {dashboardStats.map((stat, index) => {
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
          })}
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
          <ChartCard
            title={isMobile ? "B2B Omsætning" : "B2B Omsætning denne uge"}
            description={isMobile ? "Daglig omsætning" : "Daglig B2B omsætning fordelt på ugedage"}
            data={salesChartData}
            type="line"
            dataKey="sales"
            className={cn(isMobile ? "" : "lg:col-span-4")}
          />
          <PopularProductsCard
            products={popularProducts}
            className={cn(isMobile ? "mt-0" : "lg:col-span-3")}
          />
        </div>

        {/* Mobile-Stacked Order Management */}
        <div className={cn(
          "grid gap-6",
          isMobile ? "grid-cols-1" : "md:grid-cols-2"
        )}>
          <OrderStatusCard statuses={orderStatuses} />
          <RecentActivitiesCard activities={recentActivities} />
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