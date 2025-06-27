import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
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
  Send,
  CheckCircle,
  AlertTriangle,
  Shield
} from 'lucide-react';

export const AdminProfile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
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
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  // Verification states for main profile (email changes)
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [verificationType, setVerificationType] = useState<'email_change' | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationExpiry, setVerificationExpiry] = useState<Date | null>(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  // Separate verification states for password dialog
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
        name: user.name || '',
        email: user.email || ''
      }));
      // Reset image load error when user data changes
      setImageLoadError(false);
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updateData: any = {
        name: formData.name
      };

      const isEmailChange = formData.email !== user?.email;

      // Add email if it's being changed
      if (isEmailChange) {
        updateData.email = formData.email;
      }

      // Add verification code if provided
      if (formData.verificationCode) {
        updateData.verificationCode = formData.verificationCode;
      }

      console.log('🔄 Submitting profile update:', { 
        isEmailChange, 
        hasVerificationCode: !!formData.verificationCode,
        requiresVerification 
      });

      const response = await authService.updateAdminProfile(updateData);
      
      if (response.success) {
        // Set specific success message based on what was changed
        if (isEmailChange) {
          setSuccess('📧 Email adresse opdateret succesfuldt!');
        } else {
          setSuccess(response.message);
        }
        
        setFormData(prev => ({
          ...prev,
          verificationCode: ''
        }));
        setRequiresVerification(false);
        setVerificationSent(false);
        setVerificationType(null);
        await refreshUser();
        
        // Show success message for normal duration
        setTimeout(() => setSuccess(null), 5000);
      } else if (response.requiresVerification) {
        // Show verification requirement for email changes
        console.log('🔐 Verification required:', response.changeType);
        setRequiresVerification(true);
        setVerificationType(response.changeType as 'email_change');
        setError(response.message);
      } else {
        setError(response.message || 'Opdatering fejlede');
      }
    } catch (err: any) {
      setError(err.message || 'Der opstod en fejl');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to initiate password change flow with 2FA prompt
  const handlePasswordDialogOpen = () => {
    setIsPasswordDialogOpen(true);
    // Reset to prompt step
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

  // Function to start 2FA verification for password change
  const handleStart2FAVerification = async () => {
    setPasswordDialogState(prev => ({ 
      ...prev, 
      isGeneratingCode: true, 
      error: null,
      step: 'verification'
    }));

    try {
      const response = await authService.generateVerificationCode('password_change');
      
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
          step: 'prompt' // Go back to prompt on error
        }));
      }
    } catch (err: any) {
      setPasswordDialogState(prev => ({ 
        ...prev, 
        error: err.message || 'Der opstod en fejl',
        step: 'prompt' // Go back to prompt on error
      }));
    } finally {
      setPasswordDialogState(prev => ({ ...prev, isGeneratingCode: false }));
    }
  };

  // Function to verify 2FA code and proceed to password form
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
      // Verify the code using the verification endpoint
      const response = await authService.verifyCode(passwordDialogState.verificationCode);
      
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
        error: err.message || 'Der opstod en fejl under verifikation' 
      }));
    } finally {
      setPasswordDialogState(prev => ({ ...prev, isGeneratingCode: false }));
    }
  };

  // Separate handler for password dialog submission
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setPasswordDialogState(prev => ({ ...prev, error: null, success: null }));
    
    // Validation
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
      const updateData: any = {
        name: user?.name || '',
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        verificationCode: passwordDialogState.verificationCode // Use the verified code
      };

      console.log('🔑 Submitting password change with verified code');

      const response = await authService.updateAdminProfile(updateData);
      
      if (response.success) {
        setPasswordDialogState(prev => ({ 
          ...prev, 
          success: '🔐 Adgangskode ændret succesfuldt! Du er nu logget ind med den nye adgangskode.',
          error: null
        }));
        
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
        
        await refreshUser();
        
        // Close dialog after a delay to show success message
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
          error: response.message || 'Opdatering fejlede' 
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

  const handleGenerateVerificationCode = async () => {
    if (!verificationType) return;

    setIsGeneratingCode(true);
    setError(null);

    try {
      const newEmail = verificationType === 'email_change' ? formData.email : undefined;
      const response = await authService.generateVerificationCode(verificationType, newEmail);
      
      if (response.success) {
        setVerificationSent(true);
        setVerificationExpiry(new Date(Date.now() + (response.expiresIn || 10) * 60 * 1000));
        setSuccess(response.message);
      } else {
        setError(response.message || 'Kunne ikke sende verifikationskode');
      }
    } catch (err: any) {
      setError(err.message || 'Der opstod en fejl');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  // Separate function for password dialog verification code generation (resend)
  const handlePasswordVerificationCode = async () => {
    setPasswordDialogState(prev => ({ ...prev, isGeneratingCode: true, error: null }));

    try {
      const response = await authService.generateVerificationCode('password_change');
      
      if (response.success) {
        setPasswordDialogState(prev => ({ 
          ...prev, 
          verificationSent: true,
          success: response.message 
        }));
      } else {
        setPasswordDialogState(prev => ({ 
          ...prev, 
          error: response.message || 'Kunne ikke sende verifikationskode' 
        }));
      }
    } catch (err: any) {
      setPasswordDialogState(prev => ({ 
        ...prev, 
        error: err.message || 'Der opstod en fejl' 
      }));
    } finally {
      setPasswordDialogState(prev => ({ ...prev, isGeneratingCode: false }));
    }
  };

  const getVerificationMessage = () => {
    if (!verificationType) return '';
    
    switch (verificationType) {
      case 'email_change':
        return `For at ændre din email til ${formData.email}, skal du bekræfte med en verifikationskode sendt til din nuværende email (${user?.email}).`;
      default:
        return 'Du skal bekræfte denne ændring med en verifikationskode.';
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('📸 Image upload started:', file.name, file.size, file.type);

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
      console.log('📤 Uploading image...');
      const response = await authService.uploadAdminProfilePicture(file);
      
      console.log('📥 Upload response:', response);
      
      if (response.success) {
        setSuccess('Profilbillede opdateret succesfuldt');
        await refreshUser();
      } else {
        console.error('❌ Upload failed:', response.message);
        setError(response.message || 'Upload fejlede');
      }
    } catch (err: any) {
      console.error('❌ Upload error:', err);
      setError(err.message || 'Upload fejlede - tjek din internetforbindelse');
    } finally {
      setIsUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getUserInitials = () => {
    return user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'AD';
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Reset password dialog state when dialog opens/closes
  const handlePasswordDialogChange = (open: boolean) => {
    setIsPasswordDialogOpen(open);
    if (!open) {
      // Reset password dialog state when closing
      setPasswordDialogState({
        step: 'prompt',
        requiresVerification: false,
        verificationSent: false,
        verificationCode: '',
        isGeneratingCode: false,
        error: null,
        success: null
      });
      // Also reset password form fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Admin Profil
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
                  alt={user.name}
                  enableCacheBusting={true}
                  onError={() => {
                    console.warn('⚠️ Profile image failed to load:', user.profilePictureUrl);
                    setImageLoadError(true);
                  }}
                  onLoad={() => {
                    console.log('✅ Profile image loaded successfully:', user.profilePictureUrl);
                    setImageLoadError(false);
                  }}
                />
                <AvatarFallback className="text-lg">{getUserInitials()}</AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
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
              <h3 className="text-lg font-semibold">{user.name}</h3>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <p className="text-sm text-muted-foreground">
                Rolle: {user.role || 'Administrator'}
              </p>
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <Alert className="border-brand-gray-200 bg-brand-gray-100">
              <AlertDescription className="text-brand-primary-dark">{success}</AlertDescription>
            </Alert>
          )}
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Separator />

          {/* Profile Form */}
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Fulde navn</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="pl-10"
                    placeholder="Dit fulde navn"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email adresse</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="pl-10"
                    placeholder="din@email.dk"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Verification Section */}
            {requiresVerification && (
              <div className="space-y-4 p-4 border border-orange-200 bg-orange-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-orange-900">Sikkerhedsverifikation påkrævet</h4>
                    <p className="text-sm text-orange-700 mt-1">
                      {getVerificationMessage()}
                    </p>
                  </div>
                </div>

                {!verificationSent ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerateVerificationCode}
                    disabled={isGeneratingCode}
                    className="border-orange-300 text-orange-700 hover:bg-orange-100"
                  >
                    {isGeneratingCode ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sender kode...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send verifikationskode
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-brand-primary-dark">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Verifikationskode sendt til din email</span>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="verificationCode">Verifikationskode</Label>
                      <div className="relative">
                        <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="verificationCode"
                          type="text"
                          value={formData.verificationCode}
                          onChange={(e) => handleInputChange('verificationCode', e.target.value)}
                          className="pl-10"
                          placeholder="Indtast 6-cifret kode"
                          maxLength={6}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Koden udløber om 10 minutter
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleGenerateVerificationCode}
                      disabled={isGeneratingCode}
                      className="text-orange-600 hover:text-orange-700"
                    >
                      Send ny kode
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between items-center">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Opdaterer...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Gem ændringer
                  </>
                )}
              </Button>

              <Dialog open={isPasswordDialogOpen} onOpenChange={handlePasswordDialogChange}>
                <DialogTrigger asChild>
                  <Button variant="outline" onClick={handlePasswordDialogOpen}>
                    <Lock className="mr-2 h-4 w-4" />
                    Skift adgangskode
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {passwordDialogState.step === 'prompt' && 'Sikkerhedsverifikation påkrævet'}
                      {passwordDialogState.step === 'verification' && 'Indtast verifikationskode'}
                      {passwordDialogState.step === 'password_form' && 'Skift adgangskode'}
                    </DialogTitle>
                    <DialogDescription>
                      {passwordDialogState.step === 'prompt' && 'For sikkerhed skal vi verificere din identitet. En verifikationskode vil blive sendt til din email.'}
                      {passwordDialogState.step === 'verification' && 'Indtast den 6-cifrede kode sendt til din email for at fortsætte.'}
                      {passwordDialogState.step === 'password_form' && 'Indtast din nuværende adgangskode og den nye adgangskode'}
                    </DialogDescription>
                  </DialogHeader>
                  
                  {/* Error/Success Messages in Dialog */}
                  {passwordDialogState.error && (
                    <Alert variant="destructive">
                      <AlertDescription>{passwordDialogState.error}</AlertDescription>
                    </Alert>
                  )}
                  
                  {passwordDialogState.success && (
                    <Alert className="border-brand-gray-200 bg-brand-gray-100">
                      <AlertDescription className="text-brand-primary-dark">{passwordDialogState.success}</AlertDescription>
                    </Alert>
                  )}

                  {/* Step 1: Security Prompt */}
                  {passwordDialogState.step === 'prompt' && (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-4 border border-orange-200 bg-orange-50 rounded-lg">
                        <Shield className="h-5 w-5 text-orange-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-orange-900">Sikkerhedsverifikation</h4>
                          <p className="text-sm text-orange-700 mt-1">
                            For at beskytte din konto kræver vi email-verifikation før adgangskode kan ændres.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3 justify-end">
                        <Button 
                          variant="outline" 
                          onClick={() => setIsPasswordDialogOpen(false)}
                        >
                          Annuller
                        </Button>
                        <Button 
                          onClick={handleStart2FAVerification}
                          disabled={passwordDialogState.isGeneratingCode}
                        >
                          {passwordDialogState.isGeneratingCode ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Sender kode...
                            </>
                          ) : (
                            <>
                              <Send className="mr-2 h-4 w-4" />
                              Send verifikationskode
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Verification Code Input */}
                  {passwordDialogState.step === 'verification' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-brand-primary-dark mb-4">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">Verifikationskode sendt til din email</span>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="passwordVerificationCode">Verifikationskode</Label>
                        <div className="relative">
                          <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="passwordVerificationCode"
                            type="text"
                            value={passwordDialogState.verificationCode}
                            onChange={(e) => setPasswordDialogState(prev => ({ 
                              ...prev, 
                              verificationCode: e.target.value 
                            }))}
                            className="pl-10"
                            placeholder="Indtast 6-cifret kode"
                            maxLength={6}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Koden udløber om 10 minutter
                        </p>
                      </div>

                      <div className="flex gap-3 justify-between">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handlePasswordVerificationCode}
                          disabled={passwordDialogState.isGeneratingCode}
                          className="text-orange-600 hover:text-orange-700"
                        >
                          Send ny kode
                        </Button>
                        
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            onClick={() => setPasswordDialogState(prev => ({ ...prev, step: 'prompt' }))}
                          >
                            Tilbage
                          </Button>
                          <Button 
                            onClick={handleVerify2FACode}
                            disabled={passwordDialogState.isGeneratingCode || !passwordDialogState.verificationCode}
                          >
                            {passwordDialogState.isGeneratingCode ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Verificerer...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Verificer kode
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Password Change Form */}
                  {passwordDialogState.step === 'password_form' && (
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Nuværende adgangskode</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="currentPassword"
                            type={showPasswords.current ? "text" : "password"}
                            value={formData.currentPassword}
                            onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                            className="pl-10 pr-10"
                            placeholder="Din nuværende adgangskode"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
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
                        <Label htmlFor="newPassword">Ny adgangskode</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="newPassword"
                            type={showPasswords.new ? "text" : "password"}
                            value={formData.newPassword}
                            onChange={(e) => handleInputChange('newPassword', e.target.value)}
                            className="pl-10 pr-10"
                            placeholder="Din nye adgangskode"
                            minLength={6}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
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
                        <Label htmlFor="confirmPassword">Bekræft ny adgangskode</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="confirmPassword"
                            type={showPasswords.confirm ? "text" : "password"}
                            value={formData.confirmPassword}
                            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                            className="pl-10 pr-10"
                            placeholder="Bekræft din nye adgangskode"
                            minLength={6}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
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
                        className="w-full"
                        disabled={isLoading || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Opdaterer...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Gem ny adgangskode
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Kontoinformation</CardTitle>
          <CardDescription>
            Detaljer om din administratorkonto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Konto oprettet</Label>
              <p className="text-sm">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('da-DK') : 'N/A'}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Sidst opdateret</Label>
              <p className="text-sm">
                {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString('da-DK') : 'N/A'}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Status</Label>
              <p className="text-sm">
                {user.isActive ? (
                  <span className="text-brand-primary font-medium">Aktiv</span>
                ) : (
                  <span className="text-red-600 font-medium">Inaktiv</span>
                )}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Sidste login</Label>
              <p className="text-sm">
                {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('da-DK') : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 