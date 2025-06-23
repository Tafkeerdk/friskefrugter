import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { authService, CustomerApplicationData } from '../../lib/auth';
import { CVRInput } from '../ui/cvr-input';
import { CVRData } from '../../lib/cvr';

const applicationSchema = z.object({
  companyName: z.string().min(2, 'Virksomhedsnavn skal være mindst 2 tegn'),
  cvrNumber: z.string().min(8, 'CVR nummer er påkrævet'),
  contactPersonName: z.string().min(2, 'Kontaktperson navn skal være mindst 2 tegn'),
  email: z.string().email('Ugyldig email adresse'),
  phone: z.string().min(8, 'Telefonnummer skal være mindst 8 cifre'),
  password: z.string().min(8, 'Password skal være mindst 8 tegn'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords matcher ikke",
  path: ["confirmPassword"],
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

interface CustomerApplicationFormProps {
  onSuccess?: () => void;
}

export const CustomerApplicationForm: React.FC<CustomerApplicationFormProps> = ({ 
  onSuccess 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [cvrNumber, setCvrNumber] = useState('');
  const [companyData, setCompanyData] = useState<CVRData | null>(null);
  const [isCvrValid, setIsCvrValid] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
  });

  // Watch for company name changes to sync with CVR data
  const watchedCompanyName = watch('companyName');

  const handleCvrChange = (value: string) => {
    setCvrNumber(value);
    setValue('cvrNumber', value.replace(/\s/g, ''));
  };

  const handleCompanyDataChange = (data: CVRData | null) => {
    setCompanyData(data);
    
    if (data) {
      // Auto-fill company name if not manually changed
      if (!watchedCompanyName || watchedCompanyName === '') {
        setValue('companyName', data.companyName);
      }
    }
  };

  const handleCvrValidationChange = (isValid: boolean) => {
    setIsCvrValid(isValid);
  };

  const onSubmit = async (data: ApplicationFormData) => {
    console.log('🚀 Starting form submission...');
    console.log('📋 Form data:', data);
    console.log('🏢 Company data from CVR:', companyData);
    console.log('✅ CVR valid:', isCvrValid);

    if (!isCvrValid) {
      setError('CVR nummer skal valideres før ansøgningen kan sendes');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const applicationData: CustomerApplicationData = {
        companyName: data.companyName,
        cvrNumber: data.cvrNumber,
        contactPersonName: data.contactPersonName,
        email: data.email,
        phone: data.phone,
        password: data.password,
        // Use address from CVR data if available, otherwise undefined
        address: companyData?.address || undefined,
      };

      console.log('📤 Sending application data:', applicationData);

      const response = await authService.applyAsCustomer(applicationData);
      console.log('📥 Application response:', response);
      
      if (response.success) {
        console.log('✅ Application successful!');
        setSuccess(true);
        reset();
        setCvrNumber('');
        setCompanyData(null);
        setIsCvrValid(false);
        onSuccess?.();
      } else {
        console.log('❌ Application failed:', response.message);
        setError(response.message || 'Ansøgning fejlede. Prøv igen.');
      }
    } catch (err: unknown) {
      console.error('❌ Application error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Der opstod en fejl. Prøv igen senere.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold text-green-700">Ansøgning modtaget!</h2>
            <p className="text-muted-foreground">
              Tak for din ansøgning. Vi behandler den og vender tilbage inden for 24 timer.
            </p>
            <p className="text-sm text-muted-foreground">
              Du vil modtage en bekræftelsesmail på den angivne email adresse.
            </p>
            <Button onClick={() => setSuccess(false)} variant="outline">
              Send ny ansøgning
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Ansøg om B2B adgang</CardTitle>
        <CardDescription>
          Udfyld formularen for at ansøge om adgang til vores B2B platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* CVR Information with Auto-validation */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">CVR Validering</h3>
            <p className="text-sm text-muted-foreground">
              Indtast dit CVR nummer for automatisk at hente virksomhedsoplysninger
            </p>
            
            <CVRInput
              value={cvrNumber}
              onChange={handleCvrChange}
              onCompanyDataChange={handleCompanyDataChange}
              onValidationChange={handleCvrValidationChange}
              label="CVR nummer"
              placeholder="12345678"
              required
              disabled={isLoading}
              error={errors.cvrNumber?.message}
            />
          </div>

          {/* Company Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Virksomhedsoplysninger</h3>
            
            <div className="space-y-2">
              <Label htmlFor="companyName">
                Virksomhedsnavn *
                {companyData && (
                  <span className="text-xs text-green-600 ml-2">
                    (hentet fra CVR)
                  </span>
                )}
              </Label>
              <Input
                id="companyName"
                placeholder="Din virksomhed ApS"
                {...register('companyName')}
                disabled={isLoading}
                className={companyData ? 'bg-green-50 border-green-200' : ''}
              />
              {errors.companyName && (
                <p className="text-sm text-destructive">{errors.companyName.message}</p>
              )}
              {companyData && (
                <p className="text-xs text-green-600">
                  ✓ Virksomhedsnavn hentet fra CVR-registret. Du kan redigere det hvis nødvendigt.
                </p>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Kontaktoplysninger</h3>
            
            <div className="space-y-2">
              <Label htmlFor="contactPersonName">Kontaktperson *</Label>
              <Input
                id="contactPersonName"
                placeholder="Fornavn Efternavn"
                {...register('contactPersonName')}
                disabled={isLoading}
              />
              {errors.contactPersonName && (
                <p className="text-sm text-destructive">{errors.contactPersonName.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="kontakt@dinvirksomhed.dk"
                  {...register('email')}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefon *</Label>
                <Input
                  id="phone"
                  placeholder="12345678"
                  {...register('phone')}
                  disabled={isLoading}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Adgangskode</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mindst 8 tegn"
                  {...register('password')}
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Bekræft password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Gentag password"
                  {...register('confirmPassword')}
                  disabled={isLoading}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Submission Requirements */}
          {!isCvrValid && cvrNumber && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                CVR nummer skal valideres før ansøgningen kan sendes. Vent venligst på validering.
              </AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !isCvrValid}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {!isCvrValid && cvrNumber ? 'Venter på CVR validering...' : 'Send ansøgning'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Har du allerede en konto?{' '}
            <a href="/login" className="text-primary hover:underline">
              Log ind her
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}; 