import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-200 hover:shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/30",
      className
    )}>
      <CardContent className={cn(
        "transition-all",
        isMobile ? "p-4" : "p-6"
      )}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className={cn(
              "font-medium text-muted-foreground truncate",
              isMobile ? "text-xs" : "text-sm"
            )}>
              {title}
            </p>
            <h3 className={cn(
              "font-bold text-foreground mt-1",
              isMobile ? "text-xl" : "text-2xl"
            )}>
              {value}
            </h3>
            {description && (
              <p className={cn(
                "text-muted-foreground mt-1 line-clamp-2",
                isMobile ? "text-xs" : "text-xs"
              )}>
                {description}
              </p>
            )}
            {trend && (
              <div className={cn(
                "mt-2 flex items-center",
                isMobile ? "text-xs" : "text-xs"
              )}>
                <span className={cn(
                  "font-medium",
                  trend.isPositive ? "text-brand-primary" : "text-red-600"
                )}>
                  {trend.isPositive ? "+" : ""}{trend.value}%
                </span>
                <span className="ml-1 text-muted-foreground">
                  {isMobile ? "v. uge" : "siden sidste uge"}
                </span>
              </div>
            )}
          </div>
          {icon && (
            <div className={cn(
              "rounded-lg bg-primary/10 text-primary flex-shrink-0 ml-3",
              isMobile ? "p-2" : "p-2.5"
            )}>
              <div className={cn(isMobile ? "w-4 h-4" : "w-5 h-5")}>
                {icon}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
