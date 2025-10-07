import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authService, isCustomer } from '../lib/auth';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Separator } from '../components/ui/separator';
import { Checkbox } from '../components/ui/checkbox';
import { DAWAAddressInput } from '../components/ui/dawa-address-input';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { 
  User, 
  Mail, 
  Lock, 
  Camera, 
  Save, 
  Loader2,
  Upload,
  Eye,
  EyeOff,
  Building,
  Phone,
  MapPin,
  Truck,
  ArrowLeft,
  Send,
  CheckCircle,
  AlertTriangle,
  Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect if not customer
  useEffect(() => {
    if (user && !isCustomer(user)) {
      navigate('/admin/profile');
    } else if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Form states
  const [formData, setFormData] = useState({
    contactPersonName: user?.contactPersonName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: {
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      postalCode: user?.address?.postalCode || '',
      country: user?.address?.country || 'Danmark'
    },
    deliveryAddress: {
      street: user?.deliveryAddress?.street || '',
      city: user?.deliveryAddress?.city || '',
      postalCode: user?.deliveryAddress?.postalCode || '',
      country: user?.deliveryAddress?.country || 'Danmark'
    },
    useRegisteredAddressForDelivery: user?.useRegisteredAddressForDelivery !== false,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    verificationCode: ''
  });

  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Email change verification states
  const [emailChangeState, setEmailChangeState] = useState({
    requiresVerification: false,
    verificationSent: false,
    isGeneratingCode: false,
    originalEmail: user?.email || ''
  });

  // Password change dialog states
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordDialogState, setPasswordDialogState] = useState({
    step: 'prompt' as 'prompt' | 'verification' | 'password_form',
    requiresVerification: false,
    verificationSent: false,
    verificationCode: '',
    isGeneratingCode: false,
    error: null as string | null,
    success: null as string | null
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        contactPersonName: user.contactPersonName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: {
          street: user.address?.street || '',
          city: user.address?.city || '',
          postalCode: user.address?.postalCode || '',
          country: user.address?.country || 'Danmark'
        },
        deliveryAddress: {
          street: user.deliveryAddress?.street || '',
          city: user.deliveryAddress?.city || '',
          postalCode: user.deliveryAddress?.postalCode || '',
          country: user.deliveryAddress?.country || 'Danmark'
        },
        useRegisteredAddressForDelivery: user.useRegisteredAddressForDelivery !== false
      }));
      setImageLoadError(false);
      setEmailChangeState(prev => ({ ...prev, originalEmail: user.email || '' }));
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev] as any,
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    setError(null);
    setSuccess(null);
    
    // Reset email verification state if email is changed back
    if (field === 'email' && value === emailChangeState.originalEmail) {
      setEmailChangeState(prev => ({
        ...prev,
        requiresVerification: false,
        verificationSent: false
      }));
    }
  };

  const handleDAWAAddressSelect = (addressData: any) => {
    if (addressData) {
      setFormData(prev => ({
        ...prev,
        deliveryAddress: {
          street: addressData.street || '',
          city: addressData.city || '',
          postalCode: addressData.postalCode || '',
          country: 'Danmark'
        }
      }));
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const isEmailChange = formData.email !== emailChangeState.originalEmail;

      const updateData: any = {
        contactPersonName: formData.contactPersonName,
        phone: formData.phone,
        address: formData.address,
        deliveryAddress: formData.deliveryAddress,
        useRegisteredAddressForDelivery: formData.useRegisteredAddressForDelivery
      };

      // Add email if it's being changed
      if (isEmailChange) {
        updateData.email = formData.email;
      }

      // Add verification code if provided for email change
      if (formData.verificationCode && emailChangeState.requiresVerification) {
        updateData.verificationCode = formData.verificationCode;
      }

      console.log('🔄 Submitting customer profile update:', { 
        isEmailChange, 
        hasVerificationCode: !!formData.verificationCode,
        requiresVerification: emailChangeState.requiresVerification 
      });

      const response = await authService.updateCustomerProfile(updateData);
      
      if (response.success) {
        if (isEmailChange) {
          setSuccess('📧 Email adresse opdateret succesfuldt!');
          setEmailChangeState(prev => ({ 
            ...prev, 
            originalEmail: formData.email,
            requiresVerification: false,
            verificationSent: false
          }));
        } else {
          setSuccess('Profil opdateret succesfuldt');
        }
        
        setFormData(prev => ({ ...prev, verificationCode: '' }));
        await refreshUser();
      } else if (response.requiresVerification) {
        // Email change requires verification
        console.log('🔐 Email change requires verification');
        setEmailChangeState(prev => ({ 
          ...prev, 
          requiresVerification: true 
        }));
        setError('Email ændring kræver verifikation. Tjek din nuværende email for koden.');
      } else {
        setError(response.message || 'Opdatering fejlede');
      }
    } catch (err: any) {
      setError(err.message || 'Der opstod en fejl');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateEmailVerificationCode = async () => {
    setEmailChangeState(prev => ({ ...prev, isGeneratingCode: true }));
    setError(null);

    try {
      const response = await authService.generateCustomerVerificationCode('email_change', formData.email);
      
      if (response.success) {
        setEmailChangeState(prev => ({
          ...prev,
          verificationSent: true,
          requiresVerification: true
        }));
        setSuccess(response.message);
      } else {
        setError(response.message || 'Kunne ikke sende verifikationskode');
      }
    } catch (err: any) {
      setError(err.message || 'Kunne ikke sende verifikationskode');
    } finally {
      setEmailChangeState(prev => ({ ...prev, isGeneratingCode: false }));
    }
  };

  // Password change dialog functions
  const handlePasswordDialogOpen = () => {
    setIsPasswordDialogOpen(true);
    setPasswordDialogState({
      step: 'prompt',
      requiresVerification: false,
      verificationSent: false,
      verificationCode: '',
      isGeneratingCode: false,
      error: null,
      success: null
    });
  };

  const handleStart2FAVerification = async () => {
    setPasswordDialogState(prev => ({ 
      ...prev, 
      isGeneratingCode: true, 
      error: null,
      step: 'verification'
    }));

    try {
      const response = await authService.generateCustomerVerificationCode('password_change');
      
      if (response.success) {
        setPasswordDialogState(prev => ({ 
          ...prev, 
          verificationSent: true,
          success: response.message,
          requiresVerification: true
        }));
      } else {
        setPasswordDialogState(prev => ({ 
          ...prev, 
          error: response.message || 'Kunne ikke sende verifikationskode',
          step: 'prompt'
        }));
      }
    } catch (err: any) {
      setPasswordDialogState(prev => ({ 
        ...prev, 
        error: err.message || 'Kunne ikke sende verifikationskode',
        step: 'prompt'
      }));
    } finally {
      setPasswordDialogState(prev => ({ ...prev, isGeneratingCode: false }));
    }
  };

  const handleVerify2FACode = async () => {
    if (!passwordDialogState.verificationCode) {
      setPasswordDialogState(prev => ({ 
        ...prev, 
        error: 'Indtast verifikationskoden' 
      }));
      return;
    }

    setPasswordDialogState(prev => ({ ...prev, isGeneratingCode: true, error: null }));

    try {
      const response = await authService.verifyCustomerCode(passwordDialogState.verificationCode);
      
      if (response.success && response.verificationType === 'password_change') {
        setPasswordDialogState(prev => ({ 
          ...prev, 
          step: 'password_form',
          success: 'Verifikation succesfuld! Du kan nu ændre din adgangskode.',
          error: null
        }));
      } else {
        setPasswordDialogState(prev => ({ 
          ...prev, 
          error: response.message || 'Verifikation fejlede' 
        }));
      }
    } catch (err: any) {
      setPasswordDialogState(prev => ({ 
        ...prev, 
        error: err.message || 'Verifikation fejlede' 
      }));
    } finally {
      setPasswordDialogState(prev => ({ ...prev, isGeneratingCode: false }));
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setPasswordDialogState(prev => ({ ...prev, error: null, success: null }));
    
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setPasswordDialogState(prev => ({ ...prev, error: 'Alle password felter skal udfyldes' }));
      return;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      setPasswordDialogState(prev => ({ ...prev, error: 'Nye adgangskoder matcher ikke' }));
      return;
    }
    
    if (formData.newPassword.length < 6) {
      setPasswordDialogState(prev => ({ ...prev, error: 'Ny adgangskode skal være mindst 6 tegn' }));
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.updateCustomerProfile({
        contactPersonName: formData.contactPersonName,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        verificationCode: passwordDialogState.verificationCode
      });
      
      if (response.success) {
        setPasswordDialogState(prev => ({ 
          ...prev, 
          success: '🔐 Adgangskode ændret succesfuldt!'
        }));
        
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
        
        await refreshUser();
        
        setTimeout(() => {
          setIsPasswordDialogOpen(false);
          setPasswordDialogState(prev => ({ 
            ...prev, 
            success: null,
            step: 'prompt'
          }));
        }, 3000);
        
      } else {
        setPasswordDialogState(prev => ({ 
          ...prev, 
          error: response.message || 'Password ændring fejlede' 
        }));
      }
    } catch (err: any) {
      setPasswordDialogState(prev => ({ 
        ...prev, 
        error: err.message || 'Der opstod en fejl' 
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('📸 Customer image upload started:', file.name, file.size, file.type);

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setError('Kun JPEG, PNG og WebP billeder er tilladt');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Billedet er for stort (max 5MB)');
      return;
    }

    setIsUploadingImage(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('📤 Uploading customer image...');
      const response = await authService.uploadCustomerProfilePicture(file);
      
      console.log('📥 Customer upload response:', response);
      
      if (response.success) {
        setSuccess('Profilbillede opdateret succesfuldt');
        await refreshUser();
      } else {
        console.error('❌ Customer upload failed:', response.message);
        setError(response.message || 'Upload fejlede');
      }
    } catch (err: any) {
      console.error('❌ Customer upload error:', err);
      setError(err.message || 'Upload fejlede - tjek din internetforbindelse');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getUserInitials = () => {
    return user?.contactPersonName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'KU';
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handlePasswordDialogChange = (open: boolean) => {
    setIsPasswordDialogOpen(open);
    if (!open) {
      setPasswordDialogState({
        step: 'prompt',
        requiresVerification: false,
        verificationSent: false,
        verificationCode: '',
        isGeneratingCode: false,
        error: null,
        success: null
      });
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    }
  };

  if (!user || !isCustomer(user)) {
    return null;
  }

  const isEmailChange = formData.email !== emailChangeState.originalEmail;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow">
        <div className="page-container py-8">
          <div className="content-width">
            {/* Back button */}
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="mb-6 text-brand-gray-600 hover:text-brand-primary"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tilbage til dashboard
            </Button>

            <div className="space-y-6">
              {/* Profile Header */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Min Profil
                  </CardTitle>
                  <CardDescription>
                    Administrer dine profiloplysninger og indstillinger
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile Picture Section */}
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Avatar className="h-20 w-20">
                        <AvatarImage 
                          src={!imageLoadError ? user.profilePictureUrl : undefined} 
                          alt={user.contactPersonName}
                          enableCacheBusting={true}
                          onError={() => {
                            console.warn('⚠️ Customer profile image failed to load:', user.profilePictureUrl);
                            setImageLoadError(true);
                          }}
                          onLoad={() => {
                            console.log('✅ Customer profile image loaded successfully:', user.profilePictureUrl);
                            setImageLoadError(false);
                          }}
                        />
                        <AvatarFallback className="text-lg">{getUserInitials()}</AvatarFallback>
                      </Avatar>
                      <Button
                        size="sm"
                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full btn-brand-primary"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingImage}
                      >
                        {isUploadingImage ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{user.contactPersonName}</h3>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                      <p className="text-sm text-muted-foreground">{user.companyName}</p>
                      {user.discountGroup && (
                        <p className="text-sm text-brand-primary">
                          Tilbudsgruppe: {
                            typeof user.discountGroup === 'object' && user.discountGroup
                              ? `${user.discountGroup.name}`
                              : (typeof user.discountGroup === 'string' ? user.discountGroup : 'Standard')
                          }
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Success/Error Messages */}
                  {success && (
                    <Alert className="border-brand-success bg-brand-success/10">
                      <CheckCircle className="h-4 w-4 text-brand-success" />
                      <AlertDescription className="text-brand-success">{success}</AlertDescription>
                    </Alert>
                  )}
                  
                  {error && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Separator />

                  {/* Profile Form */}
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Basic Information */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-medium">Grundoplysninger</h4>
                        
                        <div className="space-y-2">
                          <Label htmlFor="contactPersonName">Kontaktperson *</Label>
                          <Input
                            id="contactPersonName"
                            value={formData.contactPersonName}
                            onChange={(e) => handleInputChange('contactPersonName', e.target.value)}
                            required
                            className="input-brand"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            required
                            className="input-brand"
                          />
                          {isEmailChange && (
                            <p className="text-sm text-brand-warning">
                              ⚠️ Email ændring kræver verifikation
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone">Telefon</Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            className="input-brand"
                          />
                        </div>
                      </div>

                      {/* Company Information - Read-only CVR data */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-medium">Virksomhedsoplysninger</h4>
                        
                        <div className="space-y-2">
                          <Label>Virksomhed</Label>
                          <Input 
                            value={user.companyName || ''} 
                            disabled 
                            className="bg-brand-gray-50 text-brand-gray-600"
                          />
                          <p className="text-xs text-brand-gray-500">
                            Virksomhedsoplysninger fra CVR-registret (kun læsning)
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label>CVR-nummer</Label>
                          <Input 
                            value={user.cvrNumber || ''} 
                            disabled 
                            className="bg-brand-gray-50 text-brand-gray-600"
                          />
                          <p className="text-xs text-brand-gray-500">
                            CVR-nummer kan ikke ændres
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Email Verification Section */}
                    {emailChangeState.requiresVerification && (
                      <Card className="border-brand-warning bg-brand-warning/5">
                        <CardHeader>
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Mail className="h-4 w-4 text-brand-warning" />
                            Email Verifikation Påkrævet
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-sm text-brand-gray-600">
                            For at ændre din email til <strong>{formData.email}</strong>, skal du bekræfte med en verifikationskode sendt til din nuværende email ({emailChangeState.originalEmail}).
                          </p>
                          
                          {!emailChangeState.verificationSent ? (
                            <Button
                              type="button"
                              onClick={handleGenerateEmailVerificationCode}
                              disabled={emailChangeState.isGeneratingCode}
                              className="btn-brand-secondary"
                            >
                              {emailChangeState.isGeneratingCode ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Sender kode...
                                </>
                              ) : (
                                <>
                                  <Send className="h-4 w-4 mr-2" />
                                  Send verifikationskode
                                </>
                              )}
                            </Button>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-brand-success">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-sm">Verifikationskode sendt til {emailChangeState.originalEmail}</span>
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="verificationCode">Verifikationskode</Label>
                                <Input
                                  id="verificationCode"
                                  value={formData.verificationCode}
                                  onChange={(e) => handleInputChange('verificationCode', e.target.value)}
                                  placeholder="Indtast 6-cifret kode"
                                  maxLength={6}
                                  className="input-brand max-w-xs"
                                />
                              </div>
                              
                              <Button
                                type="button"
                                variant="outline"
                                onClick={handleGenerateEmailVerificationCode}
                                disabled={emailChangeState.isGeneratingCode}
                                size="sm"
                              >
                                Gensend kode
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Address Information */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Adresseoplysninger
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Registered Address - Read-only from CVR */}
                        <div className="space-y-4">
                          <h5 className="font-medium">Registreret adresse (CVR)</h5>
                          <p className="text-xs text-brand-gray-500 mb-3">
                            Adresse fra CVR-registret (kun læsning)
                          </p>
                          
                          <div className="space-y-2">
                            <Label>Gade og nummer</Label>
                            <Input
                              value={formData.address.street}
                              disabled
                              className="bg-brand-gray-50 text-brand-gray-600"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                              <Label>Postnummer</Label>
                              <Input
                                value={formData.address.postalCode}
                                disabled
                                className="bg-brand-gray-50 text-brand-gray-600"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>By</Label>
                              <Input
                                value={formData.address.city}
                                disabled
                                className="bg-brand-gray-50 text-brand-gray-600"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Delivery Address */}
                        <div className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="useRegisteredAddress"
                              checked={formData.useRegisteredAddressForDelivery}
                              onCheckedChange={(checked) => 
                                setFormData(prev => ({ ...prev, useRegisteredAddressForDelivery: checked as boolean }))
                              }
                            />
                            <Label htmlFor="useRegisteredAddress" className="flex items-center gap-2">
                              <Truck className="h-4 w-4" />
                              Brug registreret adresse til levering
                            </Label>
                          </div>

                          {!formData.useRegisteredAddressForDelivery && (
                            <>
                              <h5 className="font-medium">Leveringsadresse</h5>
                              <p className="text-xs text-brand-gray-500 mb-3">
                                Brug adressesøgning for at vælge din leveringsadresse
                              </p>
                              
                              <div className="space-y-3">
                                <DAWAAddressInput
                                  onAddressSelect={handleDAWAAddressSelect}
                                  placeholder="Søg leveringsadresse..."
                                />
                                
                                {/* Show selected address for confirmation */}
                                {formData.deliveryAddress.street && (
                                  <div className="p-3 bg-brand-gray-50 rounded-lg border">
                                    <div className="flex items-center gap-2 text-brand-primary mb-1">
                                      <MapPin className="h-4 w-4" />
                                      <span className="font-medium text-sm">Valgt leveringsadresse:</span>
                                    </div>
                                    <p className="text-sm text-brand-gray-700">
                                      {formData.deliveryAddress.street}<br />
                                      {formData.deliveryAddress.postalCode} {formData.deliveryAddress.city}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      <Button 
                        type="submit" 
                        disabled={isLoading}
                        className="btn-brand-primary"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Gemmer...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Gem ændringer
                          </>
                        )}
                      </Button>

                      {/* Password Change Dialog */}
                      <Dialog open={isPasswordDialogOpen} onOpenChange={handlePasswordDialogChange}>
                        <DialogTrigger asChild>
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={handlePasswordDialogOpen}
                            className="border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white"
                          >
                            <Lock className="h-4 w-4 mr-2" />
                            Skift password
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Shield className="h-5 w-5 text-brand-primary" />
                              Skift Password
                            </DialogTitle>
                            <DialogDescription>
                              {passwordDialogState.step === 'prompt' && 'Af sikkerhedsmæssige årsager kræver password ændringer 2-faktor autentificering.'}
                              {passwordDialogState.step === 'verification' && 'Indtast verifikationskoden sendt til din email.'}
                              {passwordDialogState.step === 'password_form' && 'Indtast dit nuværende og nye password.'}
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-4">
                            {/* Step 1: Prompt for 2FA */}
                            {passwordDialogState.step === 'prompt' && (
                              <div className="space-y-4">
                                <div className="bg-brand-gray-50 p-4 rounded-lg">
                                  <div className="flex items-center gap-2 text-brand-primary mb-2">
                                    <Shield className="h-4 w-4" />
                                    <span className="font-medium">Sikkerhed først</span>
                                  </div>
                                  <p className="text-sm text-brand-gray-600">
                                    Vi sender en verifikationskode til din email ({user?.email}) for at bekræfte din identitet.
                                  </p>
                                </div>
                                
                                <Button
                                  onClick={handleStart2FAVerification}
                                  disabled={passwordDialogState.isGeneratingCode}
                                  className="w-full btn-brand-primary"
                                >
                                  {passwordDialogState.isGeneratingCode ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Sender kode...
                                    </>
                                  ) : (
                                    <>
                                      <Send className="h-4 w-4 mr-2" />
                                      Send verifikationskode
                                    </>
                                  )}
                                </Button>
                              </div>
                            )}

                            {/* Step 2: Verification Code */}
                            {passwordDialogState.step === 'verification' && (
                              <div className="space-y-4">
                                {passwordDialogState.verificationSent && (
                                  <div className="flex items-center gap-2 text-brand-success text-sm">
                                    <CheckCircle className="h-4 w-4" />
                                    <span>Verifikationskode sendt til {user?.email}</span>
                                  </div>
                                )}
                                
                                <div className="space-y-2">
                                  <Label htmlFor="passwordVerificationCode">Verifikationskode</Label>
                                  <Input
                                    id="passwordVerificationCode"
                                    value={passwordDialogState.verificationCode}
                                    onChange={(e) => setPasswordDialogState(prev => ({ 
                                      ...prev, 
                                      verificationCode: e.target.value 
                                    }))}
                                    placeholder="Indtast 6-cifret kode"
                                    maxLength={6}
                                    className="input-brand"
                                  />
                                </div>
                                
                                <div className="flex gap-2">
                                  <Button
                                    onClick={handleVerify2FACode}
                                    disabled={passwordDialogState.isGeneratingCode || !passwordDialogState.verificationCode}
                                    className="btn-brand-primary flex-1"
                                  >
                                    {passwordDialogState.isGeneratingCode ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Verificerer...
                                      </>
                                    ) : (
                                      'Verificer kode'
                                    )}
                                  </Button>
                                  
                                  <Button
                                    variant="outline"
                                    onClick={handleStart2FAVerification}
                                    disabled={passwordDialogState.isGeneratingCode}
                                  >
                                    Gensend
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Step 3: Password Form */}
                            {passwordDialogState.step === 'password_form' && (
                              <form onSubmit={handlePasswordChange} className="space-y-4">
                                {passwordDialogState.success && (
                                  <Alert className="border-brand-success bg-brand-success/10">
                                    <CheckCircle className="h-4 w-4 text-brand-success" />
                                    <AlertDescription className="text-brand-success">
                                      {passwordDialogState.success}
                                    </AlertDescription>
                                  </Alert>
                                )}
                                
                                <div className="space-y-2">
                                  <Label htmlFor="currentPassword">Nuværende password</Label>
                                  <div className="relative">
                                    <Input
                                      id="currentPassword"
                                      type={showPasswords.current ? 'text' : 'password'}
                                      value={formData.currentPassword}
                                      onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                                      className="input-brand pr-10"
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                      onClick={() => togglePasswordVisibility('current')}
                                    >
                                      {showPasswords.current ? (
                                        <EyeOff className="h-4 w-4" />
                                      ) : (
                                        <Eye className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="newPassword">Nyt password</Label>
                                  <div className="relative">
                                    <Input
                                      id="newPassword"
                                      type={showPasswords.new ? 'text' : 'password'}
                                      value={formData.newPassword}
                                      onChange={(e) => handleInputChange('newPassword', e.target.value)}
                                      className="input-brand pr-10"
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                      onClick={() => togglePasswordVisibility('new')}
                                    >
                                      {showPasswords.new ? (
                                        <EyeOff className="h-4 w-4" />
                                      ) : (
                                        <Eye className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="confirmPassword">Bekræft nyt password</Label>
                                  <div className="relative">
                                    <Input
                                      id="confirmPassword"
                                      type={showPasswords.confirm ? 'text' : 'password'}
                                      value={formData.confirmPassword}
                                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                      className="input-brand pr-10"
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                      onClick={() => togglePasswordVisibility('confirm')}
                                    >
                                      {showPasswords.confirm ? (
                                        <EyeOff className="h-4 w-4" />
                                      ) : (
                                        <Eye className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                </div>

                                <Button 
                                  type="submit" 
                                  disabled={isLoading}
                                  className="w-full btn-brand-primary"
                                >
                                  {isLoading ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Opdaterer...
                                    </>
                                  ) : (
                                    <>
                                      <Lock className="h-4 w-4 mr-2" />
                                      Opdater password
                                    </>
                                  )}
                                </Button>
                              </form>
                            )}

                            {/* Error Display */}
                            {passwordDialogState.error && (
                              <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>{passwordDialogState.error}</AlertDescription>
                              </Alert>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </form>
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

export default Profile; 