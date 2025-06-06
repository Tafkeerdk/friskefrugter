import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const loginSchema = z.object({
  email: z.string().email('Ugyldig email adresse'),
  password: z.string().min(6, 'Password skal være mindst 6 tegn'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
  defaultTab?: 'customer' | 'admin';
}

export const LoginForm: React.FC<LoginFormProps> = ({ 
  onSuccess, 
  defaultTab = 'customer' 
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await login(data.email, data.password, activeTab);
      reset();
      onSuccess?.();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Login fejlede. Prøv igen.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'customer' | 'admin');
    setError(null);
    reset();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Log ind</CardTitle>
        <CardDescription>
          Vælg din kontotype og log ind på din konto
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="customer">Kunde</TabsTrigger>
            <TabsTrigger value="admin">Administrator</TabsTrigger>
          </TabsList>
          
          <TabsContent value="customer" className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Log ind som B2B kunde for at se priser og oprette ordrer
            </div>
          </TabsContent>
          
          <TabsContent value="admin" className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Administrator login til at administrere ansøgninger og kunder
            </div>
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="din@email.dk"
              {...register('email')}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Dit password"
              {...register('password')}
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Log ind som {activeTab === 'customer' ? 'kunde' : 'administrator'}
          </Button>
        </form>

        {activeTab === 'customer' && (
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Har du ikke en konto endnu?{' '}
              <a href="/apply" className="text-primary hover:underline">
                Ansøg om B2B adgang
              </a>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 