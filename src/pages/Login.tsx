import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowRight, Mail, Lock, User, Users, Loader2, ShoppingCart, Package, CreditCard, Truck, Shield } from "lucide-react";
import { ContactOverlay } from "@/components/layout/ContactOverlay";
import { useAuth } from '../hooks/useAuth';
import { isCustomer } from '../lib/auth';

const customerLoginSchema = z.object({
  email: z.string().email('Ugyldig email adresse'),
  password: z.string().min(6, 'Password skal være mindst 6 tegn'),
});

type CustomerLoginFormData = z.infer<typeof customerLoginSchema>;

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, user, isAuthenticated, profileLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CustomerLoginFormData>({
    resolver: zodResolver(customerLoginSchema),
  });

  // Redirect if already logged in as customer
  useEffect(() => {
    if (isAuthenticated && user && isCustomer(user) && !profileLoading &&
        user.contactPersonName && user.email && user.companyName) {
      console.log('🔄 User authenticated and profile loaded - navigating to dashboard');
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';
      setIsLoading(false); // Stop loading since we're navigating
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, profileLoading, navigate, location]);

  const onSubmit = async (data: CustomerLoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await login(data.email, data.password, 'customer');
      
      if (response.success) {
        reset();
        console.log('✅ Login successful - waiting for auth context to process user data');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Login fejlede. Kontroller dine oplysninger og prøv igen.';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      <Navbar />
      
      <main className="relative flex-grow flex items-center justify-center py-6 px-4 md:py-12">
        <div className="page-container">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-start">
            <div className="w-full max-w-md mx-auto order-2 lg:order-1">
              <Card className="border border-gray-100 shadow-sm rounded-xl overflow-hidden bg-white">
                <div className="bg-white rounded-lg overflow-hidden">
                  <CardHeader className="space-y-1 pb-6">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-brand-gray-100 mx-auto flex items-center justify-center mb-2 shadow-sm">
                      <User className="h-7 w-7 md:h-8 md:w-8 text-brand-primary" />
                    </div>
                    <CardTitle className="text-xl md:text-2xl font-bold text-center text-gray-800">
                      B2B Kunde Login
                    </CardTitle>
                    <CardDescription className="text-center text-sm md:text-base">
                      Indtast dine oplysninger for at få adgang til din B2B konto
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-8">
                    {error && (
                      <Alert variant="destructive" className="mb-6">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-brand-primary" />
                          Email
                        </Label>
                        <div className="relative group">
                          <Input 
                            id="email" 
                            type="email" 
                            placeholder="din@virksomhed.dk" 
                            className="pl-4 py-5 md:py-6 transition-all duration-300 rounded-xl bg-white border-gray-200 text-base"
                            {...register('email')}
                            disabled={isLoading}
                          />
                          {errors.email && (
                            <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="password" className="text-sm font-medium flex items-center gap-1.5">
                            <Lock className="h-3.5 w-3.5 text-brand-primary" />
                            Adgangskode
                          </Label>
                          <Link 
                            to="/password-reset" 
                            className="text-sm font-medium text-brand-primary hover:text-brand-primary-hover transition-colors"
                          >
                            Glemt adgangskode?
                          </Link>
                        </div>
                        <div className="relative group">
                          <Input 
                            id="password" 
                            type="password" 
                            className="pl-4 py-5 md:py-6 transition-all duration-300 rounded-xl bg-white border-gray-200 text-base"
                            {...register('password')}
                            disabled={isLoading}
                          />
                          {errors.password && (
                            <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
                          )}
                        </div>
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full btn-brand-primary py-5 md:py-6 rounded-xl text-base"
                        disabled={isLoading}
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                          {isLoading ? 'Logger ind...' : 'Log ind'}
                          {!isLoading && <ArrowRight className="h-5 w-5" />}
                        </span>
                      </Button>
                    </form>
                  </CardContent>
                  <CardFooter className="flex flex-col gap-4 pb-6">
                    <div className="text-center text-sm text-gray-600">
                      <span>Har du ikke en B2B konto? </span>
                      <Link 
                        to="/apply" 
                        className="font-medium text-brand-primary hover:text-brand-primary-hover transition-colors"
                      >
                        Ansøg om adgang her
                      </Link>
                    </div>
                    <div className="text-center">
                      <Link 
                        to="/super/admin" 
                        className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        Administrator? Log ind her
                      </Link>
                    </div>
                  </CardFooter>
                </div>
              </Card>
            </div>

            {/* Benefits Section - Hidden on mobile, visible on larger screens */}
            <div className="hidden lg:block order-1 lg:order-2">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                    Velkommen til Multi Grønt B2B
                  </h2>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Din professionelle partner til friske råvarer. Log ind for at få adgang til:
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                                    <div className="flex-shrink-0 w-10 h-10 bg-brand-gray-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5 text-brand-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Kundespecifikke priser</h3>
                      <p className="text-gray-600">Få adgang til dine personlige B2B priser og rabatter</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Package className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Ordrehistorik</h3>
                      <p className="text-gray-600">Se dine tidligere ordrer og genbestil nemt</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Fakturabetaling</h3>
                      <p className="text-gray-600">Nem betaling via faktura med 30 dages kredit</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Truck className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Hurtig levering</h3>
                      <p className="text-gray-600">Levering til hele Danmark - ofte samme dag</p>
                    </div>
                  </div>
                </div>

                            <div className="bg-brand-gray-100 p-6 rounded-lg border border-brand-gray-200">
              <div className="flex items-start space-x-3">
                <Shield className="h-6 w-6 text-brand-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-brand-primary-dark mb-1">Sikker platform</h4>
                  <p className="text-brand-gray-700 text-sm">
                        Dine data er beskyttet med moderne sikkerhedsforanstaltninger
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <ContactOverlay />
      <Footer />
    </div>
  );
};

export default Login;
