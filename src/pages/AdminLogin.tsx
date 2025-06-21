
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2, Shield, Lock, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { isAdmin } from '../lib/auth';
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";

const adminLoginSchema = z.object({
  email: z.string().email('Ugyldig email adresse'),
  password: z.string().min(6, 'Password skal være mindst 6 tegn'),
});

type AdminLoginFormData = z.infer<typeof adminLoginSchema>;

const AdminLogin: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginSchema),
  });

  // Redirect if already logged in as admin
  useEffect(() => {
    if (isAuthenticated && user && isAdmin(user)) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/admin';
      navigate(from, { replace: true });
    } else if (isAuthenticated && user && !isAdmin(user)) {
      // If logged in as customer, redirect to customer dashboard
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate, location]);

  const onSubmit = async (data: AdminLoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await login(data.email, data.password, 'admin');
      
      if (response.success) {
        reset();
        const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/admin';
        navigate(from, { replace: true });
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Login fejlede. Kontroller dine oplysninger og prøv igen.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">Administrator Login</h1>
              <p className="text-muted-foreground">Sikker adgang til admin panelet</p>
            </div>
          </div>

          {/* Login Card */}
          <Card className="shadow-lg border-0 bg-card">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl text-center text-card-foreground">Log ind</CardTitle>
              <CardDescription className="text-center text-muted-foreground">
                Indtast dine administrator oplysninger
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800 whitespace-pre-line font-medium">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground font-medium">
                    <User className="w-4 h-4 inline mr-2" />
                    Email adresse
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@b2bwebshop.dk"
                    className="h-12 bg-background border-input focus:border-primary focus:ring-primary/20"
                    {...register('email')}
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground font-medium">
                    <Lock className="w-4 h-4 inline mr-2" />
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="h-12 bg-background border-input focus:border-primary focus:ring-primary/20"
                    {...register('password')}
                    disabled={isLoading}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password.message}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-base" 
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? 'Logger ind...' : 'Log ind som administrator'}
                  {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </form>

              {/* Security Notice */}
              <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/10">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="text-foreground font-medium mb-1">Sikkerhedsnotice</p>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      Denne side er kun for autoriserede administratorer. 
                      Alle login forsøg bliver logget og overvåget.
                    </p>
                  </div>
                </div>
              </div>

              {/* Back to main site */}
              <div className="text-center">
                <button
                  onClick={() => navigate('/')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center"
                >
                  <ArrowRight className="w-3 h-3 mr-1 rotate-180" />
                  Tilbage til hovedsiden
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Footer Info */}
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">B2B Webshop Administration</p>
            <p className="text-xs text-muted-foreground">Sikret med enterprise-grade kryptering</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminLogin;
