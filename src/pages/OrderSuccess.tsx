import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Package, Clock, ArrowRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const OrderSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { customerUser, isAuthenticated } = useAuth();
  const isMobile = useIsMobile();
  
  // Get order details from URL params
  const orderNumber = searchParams.get('orderNumber');
  const totalAmount = searchParams.get('totalAmount');
  const totalItems = searchParams.get('totalItems');

  useEffect(() => {
    // Redirect if not authenticated or no order number
    if (!isAuthenticated || !customerUser || !orderNumber) {
      navigate('/');
      return;
    }
  }, [isAuthenticated, customerUser, orderNumber, navigate]);

  const formatPrice = (price: string | number): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numPrice);
  };

  // Parse order number to extract date and time components
  const parseOrderNumber = (orderNum: string) => {
    // Format: YYYYMMDD-HHMMSS-customerId-###
    const parts = orderNum.split('-');
    if (parts.length >= 4) {
      const datePart = parts[0]; // YYYYMMDD
      const timePart = parts[1]; // HHMMSS
      const sequencePart = parts[parts.length - 1]; // ###
      
      // Parse date
      const year = datePart.substring(0, 4);
      const month = datePart.substring(4, 6);
      const day = datePart.substring(6, 8);
      
      // Parse time
      const hours = timePart.substring(0, 2);
      const minutes = timePart.substring(2, 4);
      const seconds = timePart.substring(4, 6);
      
      return {
        date: `${day}/${month}/${year}`,
        time: `${hours}:${minutes}:${seconds}`,
        sequence: sequencePart,
        fullOrderNumber: orderNum
      };
    }
    
    return {
      date: 'N/A',
      time: 'N/A',
      sequence: 'N/A',
      fullOrderNumber: orderNum
    };
  };

  if (!orderNumber) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ingen ordre fundet</h2>
            <p className="text-gray-600 mb-6">Der kunne ikke findes nogen ordreoplysninger.</p>
            <Link to="/">
              <Button>Tilbage til forsiden</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const orderInfo = parseOrderNumber(orderNumber);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <div className="page-container">
          <div className="content-width">
            {/* Success Header */}
            <div className={cn("text-center py-12", isMobile ? "py-8" : "py-16")}>
              <div className="mx-auto w-24 h-24 bg-brand-success rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              
              <h1 className={cn("font-bold text-brand-gray-900 mb-4", isMobile ? "text-2xl" : "text-3xl")}>
                Tak for din ordre!
              </h1>
              
              <p className={cn("text-brand-gray-600 mb-6 max-w-2xl mx-auto", isMobile ? "text-base" : "text-lg")}>
                Din ordre er modtaget og bliver behandlet. Du vil modtage en bekræftelse på email når ordren er klar til afsendelse.
              </p>
              
              <Badge className="bg-brand-success/10 text-brand-success border-brand-success/20 px-4 py-2 text-sm">
                <Clock className="w-4 h-4 mr-2" />
                Ordre modtaget
              </Badge>
            </div>

            {/* Order Details Card */}
            <Card className="mb-8 card-brand border-brand-success/20">
              <CardHeader className="border-b border-brand-gray-200">
                <CardTitle className="text-brand-primary-dark flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Ordredetaljer
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className={cn("grid gap-6", isMobile ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-4")}>
                  {/* Order Number */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-brand-gray-700 text-sm uppercase tracking-wide">
                      Ordrenummer
                    </h3>
                    <p className="font-mono text-lg font-bold text-brand-primary break-all">
                      {orderInfo.fullOrderNumber}
                    </p>
                    <div className="text-xs text-brand-gray-500 space-y-1">
                      <p>Dato: {orderInfo.date}</p>
                      <p>Tid: {orderInfo.time}</p>
                      <p>Sekvensnr: #{orderInfo.sequence}</p>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-brand-gray-700 text-sm uppercase tracking-wide">
                      Kunde
                    </h3>
                    <p className="text-brand-gray-900 font-medium">
                      {customerUser?.companyName}
                    </p>
                    <p className="text-brand-gray-600 text-sm">
                      {customerUser?.contactPersonName}
                    </p>
                    <p className="text-brand-gray-600 text-sm">
                      {customerUser?.email}
                    </p>
                  </div>

                  {/* Order Totals */}
                  {totalItems && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-brand-gray-700 text-sm uppercase tracking-wide">
                        Antal varer
                      </h3>
                      <p className="text-2xl font-bold text-brand-gray-900">
                        {totalItems}
                      </p>
                      <p className="text-brand-gray-600 text-sm">
                        produkter
                      </p>
                    </div>
                  )}

                  {/* Total Amount */}
                  {totalAmount && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-brand-gray-700 text-sm uppercase tracking-wide">
                        Total beløb
                      </h3>
                      <p className="text-2xl font-bold text-brand-success">
                        {formatPrice(totalAmount)}
                      </p>
                      <p className="text-brand-gray-600 text-sm">
                        inkl. alle rabatter
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* What's Next Section */}
            <Card className="mb-8 card-brand">
              <CardHeader>
                <CardTitle className="text-brand-primary-dark">Hvad sker der nu?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-brand-primary rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold text-brand-gray-900">Email bekræftelse</h4>
                      <p className="text-brand-gray-600 text-sm">
                        Du modtager en detaljeret ordrebekræftelse på din email med ordrenummer {orderInfo.fullOrderNumber}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-brand-primary rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold text-brand-gray-900">Ordrebehandling</h4>
                      <p className="text-brand-gray-600 text-sm">
                        Vi pakker din ordre og gør den klar til afsendelse
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-brand-gray-300 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold text-brand-gray-900">Levering</h4>
                      <p className="text-brand-gray-600 text-sm">
                        Din ordre leveres til den angivne adresse
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className={cn("flex gap-4 pb-12", isMobile ? "flex-col" : "flex-row justify-center")}>
              <Button asChild className="btn-brand-primary">
                <Link to="/orders">
                  <Package className="w-4 h-4 mr-2" />
                  Se mine ordrer
                </Link>
              </Button>
              
              <Button variant="outline" asChild>
                <Link to="/products">
                  Fortsæt med at handle
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              
              <Button variant="ghost" asChild>
                <Link to="/">
                  <Home className="w-4 h-4 mr-2" />
                  Til forsiden
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderSuccess; 