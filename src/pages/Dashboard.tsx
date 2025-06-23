import React from "react";
import { useAuth } from "../hooks/useAuth";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { 
  User, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  Package, 
  FileText, 
  Settings,
  ShoppingCart,
  TrendingUp,
  Clock
} from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  // Mock data for customer dashboard
  const customerStats = {
    totalOrders: 24,
    monthlySpent: 15750,
    pendingOrders: 2,
    lastOrderDate: "2024-01-15"
  };

  const recentOrders = [
    { id: "ORD-001", date: "2024-01-15", amount: 2340, status: "Leveret" },
    { id: "ORD-002", date: "2024-01-12", amount: 1890, status: "Undervejs" },
    { id: "ORD-003", date: "2024-01-08", amount: 3420, status: "Leveret" }
  ];

  const getDiscountGroupColor = (group: string) => {
    switch (group) {
      case 'Bronze': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Sølv': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Guld': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Platin': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Welcome Header */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Velkommen tilbage, {user.contactPersonName}
                </h1>
                <p className="text-gray-600 mt-1">
                  {user.companyName} • B2B Dashboard
                </p>
              </div>
              <Badge className={`px-3 py-1 ${getDiscountGroupColor(user.discountGroup || 'Bronze')}`}>
                {user.discountGroup || 'Bronze'} Kunde
              </Badge>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Samlede Ordrer</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customerStats.totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  Siden du blev kunde
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Månedligt Forbrug</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customerStats.monthlySpent.toLocaleString()} kr</div>
                <p className="text-xs text-muted-foreground">
                  Denne måned
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Afventende Ordrer</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customerStats.pendingOrders}</div>
                <p className="text-xs text-muted-foreground">
                  Bliver behandlet
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sidste Ordre</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Date(customerStats.lastOrderDate).toLocaleDateString('da-DK')}
                </div>
                <p className="text-xs text-muted-foreground">
                  Seneste aktivitet
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Customer Profile */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Virksomhedsprofil
                  </CardTitle>
                  <CardDescription>
                    Dine virksomhedsoplysninger og kontaktdata
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="font-medium">{user.companyName}</p>
                        <p className="text-sm text-gray-600">Virksomhed</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="font-medium">{user.contactPersonName}</p>
                        <p className="text-sm text-gray-600">Kontaktperson</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="font-medium">{user.email}</p>
                        <p className="text-sm text-gray-600">Email</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-4 w-4 text-gray-500" />
                      <div>
                        <Badge className={getDiscountGroupColor(user.discountGroup || 'Bronze')}>
                          {user.discountGroup || 'Bronze'} Rabatgruppe
                        </Badge>
                        <p className="text-sm text-gray-600 mt-1">Din prisniveau</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/profile/edit">
                        <Settings className="h-4 w-4 mr-2" />
                        Rediger profil
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Orders and Quick Actions */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Hurtige handlinger</CardTitle>
                  <CardDescription>
                    Genveje til de mest brugte funktioner
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Button asChild className="h-auto p-4 flex-col gap-2">
                      <Link to="/products">
                        <ShoppingCart className="h-6 w-6" />
                        <span>Se produkter</span>
                      </Link>
                    </Button>
                    
                    <Button variant="outline" asChild className="h-auto p-4 flex-col gap-2">
                      <Link to="/cart">
                        <Package className="h-6 w-6" />
                        <span>Min kurv</span>
                      </Link>
                    </Button>
                    
                    <Button variant="outline" asChild className="h-auto p-4 flex-col gap-2">
                      <Link to="/orders">
                        <FileText className="h-6 w-6" />
                        <span>Mine ordrer</span>
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Orders */}
              <Card>
                <CardHeader>
                  <CardTitle>Seneste ordrer</CardTitle>
                  <CardDescription>
                    Dine sidste ordrer og deres status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-medium">{order.id}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(order.date).toLocaleDateString('da-DK')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{order.amount.toLocaleString()} kr</p>
                          <Badge 
                            variant={order.status === 'Leveret' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <Button variant="outline" className="w-full" asChild>
                      <Link to="/orders">
                        Se alle ordrer
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
