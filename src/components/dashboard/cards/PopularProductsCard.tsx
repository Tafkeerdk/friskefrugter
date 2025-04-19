
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  name: string;
  image: string;
  sales: number;
  status: "available" | "low" | "out";
}

interface PopularProductsCardProps {
  products: Product[];
  className?: string;
}

const PopularProductsCard: React.FC<PopularProductsCardProps> = ({ products, className }) => {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Populære produkter</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products.map((product) => (
            <div key={product.id} className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {product.sales} solgt denne uge
                </p>
              </div>
              <Badge
                variant={
                  product.status === "available"
                    ? "default"
                    : product.status === "low"
                      ? "secondary"
                      : "destructive"
                }
                className="rounded-full px-2.5"
              >
                {product.status === "available"
                  ? "På lager"
                  : product.status === "low"
                    ? "Lav lagerstatus"
                    : "Udsolgt"}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PopularProductsCard;
