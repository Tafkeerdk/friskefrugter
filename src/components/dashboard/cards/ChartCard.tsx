import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  description?: string;
  data: any[];
  type: "line" | "bar";
  dataKey: string;
  className?: string;
  formatTooltip?: (value: any, name: string, props: any) => [string, string];
  formatYAxis?: (value: any) => string;
}

const ChartCard: React.FC<ChartCardProps> = ({
  title,
  description,
  data,
  type,
  dataKey,
  className,
  formatTooltip,
  formatYAxis,
}) => {
  const isMobile = useIsMobile();
  
  // Ensure data is valid
  const chartData = Array.isArray(data) && data.length > 0 ? data : [
    { name: 'Ingen data', [dataKey]: 0 }
  ];

  return (
    <Card className={cn(
      "border-0 bg-gradient-to-br from-white to-gray-50/30 overflow-hidden",
      className
    )}>
      <CardHeader className={cn(
        "pb-3",
        isMobile ? "p-4 pb-2" : "p-6 pb-3"
      )}>
        <CardTitle className={cn(
          "font-semibold",
          isMobile ? "text-base" : "text-lg"
        )}>
          {title}
        </CardTitle>
        {description && (
          <p className={cn(
            "text-muted-foreground",
            isMobile ? "text-xs" : "text-sm"
          )}>
            {description}
          </p>
        )}
      </CardHeader>
      <CardContent className={cn(
        isMobile ? "p-4 pt-0" : "p-6 pt-0"
      )}>
        <div className={cn(
          "w-full",
          isMobile ? "h-[160px]" : "h-[200px]"
        )}>
          <ResponsiveContainer width="100%" height="100%">
            {type === "line" ? (
              <LineChart 
                data={chartData}
                margin={
                  isMobile 
                    ? { top: 5, right: 5, left: 5, bottom: 5 }
                    : { top: 5, right: 30, left: 20, bottom: 5 }
                }
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="hsl(var(--muted-foreground))" 
                  opacity={0.3}
                />
                <XAxis 
                  dataKey="name" 
                  fontSize={isMobile ? 10 : 12}
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  fontSize={isMobile ? 10 : 12}
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatYAxis}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: isMobile ? '12px' : '14px'
                  }}
                  formatter={formatTooltip}
                />
                <Line
                  type="monotone"
                  dataKey={dataKey}
                  stroke="hsl(var(--primary))"
                  strokeWidth={isMobile ? 2 : 3}
                  dot={{ r: isMobile ? 3 : 4, fill: 'hsl(var(--primary))' }}
                  activeDot={{ r: isMobile ? 4 : 6, fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            ) : (
              <BarChart 
                data={chartData}
                margin={
                  isMobile 
                    ? { top: 5, right: 5, left: 5, bottom: 5 }
                    : { top: 5, right: 30, left: 20, bottom: 5 }
                }
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="hsl(var(--muted-foreground))" 
                  opacity={0.3}
                />
                <XAxis 
                  dataKey="name" 
                  fontSize={isMobile ? 10 : 12}
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  fontSize={isMobile ? 10 : 12}
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatYAxis}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: isMobile ? '12px' : '14px'
                  }}
                  formatter={formatTooltip}
                />
                <Bar
                  dataKey={dataKey}
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChartCard;
