import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, CheckCircle, AlertTriangle, MapPin, Truck, ChevronDown, ChevronUp } from 'lucide-react';
import { authService, CustomerApplicationData } from '../../lib/auth';
import { CVRInput } from '../ui/cvr-input';
import { DAWAAddressInput } from '../ui/dawa-address-input';
import { CVRData } from '../../lib/cvr';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';

const applicationSchema = z.object({
  companyName: z.string().min(2, 'Virksomhedsnavn skal være mindst 2 tegn'),
  cvrNumber: z.string().min(8, 'CVR nummer er påkrævet'),
  contactPersonName: z.string().min(2, 'Kontaktperson navn skal være mindst 2 tegn'),
  email: z.string().regex(/^[a-zA-ZæøåÆØÅ0-9._+-]+@[a-zA-ZæøåÆØÅ0-9.-]+\.[a-zA-Z]{2,}$/, 'Ugyldig email adresse'),
  phone: z.string().min(8, 'Telefonnummer skal være mindst 8 cifre'),
  password: z.string().min(8, 'Password skal være mindst 8 tegn'),
  confirmPassword: z.string(),
  useRegisteredAddressForDelivery: z.boolean().default(true),
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
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [cvrNumber, setCvrNumber] = useState('');
  const [companyData, setCompanyData] = useState<CVRData | null>(null);
  const [isCvrValid, setIsCvrValid] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState<any>(null);
  
  // Mobile progressive disclosure states
  const [isDeliveryOpen, setIsDeliveryOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      useRegisteredAddressForDelivery: true,
    },
  });

  // Watch for company name changes and delivery address preference
  const watchedCompanyName = watch('companyName');
  const useRegisteredForDelivery = watch('useRegisteredAddressForDelivery');

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
      // Auto-open next section on mobile
      if (isMobile) {
        setIsDeliveryOpen(true);
      }
    }
  };

  const handleCvrValidationChange = (isValid: boolean) => {
    setIsCvrValid(isValid);
  };

  const handleDeliveryAddressChange = (value: string) => {
    const boolValue = value === 'true';
    setValue('useRegisteredAddressForDelivery', boolValue);
  };

  const onSubmit = async (data: ApplicationFormData) => {
    console.log('🚀 Starting form submission...');
    console.log('📋 Form data:', data);
    console.log('🏢 Company data from CVR:', companyData);
    console.log('🚚 Delivery address:', deliveryAddress);

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
        // Use CVR address as registered address
        address: companyData?.address || undefined,
        // Handle delivery address
        deliveryAddress: data.useRegisteredAddressForDelivery ? companyData?.address : deliveryAddress,
        useRegisteredAddressForDelivery: data.useRegisteredAddressForDelivery,
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
        setDeliveryAddress(null);
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
      <Card className={cn(
        "mx-auto",
        isMobile ? "w-full" : "w-full max-w-2xl"
      )}>
        <CardContent className={cn(isMobile ? "pt-4 px-4" : "pt-6")}>
          <div className="text-center space-y-4">
            <CheckCircle className={cn(
              "text-brand-primary mx-auto",
              isMobile ? "h-12 w-12" : "h-16 w-16"
            )} />
            <h2 className={cn(
              "font-bold text-brand-primary-dark",
              isMobile ? "text-xl" : "text-2xl"
            )}>
              Ansøgning modtaget
            </h2>
            <p className={cn(
              "text-muted-foreground",
              isMobile ? "text-sm" : "text-base"
            )}>
              Tak for din ansøgning. Vi behandler den og vender tilbage inden for 24 timer.
            </p>
            <p className={cn(
              "text-muted-foreground",
              isMobile ? "text-xs" : "text-sm"
            )}>
              Du vil modtage en bekræftelsesmail på den angivne email adresse.
            </p>
            <Button 
              onClick={() => setSuccess(false)} 
              variant="outline"
              size={isMobile ? "sm" : "default"}
              className={isMobile ? "text-sm" : ""}
            >
              Send ny ansøgning
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "mx-auto",
      isMobile ? "w-full" : "w-full max-w-2xl"
    )}>
      <CardHeader className={cn(isMobile ? "p-4 pb-2" : "")}>
        <CardTitle className={cn(isMobile ? "text-lg" : "text-xl")}>
          Ansøg om B2B adgang
        </CardTitle>
        <CardDescription className={cn(isMobile ? "text-sm" : "")}>
          {isMobile 
            ? "Udfyld formularen for at få B2B adgang"
            : "Udfyld formularen for at ansøge om adgang til vores B2B platform"
          }
        </CardDescription>
      </CardHeader>
      <CardContent className={cn(isMobile ? "p-4 pt-2" : "")}>
        {error && (
          <Alert variant="destructive" className={cn(
            "mb-6",
            isMobile ? "mb-4" : "mb-6"
          )}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className={cn(isMobile ? "text-sm" : "")}>
              {error}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className={cn(
          "space-y-6",
          isMobile ? "space-y-4" : "space-y-6"
        )}>
          {/* Step 1: CVR Information - Always visible */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                1
              </div>
              <h3 className={cn(
                "font-semibold",
                isMobile ? "text-base" : "text-lg"
              )}>
                CVR Validering
              </h3>
            </div>
            
            <div className={cn(
              "bg-blue-50 rounded-lg border border-blue-200",
              isMobile ? "p-3" : "p-4"
            )}>
              <p className={cn(
                "text-blue-800 font-medium mb-1",
                isMobile ? "text-xs" : "text-sm"
              )}>
                Indtast dit 8-cifrede CVR nummer
              </p>
              <p className={cn(
                "text-blue-700",
                isMobile ? "text-xs" : "text-xs"
              )}>
                Vi henter automatisk virksomhedsoplysninger fra CVR-registret.
              </p>
            </div>
            
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

            {/* Company Name - Show after CVR */}
            {(companyData || cvrNumber) && (
              <div className="space-y-2">
                <Label htmlFor="companyName" className={cn(isMobile ? "text-sm" : "")}>
                  Virksomhedsnavn *
                  {companyData && (
                    <span className="text-xs text-brand-primary ml-2">
                      (hentet fra CVR)
                    </span>
                  )}
                </Label>
                <Input
                  id="companyName"
                  placeholder="Din virksomhed ApS"
                  {...register('companyName')}
                  disabled={isLoading}
                  className={cn(
                    companyData ? 'bg-brand-gray-100 border-brand-gray-200' : '',
                    isMobile ? "h-12 text-base" : "" // Larger touch target
                  )}
                />
                {errors.companyName && (
                  <p className={cn(
                    "text-destructive",
                    isMobile ? "text-xs" : "text-sm"
                  )}>
                    {errors.companyName.message}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Delivery Address - Progressive disclosure on mobile */}
          {(companyData || !isMobile) && (
            <div className="space-y-4">
              {isMobile ? (
                <Collapsible open={isDeliveryOpen} onOpenChange={setIsDeliveryOpen}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between h-12"
                      type="button"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-brand-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                          2
                        </div>
                        <span className="text-sm font-medium">Leveringsadresse</span>
                      </div>
                      {isDeliveryOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-4">
                    {renderDeliverySection()}
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-brand-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                      2
                    </div>
                    <Truck className="h-5 w-5 text-gray-600" />
                    <h3 className="text-lg font-semibold">Leveringsadresse</h3>
                  </div>
                  {renderDeliverySection()}
                </>
              )}
            </div>
          )}

          {/* Step 3: Contact Information - Progressive disclosure on mobile */}
          {(companyData || !isMobile) && (
            <div className="space-y-4">
              {isMobile ? (
                <Collapsible open={isContactOpen} onOpenChange={setIsContactOpen}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between h-12"
                      type="button"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          3
                        </div>
                        <span className="text-sm font-medium">Kontaktoplysninger</span>
                      </div>
                      {isContactOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-4">
                    {renderContactSection()}
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      3
                    </div>
                    <h3 className="text-lg font-semibold">Kontaktoplysninger</h3>
                  </div>
                  {renderContactSection()}
                </>
              )}
            </div>
          )}

          {/* Step 4: Password - Progressive disclosure on mobile */}
          {(companyData || !isMobile) && (
            <div className="space-y-4">
              {isMobile ? (
                <Collapsible open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between h-12"
                      type="button"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          4
                        </div>
                        <span className="text-sm font-medium">Adgangskode</span>
                      </div>
                      {isPasswordOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-4">
                    {renderPasswordSection()}
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      4
                    </div>
                    <h3 className="text-lg font-semibold">Adgangskode</h3>
                  </div>
                  {renderPasswordSection()}
                </>
              )}
            </div>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            className={cn(
              "w-full",
              isMobile ? "h-12 text-base font-medium" : ""
            )}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isMobile ? "Send ansøgning" : "Send ansøgning"}
          </Button>
        </form>

        {/* Mobile login link */}
        {isMobile && (
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Har du allerede en konto?{' '}
              <a href="/login" className="text-primary hover:underline font-medium">
                Log ind her
              </a>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Helper method to render delivery section
  function renderDeliverySection() {
    return (
      <>
        {/* Registered Address Display */}
        {companyData?.address && (
          <div className={cn(
            "bg-gray-50 rounded border",
            isMobile ? "p-3" : "p-4"
          )}>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-gray-600" />
              <span className={cn(
                "font-medium text-gray-900",
                isMobile ? "text-sm" : ""
              )}>
                Registreret adresse (fra CVR)
              </span>
            </div>
            <div className={cn(
              "text-gray-700",
              isMobile ? "text-sm" : "text-sm"
            )}>
              <p>{companyData.address.street}</p>
              <p>{companyData.address.postalCode} {companyData.address.city}</p>
            </div>
          </div>
        )}
        
        {/* Delivery Address Options */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="use-registered"
              name="deliveryAddressOption"
              value="true"
              defaultChecked={true}
              onChange={(e) => handleDeliveryAddressChange(e.target.value)}
              className="h-4 w-4 text-blue-600"
            />
            <Label htmlFor="use-registered" className={cn(isMobile ? "text-sm" : "text-sm")}>
              Brug registreret adresse til levering
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="use-different"
              name="deliveryAddressOption"
              value="false"
              onChange={(e) => handleDeliveryAddressChange(e.target.value)}
              className="h-4 w-4 text-blue-600"
            />
            <Label htmlFor="use-different" className={cn(isMobile ? "text-sm" : "text-sm")}>
              Brug anden leveringsadresse
            </Label>
          </div>
        </div>
        
        {/* Different Delivery Address Input */}
        {useRegisteredForDelivery === false && (
          <div className={cn(
            "border border-blue-200 rounded-lg bg-blue-50",
            isMobile ? "mt-3 p-3" : "mt-4 p-4"
          )}>
            <DAWAAddressInput
              onAddressSelect={setDeliveryAddress}
              label="Leveringsadresse"
              placeholder="Søg efter leveringsadresse..."
              disabled={isLoading}
            />
          </div>
        )}
      </>
    );
  }

  // Helper method to render contact section
  function renderContactSection() {
    return (
      <>
        <div className="space-y-2">
          <Label htmlFor="contactPersonName" className={cn(isMobile ? "text-sm" : "")}>
            Kontaktperson *
          </Label>
          <Input
            id="contactPersonName"
            placeholder="Fornavn Efternavn"
            {...register('contactPersonName')}
            disabled={isLoading}
            className={cn(isMobile ? "h-12 text-base" : "")}
          />
          {errors.contactPersonName && (
            <p className={cn(
              "text-destructive",
              isMobile ? "text-xs" : "text-sm"
            )}>
              {errors.contactPersonName.message}
            </p>
          )}
        </div>

        <div className={cn(
          "grid gap-4",
          isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
        )}>
          <div className="space-y-2">
            <Label htmlFor="email" className={cn(isMobile ? "text-sm" : "")}>
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="kontakt@dinvirksomhed.dk"
              {...register('email')}
              disabled={isLoading}
              className={cn(isMobile ? "h-12 text-base" : "")}
            />
            {errors.email && (
              <p className={cn(
                "text-destructive",
                isMobile ? "text-xs" : "text-sm"
              )}>
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className={cn(isMobile ? "text-sm" : "")}>
              Telefon *
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="12345678"
              {...register('phone')}
              disabled={isLoading}
              className={cn(isMobile ? "h-12 text-base" : "")}
            />
            {errors.phone && (
              <p className={cn(
                "text-destructive",
                isMobile ? "text-xs" : "text-sm"
              )}>
                {errors.phone.message}
              </p>
            )}
          </div>
        </div>
      </>
    );
  }

  // Helper method to render password section
  function renderPasswordSection() {
    return (
      <div className={cn(
        "grid gap-4",
        isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"
      )}>
        <div className="space-y-2">
          <Label htmlFor="password" className={cn(isMobile ? "text-sm" : "")}>
            Password *
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Mindst 8 tegn"
            {...register('password')}
            disabled={isLoading}
            className={cn(isMobile ? "h-12 text-base" : "")}
          />
          {errors.password && (
            <p className={cn(
              "text-destructive",
              isMobile ? "text-xs" : "text-sm"
            )}>
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className={cn(isMobile ? "text-sm" : "")}>
            Bekræft password *
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Gentag password"
            {...register('confirmPassword')}
            disabled={isLoading}
            className={cn(isMobile ? "h-12 text-base" : "")}
          />
          {errors.confirmPassword && (
            <p className={cn(
              "text-destructive",
              isMobile ? "text-xs" : "text-sm"
            )}>
              {errors.confirmPassword.message}
            </p>
          )}
        </div>
      </div>
    );
  }
}; 