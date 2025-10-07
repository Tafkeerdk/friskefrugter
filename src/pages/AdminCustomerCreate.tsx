import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2, CheckCircle, AlertTriangle, MapPin, Truck, Copy, Key, Mail, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { authService } from '../lib/auth';
import { CVRInput } from '../components/ui/cvr-input';
import { DAWAAddressInput } from '../components/ui/dawa-address-input';
import { CVRData } from '../lib/cvr';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useToast } from '../hooks/use-toast';
import { Textarea } from '../components/ui/textarea';

const customerSchema = z.object({
  companyName: z.string().min(2, 'Virksomhedsnavn skal være mindst 2 tegn'),
  cvrNumber: z.string().min(8, 'CVR nummer er påkrævet'),
  contactPersonName: z.string().min(2, 'Kontaktperson navn skal være mindst 2 tegn'),
  email: z.string().regex(/^[a-zA-ZæøåÆØÅ0-9._+-]+@[a-zA-ZæøåÆØÅ0-9.-]+\.[a-zA-Z]{2,}$/, 'Ugyldig email adresse'),
  phone: z.string().min(8, 'Telefonnummer skal være mindst 8 cifre'),
  discountGroupId: z.string().min(1, 'Vælg en rabatgruppe'),
  useRegisteredAddressForDelivery: z.boolean().default(true),
  passwordOption: z.enum(['generate', 'link']),
  generatedPassword: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface DiscountGroup {
  id: string;
  name: string;
  description?: string;
  discountPercentage: number;
  color: string;
  customerCount: number;
  formattedDiscount: string;
}

const AdminCustomerCreate: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [discountGroups, setDiscountGroups] = useState<DiscountGroup[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [cvrNumber, setCvrNumber] = useState('');
  const [companyData, setCompanyData] = useState<CVRData | null>(null);
  const [isCvrValid, setIsCvrValid] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState<any>(null);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [createdCustomer, setCreatedCustomer] = useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      useRegisteredAddressForDelivery: true,
      passwordOption: 'generate',
    },
  });

  // Watch for company name changes and delivery address preference
  const watchedCompanyName = watch('companyName');
  const useRegisteredForDelivery = watch('useRegisteredAddressForDelivery');
  const passwordOption = watch('passwordOption');

  useEffect(() => {
    loadDiscountGroups();
  }, []);

  useEffect(() => {
    if (passwordOption === 'generate') {
      generatePassword();
    }
  }, [passwordOption]);

  const loadDiscountGroups = async () => {
    try {
      const response = await authService.getDiscountGroups();
      if (response.success) {
        setDiscountGroups(response.discountGroups as DiscountGroup[]);
        // Auto-select Standard group if available
        const standardGroup = (response.discountGroups as DiscountGroup[]).find(g => g.name === 'Standard');
        if (standardGroup) {
          setValue('discountGroupId', standardGroup.id);
        }
      }
    } catch (err) {
      console.error('Error loading discount groups:', err);
    }
  };

  const generatePassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setGeneratedPassword(password);
    setValue('generatedPassword', password);
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(generatedPassword);
      setPasswordCopied(true);
      toast({
        title: "Adgangskode kopieret",
        description: "Adgangskoden er kopieret til udklipsholderen",
      });
      setTimeout(() => setPasswordCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy password:', err);
    }
  };

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

  const handleDeliveryAddressChange = (value: string) => {
    const boolValue = value === 'true';
    setValue('useRegisteredAddressForDelivery', boolValue);
  };

  const onSubmit = async (data: CustomerFormData) => {
    console.log('🚀 Starting admin customer creation...');
    console.log('📋 Form data:', data);

    setIsLoading(true);
    setError(null);

    try {
      const customerData = {
        companyName: data.companyName,
        cvrNumber: data.cvrNumber,
        contactPersonName: data.contactPersonName,
        email: data.email,
        phone: data.phone,
        discountGroupId: data.discountGroupId,
        address: companyData?.address || undefined,
        deliveryAddress: data.useRegisteredAddressForDelivery ? companyData?.address : deliveryAddress,
        useRegisteredAddressForDelivery: data.useRegisteredAddressForDelivery,
        passwordOption: data.passwordOption,
        password: data.passwordOption === 'generate' ? generatedPassword : undefined,
      };

      console.log('📤 Sending customer creation data:', customerData);

      const response = await authService.createCustomerAsAdmin(customerData);
      console.log('📥 Customer creation response:', response);
      
      if (response.success) {
        console.log('✅ Customer created successfully!');
        setSuccess(true);
        setCreatedCustomer(response.customer);
        
        toast({
          title: "Kunde oprettet",
          description: `${data.companyName} er blevet oprettet som kunde`,
        });

        // Reset form if generating password, otherwise keep for reference
        if (data.passwordOption === 'link') {
          reset();
          setCvrNumber('');
          setCompanyData(null);
          setIsCvrValid(false);
          setDeliveryAddress(null);
        }
      } else {
        console.log('❌ Customer creation failed:', response.message);
        setError(response.message || 'Kunde oprettelse fejlede. Prøv igen.');
      }
    } catch (err: unknown) {
      console.error('❌ Customer creation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Der opstod en fejl. Prøv igen senere.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (success && passwordOption === 'generate') {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-brand-success" />
                <CardTitle className="text-brand-success">Kunde oprettet succesfuldt</CardTitle>
              </div>
              <CardDescription>
                Kunden er blevet oprettet og tildelt en adgangskode
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <strong>Vigtigt:</strong> Gem denne adgangskode sikkert. Den vil ikke blive vist igen!
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <Label className="font-semibold">Kunde information</Label>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                    <p><strong>Virksomhed:</strong> {createdCustomer?.companyName}</p>
                    <p><strong>Email:</strong> {createdCustomer?.email}</p>
                    <p><strong>CVR:</strong> {createdCustomer?.cvrNumber}</p>
                  </div>
                </div>

                <div>
                  <Label className="font-semibold">Adgangskode</Label>
                  <div className="mt-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="font-mono text-lg bg-white px-3 py-2 rounded border">
                        {showPassword ? generatedPassword : '••••••••••••'}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={copyPassword}
                          className={passwordCopied ? 'bg-brand-gray-100 border-brand-gray-200' : ''}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          {passwordCopied ? 'Kopieret!' : 'Kopier'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <Alert className="border-blue-200 bg-blue-50">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Send denne adgangskode til kunden via en sikker kanal (ikke email). 
                    Kunden kan logge ind på <strong>b2bengross.netlify.app/login</strong>
                  </AlertDescription>
                </Alert>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    setSuccess(false);
                    setCreatedCustomer(null);
                    setGeneratedPassword('');
                    generatePassword();
                  }}
                  className="flex-1"
                >
                  Opret ny kunde
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/admin/customers')}
                  className="flex-1"
                >
                  Tilbage til kunder
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/customers')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Tilbage til kunder
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Opret ny kunde</h1>
            <p className="text-muted-foreground">Tilføj en kunde direkte til systemet</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Kunde information</CardTitle>
            <CardDescription>
              Udfyld formularen for at oprette en ny kunde med øjeblikkelig adgang
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
              {/* CVR Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">CVR Validering</h3>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800 font-medium mb-1">
                    Indtast kundens 8-cifrede CVR nummer
                  </p>
                  <p className="text-xs text-blue-700">
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
              </div>

              {/* Company Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Virksomhedsoplysninger</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="companyName">
                    Virksomhedsnavn *
                    {companyData && (
                      <span className="text-xs text-brand-success ml-2">
                        (hentet fra CVR)
                      </span>
                    )}
                  </Label>
                  <Input
                    id="companyName"
                    placeholder="Kunde virksomhed ApS"
                    {...register('companyName')}
                    disabled={isLoading}
                    className={companyData ? 'bg-brand-gray-100 border-brand-gray-200' : ''}
                  />
                  {errors.companyName && (
                    <p className="text-sm text-destructive">{errors.companyName.message}</p>
                  )}
                </div>
              </div>

              {/* Delivery Address Configuration */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-gray-600" />
                  <h3 className="text-lg font-semibold">Leveringsadresse</h3>
                </div>
                
                {/* Registered Address Display */}
                {companyData?.address && (
                  <div className="bg-gray-50 p-4 rounded border">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-gray-900">Registreret adresse (fra CVR)</span>
                    </div>
                    <div className="text-sm text-gray-700">
                      <p>{companyData.address.street}</p>
                      <p>{companyData.address.postalCode} {companyData.address.city}</p>
                    </div>
                  </div>
                )}
                
                {/* Delivery Address Option */}
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
                    <Label htmlFor="use-registered" className="text-sm">
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
                    <Label htmlFor="use-different" className="text-sm">
                      Brug anden leveringsadresse
                    </Label>
                  </div>
                </div>
                
                {/* Different Delivery Address Input */}
                {useRegisteredForDelivery === false && (
                  <div className="mt-4 p-4 border border-blue-200 rounded-lg bg-blue-50">
                    <DAWAAddressInput
                      onAddressSelect={setDeliveryAddress}
                      label="Leveringsadresse"
                      placeholder="Søg efter leveringsadresse..."
                      disabled={isLoading}
                    />
                  </div>
                )}
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
                      placeholder="kontakt@kundevirksomhed.dk"
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

              {/* Offer Group Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Tilbudsgruppe</h3>
                <div className="space-y-2">
                  <Label htmlFor="discountGroupId">Tildel tilbudsgruppe *</Label>
                  <Select onValueChange={(value) => setValue('discountGroupId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Vælg tilbudsgruppe" />
                    </SelectTrigger>
                    <SelectContent>
                      {discountGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{group.name}</span>
                            <span className="ml-2 text-sm text-muted-foreground">
                              Tilbudsgruppe
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.discountGroupId && (
                    <p className="text-sm text-destructive">{errors.discountGroupId.message}</p>
                  )}
                </div>
              </div>

              {/* Password Options */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-gray-600" />
                  <h3 className="text-lg font-semibold">Adgangskode</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="generate-password"
                      value="generate"
                      {...register('passwordOption')}
                      className="h-4 w-4 text-blue-600"
                    />
                    <Label htmlFor="generate-password" className="text-sm">
                      Generer sikker adgangskode (vist til admin)
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="send-link"
                      value="link"
                      {...register('passwordOption')}
                      className="h-4 w-4 text-blue-600"
                    />
                    <Label htmlFor="send-link" className="text-sm">
                      Send link til kunden for at oprette adgangskode
                    </Label>
                  </div>
                </div>

                {passwordOption === 'generate' && (
                  <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-medium">Genereret adgangskode</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={generatePassword}
                      >
                        Generer ny
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="font-mono text-sm bg-white px-3 py-2 rounded border flex-1">
                        {showPassword ? generatedPassword : '••••••••••••'}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={copyPassword}
                        className={passwordCopied ? 'bg-brand-gray-100 border-brand-gray-200' : ''}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-yellow-700 mt-2">
                      Denne adgangskode vil kun blive vist denne ene gang. Gem den sikkert!
                    </p>
                  </div>
                )}

                {passwordOption === 'link' && (
                  <Alert className="border-blue-200 bg-blue-50">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      Kunden vil modtage en email med et link til at oprette deres egen adgangskode.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/customers')}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Annuller
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Opretter kunde...
                    </>
                  ) : (
                    'Opret kunde'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminCustomerCreate; 