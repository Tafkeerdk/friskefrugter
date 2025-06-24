
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, DollarSign, Package, Truck } from "lucide-react";

interface Activity {
  id: string;
  type: "order" | "payment" | "shipping" | "delivery";
  title: string;
  description: string;
  time: string;
}

interface RecentActivitiesCardProps {
  activities: Activity[];
  className?: string;
}

const RecentActivitiesCard: React.FC<RecentActivitiesCardProps> = ({
  activities,
  className,
}) => {
  const getIcon = (type: Activity["type"]) => {
    switch (type) {
      case "order":
        return (
          <div className="rounded-full bg-brand-gray-100 p-2">
            <ShoppingCart className="h-4 w-4 text-brand-primary" />
          </div>
        );
      case "payment":
        return (
          <div className="rounded-full bg-blue-100 p-2">
            <DollarSign className="h-4 w-4 text-blue-600" />
          </div>
        );
      case "shipping":
        return (
          <div className="rounded-full bg-amber-100 p-2">
            <Package className="h-4 w-4 text-amber-600" />
          </div>
        );
      case "delivery":
        return (
          <div className="rounded-full bg-purple-100 p-2">
            <Truck className="h-4 w-4 text-purple-600" />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Seneste aktiviteter</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4">
          {activities.map((activity, index) => (
            <div key={activity.id} className="flex items-start gap-4">
              {getIcon(activity.type)}
              <div className="grid gap-1">
                <p className="text-sm font-medium">{activity.title}</p>
                <p className="text-xs text-muted-foreground">{activity.description}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
              {index < activities.length - 1 && (
                <div className="absolute left-3.5 top-6 h-full w-px bg-border" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivitiesCard;
