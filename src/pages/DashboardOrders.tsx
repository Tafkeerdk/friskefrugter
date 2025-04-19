
import React from "react";
import { MoreHorizontal, Download, Filter } from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { orders } from "@/components/dashboard/mockData";

const DashboardOrders: React.FC = () => {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Bekræftet":
        return "secondary";
      case "Pakket":
        return "default";
      case "Leveret":
        return "default";
      case "Betalt":
        return "default";
      case "Annulleret":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Ordrer</h2>
          <p className="text-muted-foreground">
            Administrer og følg dine kunders ordrer.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-1">
            <Download className="h-4 w-4" />
            <span>Eksporter</span>
          </Button>
          <Button variant="outline" className="gap-1">
            <Filter className="h-4 w-4" />
            <span>Filter</span>
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader className="p-4 flex flex-row justify-between items-center">
            <div>
              <CardTitle>Ordreliste</CardTitle>
              <CardDescription>
                Oversigt over alle ordrer fra dine kunder
              </CardDescription>
            </div>
            <div className="w-64">
              <Input placeholder="Søg efter ordre..." />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-md">
              <div className="grid grid-cols-6 items-center border-b px-4 py-3 font-medium">
                <div>Ordrenr.</div>
                <div>Kunde</div>
                <div>Dato</div>
                <div>Status</div>
                <div>Beløb</div>
                <div className="text-right">Handlinger</div>
              </div>
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="grid grid-cols-6 items-center border-b px-4 py-4 last:border-0 hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <span className="font-medium">#{order.id}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {order.customer.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span>{order.customer.name}</span>
                  </div>
                  <div>{order.date}</div>
                  <div>
                    <Badge
                      variant={getStatusVariant(order.status)}
                      className="rounded-full px-2.5"
                    >
                      {order.status}
                    </Badge>
                  </div>
                  <div>{order.amount}</div>
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
                        <DropdownMenuItem>Send faktura</DropdownMenuItem>
                        <DropdownMenuItem>Marker som leveret</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          Annuller ordre
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DashboardOrders;
