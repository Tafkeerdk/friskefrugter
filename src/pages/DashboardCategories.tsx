
import React from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const DashboardCategories: React.FC = () => {
  const categories = [
    { id: 1, name: "Frugt", productCount: 15 },
    { id: 2, name: "Grøntsager", productCount: 23 },
    { id: 3, name: "Krydderurter", productCount: 8 },
    { id: 4, name: "Eksotiske frugter", productCount: 12 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Kategorier</h2>
            <p className="text-muted-foreground">
              Administrer dine produktkategorier her.
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Tilføj kategori
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card key={category.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">
                  {category.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {category.productCount} produkter
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardCategories;
