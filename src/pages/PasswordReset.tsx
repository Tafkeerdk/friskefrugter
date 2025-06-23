import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Mail, Lock, Loader2, CheckCircle, Key } from "lucide-react";
import { authService } from '../lib/auth';

const passwordResetRequestSchema = z.object({
  email: z.string().email('Ugyldig email adresse'),
});

const passwordResetVerifySchema = z.object({
  email: z.string().email('Ugyldig email adresse'),
  resetCode: z.string().length(6, 'Nulstillingskode skal være 6 cifre'),
  newPassword: z.string().min(8, 'Password skal være mindst 8 tegn'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords matcher ikke",
  path: ["confirmPassword"],
});

type PasswordResetRequestData = z.infer<typeof passwordResetRequestSchema>;
type PasswordResetVerifyData = z.infer<typeof passwordResetVerifySchema>;

const PasswordReset = () => {
  const [step, setStep] = useState<'request' | 'verify' | 'success'>('request');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');

  const requestForm = useForm<PasswordResetRequestData>({
    resolver: zodResolver(passwordResetRequestSchema),
  });

  const verifyForm = useForm<PasswordResetVerifyData>({
    resolver: zodResolver(passwordResetVerifySchema),
    defaultValues: {
      email: email,
    },
  });

  const onRequestSubmit = async (data: PasswordResetRequestData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.requestPasswordReset(data.email);
      
      if (response.success) {
        setEmail(data.email);
        verifyForm.setValue('email', data.email);
        setStep('verify');
      } else {
        setError(response.message || 'Der opstod en fejl. Prøv igen.');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Der opstod en fejl. Prøv igen senere.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifySubmit = async (data: PasswordResetVerifyData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.verifyPasswordReset(data.email, data.resetCode, data.newPassword);
      
      if (response.success) {
        setStep('success');
      } else {
        setError(response.message || 'Der opstod en fejl. Prøv igen.');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Der opstod en fejl. Prøv igen senere.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const renderRequestStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Key className="w-6 h-6 text-blue-600" />
        </div>
        <CardTitle>Nulstil password</CardTitle>
        <CardDescription>
          Indtast din email adresse for at modtage en nulstillingskode
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={requestForm.handleSubmit(onRequestSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email adresse</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="din@email.dk"
                className="pl-10"
                {...requestForm.register('email')}
                disabled={isLoading}
              />
            </div>
            {requestForm.formState.errors.email && (
              <p className="text-sm text-destructive">{requestForm.formState.errors.email.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send nulstillingskode
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link 
            to="/login" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tilbage til login
          </Link>
        </div>
      </CardContent>
    </Card>
  );

  const renderVerifyStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Mail className="w-6 h-6 text-blue-600" />
        </div>
        <CardTitle>Indtast nulstillingskode</CardTitle>
        <CardDescription>
          Vi har sendt en 6-cifret kode til {email}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={verifyForm.handleSubmit(onVerifySubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resetCode">Nulstillingskode</Label>
            <Input
              id="resetCode"
              placeholder="123456"
              maxLength={6}
              className="text-center text-lg tracking-widest"
              {...verifyForm.register('resetCode')}
              disabled={isLoading}
            />
            {verifyForm.formState.errors.resetCode && (
              <p className="text-sm text-destructive">{verifyForm.formState.errors.resetCode.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Nyt password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="newPassword"
                type="password"
                placeholder="Mindst 8 tegn"
                className="pl-10"
                {...verifyForm.register('newPassword')}
                disabled={isLoading}
              />
            </div>
            {verifyForm.formState.errors.newPassword && (
              <p className="text-sm text-destructive">{verifyForm.formState.errors.newPassword.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Bekræft password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Gentag password"
                className="pl-10"
                {...verifyForm.register('confirmPassword')}
                disabled={isLoading}
              />
            </div>
            {verifyForm.formState.errors.confirmPassword && (
              <p className="text-sm text-destructive">{verifyForm.formState.errors.confirmPassword.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Opdater password
          </Button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep('request')}
            disabled={isLoading}
          >
            Anmod om ny kode
          </Button>
          <div>
            <Link 
              to="/login" 
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tilbage til login
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSuccessStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-6 h-6 text-green-600" />
        </div>
        <CardTitle>Password opdateret!</CardTitle>
        <CardDescription>
          Dit password er blevet opdateret succesfuldt
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-sm text-muted-foreground mb-6">
          Du kan nu logge ind med dit nye password
        </p>
        
        <Link to="/login">
          <Button className="w-full">
            Gå til login
          </Button>
        </Link>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          {step === 'request' && renderRequestStep()}
          {step === 'verify' && renderVerifyStep()}
          {step === 'success' && renderSuccessStep()}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PasswordReset; 