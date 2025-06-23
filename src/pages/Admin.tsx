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
import {
  dashboardStats,
  salesChartData,
  popularProducts,
  orderStatuses,
  recentActivities,
} from "@/components/dashboard/mockData";

const Admin: React.FC = () => {
  const { adminUser, isAdminAuthenticated } = useAuth();

  // Enhanced security check - redirect if not authenticated or not admin
  if (!isAdminAuthenticated || !adminUser || !isAdmin(adminUser)) {
    return <Navigate to="/super/admin" replace />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Admin Header with Security Notice */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Administrator Dashboard</h2>
              <p className="text-blue-100 mt-1">
                Velkommen {adminUser.name || adminUser.email} - Sikker admin adgang til B2B systemet
              </p>
            </div>
            <div className="text-right text-sm text-blue-100">
              <p>Rolle: {adminUser.role}</p>
              <p>Sikkerhedsniveau: Høj</p>
            </div>
          </div>
        </div>

        {/* Admin Statistics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {dashboardStats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <StatCard
                key={index}
                title={stat.title}
                value={stat.value}
                description={stat.description}
                icon={<IconComponent className="h-5 w-5" />}
                trend={stat.trend}
                className="h-full border-l-4 border-l-blue-500"
              />
            );
          })}
        </div>

        {/* B2B Application Management */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-xl font-semibold mb-4 text-gray-900">B2B Ansøgningshåndtering</h3>
          <AdminDashboard />
        </div>

        {/* Analytics and Charts */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <ChartCard
            title="B2B Omsætning denne uge"
            description="Daglig B2B omsætning fordelt på ugedage"
            data={salesChartData}
            type="line"
            dataKey="sales"
            className="lg:col-span-4"
          />
          <PopularProductsCard
            products={popularProducts}
            className="lg:col-span-3"
          />
        </div>

        {/* Order Management and Activities */}
        <div className="grid gap-6 md:grid-cols-2">
          <OrderStatusCard statuses={orderStatuses} />
          <RecentActivitiesCard activities={recentActivities} />
        </div>

        {/* Security Footer */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>🔒 Sikret admin session - Alle handlinger logges</span>
            <span>Netlify Compatible • Enterprise Grade Security</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Admin; 