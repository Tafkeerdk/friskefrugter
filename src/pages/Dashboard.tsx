
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Download, ShoppingCart, Package, FileText, ClipboardList, Copy } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

// Sample order data
const orders = [
  {
    id: "ORD-2025-001",
    date: "2025-04-15",
    status: "completed",
    total: 984.55,
    items: 12,
  },
  {
    id: "ORD-2025-002",
    date: "2025-04-02",
    status: "processing",
    total: 456.80,
    items: 6,
  },
  {
    id: "ORD-2025-003",
    date: "2025-03-28",
    status: "completed",
    total: 823.40,
    items: 9,
  },
  {
    id: "ORD-2025-004",
    date: "2025-03-21",
    status: "completed",
    total: 344.95,
    items: 4,
  },
  {
    id: "ORD-2025-005",
    date: "2025-03-15",
    status: "completed",
    total: 1254.30,
    items: 15,
  },
];

// Sample invoice data
const invoices = [
  {
    id: "INV-2025-001",
    orderId: "ORD-2025-001",
    date: "2025-04-16",
    dueDate: "2025-05-16",
    total: 984.55,
    status: "paid",
  },
  {
    id: "INV-2025-002",
    orderId: "ORD-2025-003",
    date: "2025-03-29",
    dueDate: "2025-04-29",
    total: 823.40,
    status: "paid",
  },
  {
    id: "INV-2025-003",
    orderId: "ORD-2025-004",
    date: "2025-03-22",
    dueDate: "2025-04-22",
    total: 344.95,
    status: "pending",
  },
  {
    id: "INV-2025-004",
    orderId: "ORD-2025-005",
    date: "2025-03-16",
    dueDate: "2025-04-16",
    total: 1254.30,
    status: "paid",
  },
];

const Dashboard = () => {
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "processing":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "paid":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('da-DK', options);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Kontrolpanel</h1>
              <p className="text-gray-600">Velkommen tilbage, Virksomhed ApS</p>
            </div>
            <Link to="/products">
              <Button className="gap-2">
                <ShoppingCart className="h-4 w-4" />
                Ny ordre
              </Button>
            </Link>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Package className="h-5 w-5 mr-2 text-green-600" />
                  Sidste ordre
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {orders[0].total.toFixed(2)} kr
                </p>
                <p className="text-sm text-gray-500">
                  {formatDate(orders[0].date)} · {orders[0].id}
                </p>
              </CardContent>
              <CardFooter>
                <Link to="#" className="text-green-600 hover:text-green-800 text-sm flex items-center">
                  <span>Se detaljer</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-green-600" />
                  Åbne fakturaer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {invoices.filter(inv => inv.status === "pending").length}
                </p>
                <p className="text-sm text-gray-500">
                  Udestående: {invoices.filter(inv => inv.status === "pending").reduce((sum, inv) => sum + inv.total, 0).toFixed(2)} kr
                </p>
              </CardContent>
              <CardFooter>
                <Link to="#" className="text-green-600 hover:text-green-800 text-sm flex items-center">
                  <span>Se fakturaer</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <ClipboardList className="h-5 w-5 mr-2 text-green-600" />
                  Samlede ordrer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  {orders.length}
                </p>
                <p className="text-sm text-gray-500">
                  I alt: {orders.reduce((sum, order) => sum + order.total, 0).toFixed(2)} kr
                </p>
              </CardContent>
              <CardFooter>
                <Link to="#" className="text-green-600 hover:text-green-800 text-sm flex items-center">
                  <span>Se alle ordrer</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </CardFooter>
            </Card>
          </div>

          {/* Tabs for Orders and Invoices */}
          <Tabs defaultValue="orders">
            <TabsList className="mb-6">
              <TabsTrigger value="orders" className="text-base">Ordrer</TabsTrigger>
              <TabsTrigger value="invoices" className="text-base">Fakturaer</TabsTrigger>
            </TabsList>
            
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>Ordrehistorik</CardTitle>
                  <CardDescription>
                    En oversigt over alle dine tidligere ordrer
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ordre ID</TableHead>
                          <TableHead>Dato</TableHead>
                          <TableHead>Varer</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Handlinger</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.id}</TableCell>
                            <TableCell>{formatDate(order.date)}</TableCell>
                            <TableCell>{order.items} varer</TableCell>
                            <TableCell>{order.total.toFixed(2)} kr</TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={`capitalize ${getStatusBadgeColor(order.status)}`}
                              >
                                {order.status === "completed" ? "Fuldført" : "Under behandling"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" title="Se detaljer">
                                  <FileText className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" title="Genbestil">
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="invoices">
              <Card>
                <CardHeader>
                  <CardTitle>Fakturaoversigt</CardTitle>
                  <CardDescription>
                    En oversigt over alle dine fakturaer
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Faktura ID</TableHead>
                          <TableHead>Ordre</TableHead>
                          <TableHead>Udstedt</TableHead>
                          <TableHead>Forfald</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Handlinger</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.map((invoice) => (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-medium">{invoice.id}</TableCell>
                            <TableCell>{invoice.orderId}</TableCell>
                            <TableCell>{formatDate(invoice.date)}</TableCell>
                            <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                            <TableCell>{invoice.total.toFixed(2)} kr</TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={`capitalize ${getStatusBadgeColor(invoice.status)}`}
                              >
                                {invoice.status === "paid" ? "Betalt" : "Afventer"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" title="Download faktura">
                                <Download className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
