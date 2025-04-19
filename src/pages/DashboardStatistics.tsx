
import React from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ChartCard from "@/components/dashboard/cards/ChartCard";
import StatCard from "@/components/dashboard/cards/StatCard";
import { BarChart3, TrendingUp, ShoppingBag, Users } from "lucide-react";

const DashboardStatistics: React.FC = () => {
  const revenueData = [
    { name: "Jan", revenue: 4000 },
    { name: "Feb", revenue: 3000 },
    { name: "Mar", revenue: 5000 },
    { name: "Apr", revenue: 7000 },
    { name: "Maj", revenue: 6000 },
    { name: "Jun", revenue: 8000 },
  ];

  const visitorData = [
    { name: "Jan", visitors: 1500 },
    { name: "Feb", visitors: 2300 },
    { name: "Mar", visitors: 3200 },
    { name: "Apr", visitors: 2800 },
    { name: "Maj", visitors: 3800 },
    { name: "Jun", visitors: 4200 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Statistik</h2>
          <p className="text-muted-foreground">
            Overblik over salg og brugeraktivitet.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Omsætning"
            value="128.500 kr"
            trend={{ value: 12, isPositive: true }}
            icon={<BarChart3 className="h-4 w-4" />}
          />
          <StatCard
            title="Salg i dag"
            value="24"
            trend={{ value: 8, isPositive: true }}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <StatCard
            title="Produkter solgt"
            value="145"
            trend={{ value: 5, isPositive: true }}
            icon={<ShoppingBag className="h-4 w-4" />}
          />
          <StatCard
            title="Aktive kunder"
            value="573"
            trend={{ value: 15, isPositive: true }}
            icon={<Users className="h-4 w-4" />}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <ChartCard
            title="Omsætning"
            description="Månedlig omsætning"
            data={revenueData}
            type="bar"
            dataKey="revenue"
          />
          <ChartCard
            title="Besøgende"
            description="Månedlige besøgende"
            data={visitorData}
            type="line"
            dataKey="visitors"
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardStatistics;
