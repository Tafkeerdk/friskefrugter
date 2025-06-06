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
import { Loader2, Shield, Lock, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { isAdmin } from '../lib/auth';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Administrator Login</h1>
          <p className="text-slate-400">Sikker adgang til admin panelet</p>
        </div>

        {/* Login Card */}
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-white">Log ind</CardTitle>
            <CardDescription className="text-center text-slate-400">
              Indtast dine administrator oplysninger
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6 border-red-500/50 bg-red-500/10">
                <AlertDescription className="text-red-400">{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">
                  <User className="w-4 h-4 inline mr-2" />
                  Email adresse
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@b2bwebshop.dk"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500"
                  {...register('email')}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500"
                  {...register('password')}
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="text-sm text-red-400">{errors.password.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5" 
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Logger ind...' : 'Log ind som administrator'}
              </Button>
            </form>

            {/* Security Notice */}
            <div className="mt-6 p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-slate-300 font-medium mb-1">Sikkerhedsnotice</p>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Denne side er kun for autoriserede administratorer. 
                    Alle login forsøg bliver logget og overvåget.
                  </p>
                </div>
              </div>
            </div>

            {/* Back to main site */}
            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/')}
                className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
              >
                ← Tilbage til hovedsiden
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-slate-500 text-sm">
          <p>B2B Webshop Administration</p>
          <p className="mt-1">Sikret med enterprise-grade kryptering</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin; 