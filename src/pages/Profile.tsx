import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authService, isCustomer } from '../lib/auth';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Separator } from '../components/ui/separator';
import { Checkbox } from '../components/ui/checkbox';
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
  ArrowLeft
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
    confirmPassword: ''
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
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updateData: any = {
        contactPersonName: formData.contactPersonName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        deliveryAddress: formData.deliveryAddress,
        useRegisteredAddressForDelivery: formData.useRegisteredAddressForDelivery
      };

      const response = await authService.updateCustomerProfile(updateData);
      
      if (response.success) {
        setSuccess('Profil opdateret succesfuldt');
        await refreshUser();
      } else {
        setError(response.message || 'Opdatering fejlede');
      }
    } catch (err: any) {
      setError(err.message || 'Der opstod en fejl');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords matcher ikke');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password skal være mindst 6 tegn');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await authService.updateCustomerProfile({
        contactPersonName: formData.contactPersonName,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      
      if (response.success) {
        setSuccess('Password ændret succesfuldt');
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
        setIsPasswordDialogOpen(false);
      } else {
        setError(response.message || 'Password ændring fejlede');
      }
    } catch (err: any) {
      setError(err.message || 'Der opstod en fejl');
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

  if (!user || !isCustomer(user)) {
    return null;
  }

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
                      <h3 className="text-lg font-semibold">{user.contactPersonName}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-sm text-muted-foreground">{user.companyName}</p>
                      {user.discountGroup && (
                        <p className="text-sm text-brand-primary">Rabatgruppe: {user.discountGroup}</p>
                      )}
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
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone">Telefon</Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Company Information */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-medium">Virksomhedsoplysninger</h4>
                        
                        <div className="space-y-2">
                          <Label>Virksomhed</Label>
                          <Input value={user.companyName} disabled />
                        </div>

                        <div className="space-y-2">
                          <Label>CVR-nummer</Label>
                          <Input value={user.cvrNumber} disabled />
                        </div>
                      </div>
                    </div>

                    {/* Address Information */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Adresseoplysninger
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Registered Address */}
                        <div className="space-y-4">
                          <h5 className="font-medium">Registreret adresse</h5>
                          
                          <div className="space-y-2">
                            <Label htmlFor="address.street">Gade og nummer</Label>
                            <Input
                              id="address.street"
                              value={formData.address.street}
                              onChange={(e) => handleInputChange('address.street', e.target.value)}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                              <Label htmlFor="address.postalCode">Postnummer</Label>
                              <Input
                                id="address.postalCode"
                                value={formData.address.postalCode}
                                onChange={(e) => handleInputChange('address.postalCode', e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="address.city">By</Label>
                              <Input
                                id="address.city"
                                value={formData.address.city}
                                onChange={(e) => handleInputChange('address.city', e.target.value)}
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
                              
                              <div className="space-y-2">
                                <Label htmlFor="deliveryAddress.street">Gade og nummer</Label>
                                <Input
                                  id="deliveryAddress.street"
                                  value={formData.deliveryAddress.street}
                                  onChange={(e) => handleInputChange('deliveryAddress.street', e.target.value)}
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-2">
                                  <Label htmlFor="deliveryAddress.postalCode">Postnummer</Label>
                                  <Input
                                    id="deliveryAddress.postalCode"
                                    value={formData.deliveryAddress.postalCode}
                                    onChange={(e) => handleInputChange('deliveryAddress.postalCode', e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="deliveryAddress.city">By</Label>
                                  <Input
                                    id="deliveryAddress.city"
                                    value={formData.deliveryAddress.city}
                                    onChange={(e) => handleInputChange('deliveryAddress.city', e.target.value)}
                                  />
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4">
                      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" type="button">
                            <Lock className="h-4 w-4 mr-2" />
                            Skift password
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Skift password</DialogTitle>
                            <DialogDescription>
                              Indtast dit nuværende password og vælg et nyt password.
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handlePasswordChange} className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="currentPassword">Nuværende password</Label>
                              <div className="relative">
                                <Input
                                  id="currentPassword"
                                  type={showPasswords.current ? 'text' : 'password'}
                                  value={formData.currentPassword}
                                  onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                                  required
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
                                  required
                                  minLength={6}
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
                                  required
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

                            <div className="flex justify-end space-x-2">
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setIsPasswordDialogOpen(false)}
                              >
                                Annuller
                              </Button>
                              <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Opdaterer...
                                  </>
                                ) : (
                                  <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Gem password
                                  </>
                                )}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>

                      <Button type="submit" disabled={isLoading}>
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