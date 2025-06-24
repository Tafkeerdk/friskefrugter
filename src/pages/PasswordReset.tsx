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
import { ArrowLeft, Mail, Lock, Loader2, CheckCircle, Key, AlertTriangle } from "lucide-react";
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
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState<string | null>(null);

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
        setSuccess('Password opdateret!');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'request') {
      onRequestSubmit({ email });
    } else if (step === 'verify') {
      onVerifySubmit({ email, resetCode: code, newPassword, confirmPassword });
    }
  };

  const renderRequestStep = () => (
    <Card className="w-full">
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

        {success && (
          <Alert className="mb-4 border-brand-success bg-brand-success/10">
            <CheckCircle className="h-4 w-4 text-brand-success" />
            <AlertDescription className="text-brand-success">
              {success}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 'request' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email adresse</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="din@email.dk"
                  required
                  className="mt-1"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sender...
                  </>
                ) : (
                  'Send nulstillingskode'
                )}
              </Button>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="code">6-cifret kode</Label>
                <Input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  required
                  className="mt-1 text-center text-lg font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Indtast koden du modtog via email
                </p>
              </div>
              <div>
                <Label htmlFor="newPassword">Ny adgangskode</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mindst 8 tegn"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Bekræft adgangskode</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Gentag din nye adgangskode"
                  required
                  className="mt-1"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Nulstiller...
                  </>
                ) : (
                  'Nulstil adgangskode'
                )}
              </Button>
            </div>
          )}
        </form>

        <div className="mt-6 text-center space-y-3">
          <div className="text-sm text-muted-foreground">
            Har du brug for hjælp?{' '}
            <Link to="/faq#password-reset-guide" className="text-primary hover:underline">
              Se vores FAQ
            </Link>{' '}
            for detaljeret guide til nulstilling af adgangskode
          </div>
          
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

  const renderSuccessStep = () => (
    <Card className="w-full">
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="flex-grow py-12">
        <div className="page-container">
          <div className="content-width">
            <div className="max-w-md mx-auto">
              <Card className="shadow-md border-0">
                <CardContent className="pt-6 pb-8">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-brand-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Key className="h-8 w-8 text-brand-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      Nulstil adgangskode
                    </h1>
                    <p className="text-gray-600 text-sm">
                      Indtast din email for at modtage en nulstillingskode
                    </p>
                  </div>

                  {error && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert className="mb-4 border-brand-success bg-brand-success/10">
                      <CheckCircle className="h-4 w-4 text-brand-success" />
                      <AlertDescription className="text-brand-success">
                        {success}
                      </AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {step === 'request' && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="email">Email adresse</Label>
                          <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="din@email.dk"
                            required
                            className="mt-1"
                          />
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full bg-green-600 hover:bg-green-700"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Sender...
                            </>
                          ) : (
                            'Send nulstillingskode'
                          )}
                        </Button>
                      </div>
                    )}

                    {step === 'verify' && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="code">6-cifret kode</Label>
                          <Input
                            id="code"
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="123456"
                            maxLength={6}
                            required
                            className="mt-1 text-center text-lg font-mono"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Indtast koden du modtog via email
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="newPassword">Ny adgangskode</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Mindst 8 tegn"
                            required
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="confirmPassword">Bekræft adgangskode</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Gentag din nye adgangskode"
                            required
                            className="mt-1"
                          />
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full bg-green-600 hover:bg-green-700"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Nulstiller...
                            </>
                          ) : (
                            'Nulstil adgangskode'
                          )}
                        </Button>
                      </div>
                    )}
                  </form>

                  <div className="mt-6 text-center">
                    <Link 
                      to="/login" 
                      className="text-sm text-green-600 hover:text-green-700 font-medium"
                    >
                      ← Tilbage til login
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

export default PasswordReset; 