
import React from "react";
import { MoreHorizontal, Mail, Phone, Calendar, Plus } from "lucide-react";
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
import { customers } from "@/components/dashboard/mockData";

const DashboardCustomers: React.FC = () => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case "A":
        return "default";
      case "B":
        return "secondary";
      case "C":
        return "outline";
      default:
        return "outline";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Kunder</h2>
          <p className="text-muted-foreground">
            Administrer dine kunder og deres information.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input placeholder="Søg efter kunde..." className="w-64" />
          <Button className="flex items-center gap-1">
            <Plus className="h-4 w-4" />
            <span>Tilføj kunde</span>
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {customers.map((customer) => (
          <Card key={customer.id} className="overflow-hidden h-full">
            <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between gap-4">
              <div className="flex gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(customer.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{customer.name}</h3>
                  <Badge
                    variant={getTypeColor(customer.type)}
                    className="mt-1 rounded-full px-2.5"
                  >
                    Kundetype {customer.type}
                  </Badge>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Handlinger</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Handlinger</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Se detaljer</DropdownMenuItem>
                  <DropdownMenuItem>Rediger</DropdownMenuItem>
                  <DropdownMenuItem>Se ordrer</DropdownMenuItem>
                  <DropdownMenuItem>Send faktura</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    Slet kunde
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="grid gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>CVR: {customer.cvr}</span>
                </div>
                <div className="flex items-center gap-2 text-sm mt-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Seneste ordre: {customer.lastOrder}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default DashboardCustomers;
