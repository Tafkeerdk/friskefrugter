
import React from "react";
import { Edit, Eye, EyeOff, Plus, MoreHorizontal } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { products } from "@/components/dashboard/mockData";

const DashboardProducts: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Produkter</h2>
          <p className="text-muted-foreground">
            Administrer dine produkter, kategorier og lager.
          </p>
        </div>
        <Button className="flex items-center gap-1">
          <Plus className="h-4 w-4" />
          <span>Tilføj produkt</span>
        </Button>
      </div>

      <Tabs defaultValue="cards" className="mt-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="cards">Kortvisning</TabsTrigger>
            <TabsTrigger value="list">Listevisning</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Kategori
            </Button>
            <Button variant="outline" size="sm">
              Pris
            </Button>
            <Button variant="outline" size="sm">
              Lager
            </Button>
          </div>
        </div>

        <TabsContent value="cards" className="mt-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden h-full">
                <div className="relative aspect-video overflow-hidden bg-muted">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full">
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Rediger</span>
                    </Button>
                    <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full">
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">Vis/Skjul</span>
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {product.category}
                        </p>
                      </div>
                      <Badge
                        variant={
                          product.status === "instock"
                            ? "default"
                            : product.status === "lowstock"
                            ? "secondary"
                            : "destructive"
                        }
                        className="rounded-full px-2.5"
                      >
                        {product.status === "instock"
                          ? "På lager"
                          : product.status === "lowstock"
                          ? "Lav lagerstatus"
                          : "Udsolgt"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{product.price}</p>
                      <p className="text-sm text-muted-foreground">
                        {product.stock} stk. på lager
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <Card>
            <CardHeader className="p-4">
              <CardTitle>Produktliste</CardTitle>
              <CardDescription>
                Oversigt over alle produkter i sortimentet
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="rounded-md border">
                <div className="grid grid-cols-6 items-center border-b px-4 py-3 font-medium">
                  <div className="col-span-2">Produkt</div>
                  <div>Kategori</div>
                  <div>Pris</div>
                  <div>Lager</div>
                  <div className="text-right">Handlinger</div>
                </div>
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="grid grid-cols-6 items-center border-b px-4 py-3 last:border-0"
                  >
                    <div className="col-span-2 flex items-center gap-2">
                      <div className="h-10 w-10 rounded overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                      </div>
                    </div>
                    <div>{product.category}</div>
                    <div>{product.price}</div>
                    <div>
                      <Badge
                        variant={
                          product.status === "instock"
                            ? "default"
                            : product.status === "lowstock"
                            ? "secondary"
                            : "destructive"
                        }
                        className="rounded-full px-2.5"
                      >
                        {product.stock} stk.
                      </Badge>
                    </div>
                    <div className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="ml-auto">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Handlinger</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Handlinger</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>Se detaljer</DropdownMenuItem>
                          <DropdownMenuItem>Rediger</DropdownMenuItem>
                          <DropdownMenuItem>Skjul</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            Slet
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default DashboardProducts;
