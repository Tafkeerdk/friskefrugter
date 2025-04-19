
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon,
  trend,
  className,
}) => {
  return (
    <Card className={cn("overflow-hidden transition-all hover:shadow-md", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="mt-2 text-2xl font-bold">{value}</h3>
            {description && (
              <p className="mt-1 text-xs text-muted-foreground">{description}</p>
            )}
            {trend && (
              <div className="mt-2 flex items-center text-xs">
                <span className={trend.isPositive ? "text-green-600" : "text-red-600"}>
                  {trend.isPositive ? "+" : "-"}{trend.value}%
                </span>
                <span className="ml-1 text-muted-foreground">siden sidste uge</span>
              </div>
            )}
          </div>
          {icon && (
            <div className="rounded-full bg-muted p-2">{icon}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
