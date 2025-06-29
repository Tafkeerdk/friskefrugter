import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  User, 
  Calendar,
  FileText,
  Loader2,
  AlertTriangle,
  Eye
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../lib/auth';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

interface Application {
  id: string;
  companyName: string;
  cvrNumber: string;
  contactPersonName: string;
  email: string;
  phone: string;
  address?: {
    street?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  deliveryAddress?: {
    street?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  useRegisteredAddressForDelivery?: boolean;
  status: 'Afventer godkendelse' | 'Godkendt' | 'Afvist';
  appliedAt: string;
  reviewedAt?: string;
  reviewedBy?: {
    name: string;
    email: string;
  };
  rejectionReason?: string;
  cvrData?: {
    companyType?: string;
    industry?: string;
    employees?: number;
    foundedYear?: number;
  };
}

const DashboardApplicationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { adminUser } = useAuth();
  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    if (id && adminUser) {
      loadApplication();
    }
  }, [id, adminUser]);

  const loadApplication = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      setError(null);

      const response = await authService.getApplication(id);
      
      if (response.success) {
        setApplication(response.application);
      } else {
        setError(response.error || 'Ansøgning ikke fundet');
      }
    } catch (err) {
      console.error('Error fetching application:', err);
      setError('Kunne ikke indlæse ansøgning. Prøv igen senere.');
    } finally {
      setIsLoading(false);
    }
  };



  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Afventer godkendelse':
        return <Badge className="bg-brand-warning text-white"><Clock className="h-3 w-3 mr-1" />Afventer</Badge>;
      case 'Godkendt':
        return <Badge className="bg-brand-success text-white"><CheckCircle className="h-3 w-3 mr-1" />Godkendt</Badge>;
      case 'Afvist':
        return <Badge className="bg-brand-error text-white"><XCircle className="h-3 w-3 mr-1" />Afvist</Badge>;
      default:
        return <Badge className="bg-brand-gray-500 text-white">{status}</Badge>;
    }
  };

  const formatAddress = (address?: { street?: string; city?: string; postalCode?: string; country?: string }) => {
    if (!address) return 'Ikke angivet';
    const parts = [address.street, address.postalCode, address.city, address.country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Ikke angivet';
  };

  if (!adminUser) {
    return (
      <DashboardLayout>
        <div className="dashboard-page-container">
          <div className="content-width">
            <Alert className="border-brand-error bg-brand-error/10">
              <AlertTriangle className="h-4 w-4 text-brand-error" />
              <AlertDescription className="text-brand-error">
                Du skal være logget ind som administrator for at se ansøgningsdetaljer.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="dashboard-page-container">
          <div className="content-width">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
              <span className="ml-3 text-brand-gray-600">Indlæser ansøgning...</span>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !application) {
    return (
      <DashboardLayout>
        <div className="dashboard-page-container">
          <div className="content-width">
            <Alert className="border-brand-error bg-brand-error/10">
              <AlertTriangle className="h-4 w-4 text-brand-error" />
              <AlertDescription className="text-brand-error">
                {error || 'Ansøgning ikke fundet'}
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => navigate('/admin/applications')} 
              className="mt-4"
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tilbage til ansøgninger
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="dashboard-page-container">
        <div className="content-width space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button 
                onClick={() => navigate('/admin/applications')} 
                variant="outline"
                size="sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tilbage
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-brand-gray-900">B2B Ansøgning</h1>
                <p className="text-brand-gray-600">{application.companyName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(application.status)}
            </div>
          </div>

          {/* Status Alert */}
          {error && (
            <Alert className="border-brand-error bg-brand-error/10">
              <AlertTriangle className="h-4 w-4 text-brand-error" />
              <AlertDescription className="text-brand-error">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Application Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Company Information */}
              <Card className="card-brand">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-brand-gray-900">
                    <Building className="h-5 w-5 text-brand-primary" />
                    Virksomhedsoplysninger
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-brand-gray-700">Virksomhedsnavn</Label>
                      <p className="text-brand-gray-900 font-medium">{application.companyName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-brand-gray-700">CVR-nummer</Label>
                      <p className="text-brand-gray-900 font-medium">{application.cvrNumber}</p>
                    </div>
                  </div>
                  
                  {application.cvrData && (
                    <div className="mt-4 p-4 bg-brand-gray-50 rounded-lg">
                      <h4 className="font-medium text-brand-gray-900 mb-2">CVR Data</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {application.cvrData.companyType && (
                          <div>
                            <span className="text-brand-gray-600">Type:</span>
                            <span className="ml-2 text-brand-gray-900">{application.cvrData.companyType}</span>
                          </div>
                        )}
                        {application.cvrData.industry && (
                          <div>
                            <span className="text-brand-gray-600">Branche:</span>
                            <span className="ml-2 text-brand-gray-900">{application.cvrData.industry}</span>
                          </div>
                        )}
                        {application.cvrData.employees && (
                          <div>
                            <span className="text-brand-gray-600">Medarbejdere:</span>
                            <span className="ml-2 text-brand-gray-900">{application.cvrData.employees}</span>
                          </div>
                        )}
                        {application.cvrData.foundedYear && (
                          <div>
                            <span className="text-brand-gray-600">Grundlagt:</span>
                            <span className="ml-2 text-brand-gray-900">{application.cvrData.foundedYear}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card className="card-brand">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-brand-gray-900">
                    <User className="h-5 w-5 text-brand-primary" />
                    Kontaktperson
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-brand-gray-700">Navn</Label>
                      <p className="text-brand-gray-900 font-medium">{application.contactPersonName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-brand-gray-700">Email</Label>
                      <p className="text-brand-gray-900">
                        <a href={`mailto:${application.email}`} className="text-brand-primary hover:underline">
                          {application.email}
                        </a>
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-brand-gray-700">Telefon</Label>
                      <p className="text-brand-gray-900">
                        <a href={`tel:${application.phone}`} className="text-brand-primary hover:underline">
                          {application.phone}
                        </a>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Address Information */}
              <Card className="card-brand">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-brand-gray-900">
                    <MapPin className="h-5 w-5 text-brand-primary" />
                    Adresseoplysninger
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-brand-gray-700">Registreret adresse</Label>
                    <p className="text-brand-gray-900">{formatAddress(application.address)}</p>
                  </div>
                  
                  {!application.useRegisteredAddressForDelivery && application.deliveryAddress && (
                    <div>
                      <Label className="text-sm font-medium text-brand-gray-700">Leveringsadresse</Label>
                      <p className="text-brand-gray-900">{formatAddress(application.deliveryAddress)}</p>
                    </div>
                  )}
                  
                  {application.useRegisteredAddressForDelivery && (
                    <div className="p-3 bg-brand-primary/10 rounded-lg">
                      <p className="text-sm text-brand-primary">
                        <Eye className="h-4 w-4 inline mr-1" />
                        Bruger registreret adresse til levering
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status & Timeline */}
              <Card className="card-brand">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-brand-gray-900">
                    <Calendar className="h-5 w-5 text-brand-primary" />
                    Status & Tidslinje
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-brand-gray-700">Ansøgningsdato</Label>
                    <p className="text-brand-gray-900">
                      {format(new Date(application.appliedAt), 'dd. MMMM yyyy', { locale: da })}
                    </p>
                  </div>
                  
                  {application.reviewedAt && (
                    <div>
                      <Label className="text-sm font-medium text-brand-gray-700">Behandlet dato</Label>
                      <p className="text-brand-gray-900">
                        {format(new Date(application.reviewedAt), 'dd. MMMM yyyy', { locale: da })}
                      </p>
                    </div>
                  )}
                  
                  {application.reviewedBy && (
                    <div>
                      <Label className="text-sm font-medium text-brand-gray-700">Behandlet af</Label>
                      <p className="text-brand-gray-900">{application.reviewedBy.name}</p>
                    </div>
                  )}
                  
                  {application.rejectionReason && (
                    <div>
                      <Label className="text-sm font-medium text-brand-gray-700">Afvisningsårsag</Label>
                      <p className="text-brand-gray-900 text-sm bg-brand-error/10 p-3 rounded-lg">
                        {application.rejectionReason}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>


            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardApplicationDetail; 