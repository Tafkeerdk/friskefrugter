import React from "react";
import { useAuth } from "../hooks/useAuth";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import UniqueOffersCard from "../components/customer/UniqueOffersCard";
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
  const { user, isLoading } = useAuth();

  // Show loading while user data is being fetched
  if (isLoading || !user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto mb-4"></div>
            <p className="text-brand-gray-600">Indlæser dashboard...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Add safety checks for user properties
  const safeUser = {
    contactPersonName: user?.contactPersonName || 'Ikke angivet',
    companyName: user?.companyName || 'Ikke angivet',
    email: user?.email || 'Ikke angivet',
    phone: (user as any)?.phone || null,
    address: (user as any)?.address || null,
    discountGroup: user?.discountGroup || null,
    discountGroups: (user as any)?.discountGroups || null
  };

  // Additional validation to ensure core user data is available
  if (!user?.contactPersonName || !user?.email || !user?.companyName) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto mb-4"></div>
            <p className="text-brand-gray-600">Indlæser brugerdata...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Leveret': return 'bg-brand-success text-white';
      case 'Undervejs': return 'bg-blue-100 text-blue-800';
      case 'Afventer': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-50">
        <div className="page-container py-6 md:py-8 space-y-6 md:space-y-8">
          {/* Header */}
          <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Velkommen tilbage, {safeUser.contactPersonName}
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              Her er dit dashboard med overblik over ordrer og aktivitet
            </p>
          </div>

          {/* Stats Cards - Mobile responsive grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            <Card className="text-center">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium">Samlede Ordrer</CardTitle>
                <Package className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg md:text-2xl font-bold">{customerStats.totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  Siden du blev kunde
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium">Månedligt Forbrug</CardTitle>
                <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg md:text-2xl font-bold">{customerStats.monthlySpent.toLocaleString()} kr</div>
                <p className="text-xs text-muted-foreground">
                  Denne måned
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium">Afventende Ordrer</CardTitle>
                <Clock className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg md:text-2xl font-bold">{customerStats.pendingOrders}</div>
                <p className="text-xs text-muted-foreground">
                  Bliver behandlet
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs md:text-sm font-medium">Sidste Ordre</CardTitle>
                <FileText className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm md:text-2xl font-bold">
                  {new Date(customerStats.lastOrderDate).toLocaleDateString('da-DK')}
                </div>
                <p className="text-xs text-muted-foreground">
                  Seneste aktivitet
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Mobile responsive layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Customer Profile */}
            <div className="lg:col-span-1 space-y-6">
              {/* Unique Offers Card */}
              <UniqueOffersCard />
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-4 w-4 md:h-5 md:w-5" />
                    Virksomhedsprofil
                  </CardTitle>
                  <CardDescription>
                    Dine virksomhedsoplysninger og kontaktdata
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{safeUser.companyName}</p>
                        <p className="text-sm text-gray-600">Virksomhed</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{safeUser.contactPersonName}</p>
                        <p className="text-sm text-gray-600">Kontaktperson</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{safeUser.email}</p>
                        <p className="text-sm text-gray-600">Email</p>
                      </div>
                    </div>
                    
                    {safeUser.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{safeUser.phone}</p>
                          <p className="text-sm text-gray-600">Telefon</p>
                        </div>
                      </div>
                    )}
                    
                    {safeUser.address && safeUser.address.street && (
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm leading-relaxed">
                            {safeUser.address.street}<br />
                            {safeUser.address.postalCode} {safeUser.address.city}
                          </p>
                          <p className="text-sm text-gray-600">Adresse</p>
                        </div>
                      </div>
                    )}
                    
                    {(safeUser.discountGroup || safeUser.discountGroups) && (
                      <div className="pt-2 border-t">
                        <p className="text-sm font-medium text-gray-700 mb-2">Rabatgrupper</p>
                        <div className="flex flex-wrap gap-2">
                          {safeUser.discountGroup && (
                            <Badge className={`text-xs ${getDiscountGroupColor(
                              typeof safeUser.discountGroup === 'object' && safeUser.discountGroup
                                ? safeUser.discountGroup.name
                                : (typeof safeUser.discountGroup === 'string' ? safeUser.discountGroup : 'Standard')
                            )}`}>
                              {typeof safeUser.discountGroup === 'object' && safeUser.discountGroup
                                ? `${safeUser.discountGroup.name} (${safeUser.discountGroup.discountPercentage}% rabat)`
                                : (typeof safeUser.discountGroup === 'string' ? safeUser.discountGroup : 'Standard')
                              }
                            </Badge>
                          )}
                          {safeUser.discountGroups && safeUser.discountGroups.map((group: string, index: number) => (
                            <Badge 
                              key={index}
                              className={`text-xs ${getDiscountGroupColor(group)}`}
                            >
                              {group}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t">
                    <Link to="/profile">
                      <Button variant="outline" className="w-full">
                        <Settings className="mr-2 h-4 w-4" />
                        Rediger profil
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions and Recent Orders */}
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
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                    <Button asChild className="h-auto p-3 md:p-4 flex-col gap-2">
                      <Link to="/products">
                        <ShoppingCart className="h-5 w-5 md:h-6 md:w-6" />
                        <span className="text-xs md:text-sm">Se produkter</span>
                      </Link>
                    </Button>
                    
                    <Button variant="outline" asChild className="h-auto p-3 md:p-4 flex-col gap-2">
                      <Link to="/cart">
                        <Package className="h-5 w-5 md:h-6 md:w-6" />
                        <span className="text-xs md:text-sm">Min kurv</span>
                      </Link>
                    </Button>
                    
                    <Button variant="outline" asChild className="h-auto p-3 md:p-4 flex-col gap-2">
                      <Link to="/orders">
                        <FileText className="h-5 w-5 md:h-6 md:w-6" />
                        <span className="text-xs md:text-sm">Mine ordrer</span>
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
                    Dine 3 seneste ordrer og deres status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 md:space-y-4">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 md:p-4 bg-gray-50 rounded-lg gap-2 md:gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm md:text-base">{order.id}</span>
                            <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                              {order.status}
                            </Badge>
                          </div>
                          <p className="text-xs md:text-sm text-gray-600">
                            {new Date(order.date).toLocaleDateString('da-DK')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm md:text-base">{order.amount.toLocaleString()} kr</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <Link to="/orders">
                      <Button variant="outline" className="w-full">
                        Se alle ordrer
                      </Button>
                    </Link>
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
