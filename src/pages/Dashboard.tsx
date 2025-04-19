
import React from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StatCard from "@/components/dashboard/cards/StatCard";
import ChartCard from "@/components/dashboard/cards/ChartCard";
import PopularProductsCard from "@/components/dashboard/cards/PopularProductsCard";
import OrderStatusCard from "@/components/dashboard/cards/OrderStatusCard";
import RecentActivitiesCard from "@/components/dashboard/cards/RecentActivitiesCard";
import {
  dashboardStats,
  salesChartData,
  popularProducts,
  orderStatuses,
  recentActivities,
} from "@/components/dashboard/mockData";

const Dashboard: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Velkommen til dit admin dashboard. Her er overblikket over din virksomheds aktiviteter.
          </p>
        </div>

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
                className="h-full"
              />
            );
          })}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <ChartCard
            title="Omsætning denne uge"
            description="Daglig omsætning fordelt på ugedage"
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

        <div className="grid gap-6 md:grid-cols-2">
          <OrderStatusCard statuses={orderStatuses} />
          <RecentActivitiesCard activities={recentActivities} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
