
import React from "react";
import { Download, Eye, FileText, MoreHorizontal, Search } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { invoices } from "@/components/dashboard/mockData";

const DashboardInvoices: React.FC = () => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Betalt":
        return "default";
      case "Afventer":
        return "secondary";
      case "Fejlet":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Fakturaer</h2>
          <p className="text-muted-foreground">
            Administrer, send og hold styr på fakturaer.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Søg efter faktura..."
              className="pl-8 w-full"
            />
          </div>
          <Button variant="outline">Opret ny faktura</Button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {invoices.map((invoice) => (
          <Card key={invoice.id} className="overflow-hidden h-full">
            <CardHeader className="p-4 pb-0">
              <div className="flex items-start justify-between">
                <Badge
                  variant={getStatusColor(invoice.status)}
                  className="rounded-full px-2.5"
                >
                  {invoice.status}
                </Badge>
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
                    <DropdownMenuItem>Send igen</DropdownMenuItem>
                    <DropdownMenuItem>Marker som betalt</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      Annuller faktura
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-full bg-primary/10 p-2">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">{invoice.id}</h3>
                  <p className="text-sm text-muted-foreground">
                    {invoice.customer}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-xs text-muted-foreground">Dato</p>
                  <p className="text-sm font-medium">{invoice.date}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Beløb</p>
                  <p className="text-sm font-medium">{invoice.amount}</p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full"
                >
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">Vis</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full"
                >
                  <Download className="h-4 w-4" />
                  <span className="sr-only">Download</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default DashboardInvoices;
