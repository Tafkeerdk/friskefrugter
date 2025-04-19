
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface OrderStatus {
  status: string;
  count: number;
  variant: "default" | "outline" | "secondary" | "destructive";
}

interface OrderStatusCardProps {
  statuses: OrderStatus[];
  className?: string;
}

const OrderStatusCard: React.FC<OrderStatusCardProps> = ({ statuses, className }) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Ordrestatus</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {statuses.map((status) => (
            <div key={status.status} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={status.variant} className="rounded-full px-2.5">
                  {status.status}
                </Badge>
                <span className="text-sm font-medium">{status.count} ordrer</span>
              </div>
              <div className="flex-1 h-2 ml-4 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${status.count}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderStatusCard;
