import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Calendar, 
  Mail,
  Phone,
  Building,
  Clock,
  FileText,
  RefreshCw,
  Check,
  X,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { authService } from '@/lib/auth';

interface ApplicationData {
  _id: string;
  companyName: string;
  cvrNumber: string;
  contactPersonName: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  appliedAt: string;
  reviewedAt?: string;
  reviewedBy?: any;
  rejectionReason?: string;
}

interface ApplicationResponse {
  success: boolean;
  applications: ApplicationData[];
  pagination?: {
    current: number;
    total: number;
    count: number;
    totalItems: number;
  };
  statistics?: {
    pending: number;
    total: number;
    approved: number;
  };
}

const DashboardApplications: React.FC = () => {
  const { adminUser } = useAuth();
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authService.getApplications({
        page: 1,
        limit: 50,
        sortBy: 'appliedAt',
        sortOrder: 'desc'
      });
      
      if (response.success) {
        setApplications(response.applications as ApplicationData[]);
        if (response.statistics) {
          setStatistics(response.statistics);
        }
      } else {
        throw new Error('Failed to fetch applications');
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('Kunne ikke indlæse ansøgninger. Prøv igen senere.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (adminUser) {
      loadData();
    }
  }, [adminUser]);

  const handleApprove = async (applicationId: string) => {
    try {
      const response = await authService.approveApplication(applicationId);
      
      if (response.success) {
        await loadData(); // Refresh data
      } else {
        throw new Error('Failed to approve application');
      }
    } catch (error) {
      console.error('Failed to approve application:', error);
      setError('Kunne ikke godkende ansøgning. Prøv igen.');
    }
  };

  const handleReject = async (applicationId: string, reason: string) => {
    try {
      const response = await authService.rejectApplication(applicationId, reason);
      
      if (response.success) {
        await loadData(); // Refresh data
      } else {
        throw new Error('Failed to reject application');
      }
    } catch (error) {
      console.error('Failed to reject application:', error);
      setError('Kunne ikke afvise ansøgning. Prøv igen.');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'Afventer godkendelse': { label: 'Afventer', color: 'bg-brand-warning text-white' },
      'Godkendt': { label: 'Godkendt', color: 'bg-brand-success text-white' },
      'Afvist': { label: 'Afvist', color: 'bg-brand-error text-white' }
    };
    
    const config = statusMap[status as keyof typeof statusMap] || { 
      label: status, 
      color: 'bg-brand-gray-500 text-white' 
    };
    
    return (
      <Badge className={`${config.color} border-0`}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('da-DK', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!adminUser) {
    return (
      <DashboardLayout>
        <div className="dashboard-page-container">
          <div className="content-width">
            <Alert className="border-brand-error bg-brand-error/10">
              <AlertTriangle className="h-4 w-4 text-brand-error" />
              <AlertDescription className="text-brand-error">
                Du skal være logget ind som administrator for at se ansøgninger.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const pendingApplications = applications.filter(app => app.status === 'Afventer godkendelse');
  const processedApplications = applications.filter(app => app.status !== 'Afventer godkendelse');

  return (
    <DashboardLayout>
      <div className="dashboard-page-container">
        <div className="content-width space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-brand-gray-900">B2B Ansøgninger</h1>
              <p className="text-brand-gray-600 mt-1">
                Administrer B2B kundeansøgninger og godkendelser
              </p>
            </div>
            <Button 
              onClick={loadData} 
              disabled={isLoading}
              className="btn-brand-primary"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Opdater data
            </Button>
          </div>

          {/* Error State */}
          {error && (
            <Alert className="border-brand-error bg-brand-error/10">
              <AlertTriangle className="h-4 w-4 text-brand-error" />
              <AlertDescription className="text-brand-error">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
              <span className="ml-3 text-brand-gray-600">Indlæser ansøgninger...</span>
            </div>
          )}

          {/* Statistics */}
          {!isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="card-brand">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-brand-gray-700">
                    Afventende ansøgninger
                  </CardTitle>
                  <Users className="h-4 w-4 text-brand-warning" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-brand-warning">{pendingApplications.length}</div>
                  <p className="text-xs text-brand-gray-500">Kræver handling</p>
                </CardContent>
              </Card>

              <Card className="card-brand">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-brand-gray-700">
                    Totale ansøgninger
                  </CardTitle>
                  <FileText className="h-4 w-4 text-brand-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-brand-gray-900">{applications.length}</div>
                  <p className="text-xs text-brand-gray-500">Alle ansøgninger</p>
                </CardContent>
              </Card>

              <Card className="card-brand">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-brand-gray-700">
                    Godkendte kunder
                  </CardTitle>
                  <Check className="h-4 w-4 text-brand-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-brand-success">
                    {applications.filter(app => app.status === 'Godkendt').length}
                  </div>
                  <p className="text-xs text-brand-gray-500">Aktive B2B kunder</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Pending Applications */}
          {!isLoading && pendingApplications.length > 0 && (
            <Card className="card-brand">
              <CardHeader>
                <CardTitle className="text-lg text-brand-gray-900">
                  Afventende ansøgninger ({pendingApplications.length})
                </CardTitle>
                <CardDescription>Ansøgninger der kræver godkendelse</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {pendingApplications.map((application) => (
                    <Card key={application._id} className="border-l-4 border-l-brand-warning">
                      <CardContent className="p-4">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold text-brand-gray-900">
                                {application.companyName}
                              </h3>
                              {getStatusBadge(application.status)}
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                              <div className="flex items-center gap-2 text-brand-gray-600">
                                <Building className="h-4 w-4 text-brand-primary" />
                                <span>CVR: {application.cvrNumber}</span>
                              </div>
                              <div className="flex items-center gap-2 text-brand-gray-600">
                                <Mail className="h-4 w-4 text-brand-primary" />
                                <a href={`mailto:${application.email}`} className="hover:text-brand-primary">
                                  {application.email}
                                </a>
                              </div>
                              <div className="flex items-center gap-2 text-brand-gray-600">
                                <Phone className="h-4 w-4 text-brand-primary" />
                                <a href={`tel:${application.phone}`} className="hover:text-brand-primary">
                                  {application.phone}
                                </a>
                              </div>
                            </div>

                            <div className="text-sm text-brand-gray-700">
                              <span className="font-medium">Kontaktperson:</span>
                              <span className="ml-2">{application.contactPersonName}</span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 lg:items-end">
                            <div className="flex items-center gap-2 text-sm text-brand-gray-500">
                              <Clock className="h-4 w-4" />
                              <span>{formatDate(application.appliedAt)}</span>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                onClick={() => handleApprove(application._id)} 
                                className="btn-brand-primary"
                                size="sm"
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Godkend
                              </Button>
                              <Button 
                                onClick={() => handleReject(application._id, 'Afvist af administrator')}
                                className="bg-brand-error hover:bg-brand-error/90 text-white border-0"
                                size="sm"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Afvis
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Processed Applications */}
          {!isLoading && (
            <Card className="card-brand">
              <CardHeader>
                <CardTitle className="text-lg text-brand-gray-900">
                  Behandlede ansøgninger ({processedApplications.length})
                </CardTitle>
                <CardDescription>Godkendte og afviste ansøgninger</CardDescription>
              </CardHeader>
              <CardContent>
                {processedApplications.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-brand-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-brand-gray-900 mb-2">
                      Ingen behandlede ansøgninger endnu
                    </h3>
                    <p className="text-brand-gray-600">
                      Behandlede ansøgninger vil vises her
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {processedApplications.map((application) => (
                      <Card key={application._id} className="card-brand">
                        <CardContent className="p-4">
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold text-brand-gray-900">
                                  {application.companyName}
                                </h3>
                                {getStatusBadge(application.status)}
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                                <div className="flex items-center gap-2 text-brand-gray-600">
                                  <Building className="h-4 w-4 text-brand-primary" />
                                  <span>CVR: {application.cvrNumber}</span>
                                </div>
                                <div className="flex items-center gap-2 text-brand-gray-600">
                                  <Mail className="h-4 w-4 text-brand-primary" />
                                  <a href={`mailto:${application.email}`} className="hover:text-brand-primary">
                                    {application.email}
                                  </a>
                                </div>
                                <div className="flex items-center gap-2 text-brand-gray-600">
                                  <Phone className="h-4 w-4 text-brand-primary" />
                                  <a href={`tel:${application.phone}`} className="hover:text-brand-primary">
                                    {application.phone}
                                  </a>
                                </div>
                              </div>

                              <div className="text-sm text-brand-gray-700">
                                <span className="font-medium">Kontaktperson:</span>
                                <span className="ml-2">{application.contactPersonName}</span>
                              </div>

                              {application.rejectionReason && (
                                <div className="text-sm">
                                  <span className="font-medium text-brand-error">Afvisningsårsag:</span>
                                  <span className="ml-2 text-brand-error">{application.rejectionReason}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col gap-2 lg:items-end">
                              <div className="flex items-center gap-2 text-sm text-brand-gray-500">
                                <Clock className="h-4 w-4" />
                                <span>{formatDate(application.reviewedAt || application.appliedAt)}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Empty State - No Applications */}
          {!isLoading && applications.length === 0 && (
            <Card className="card-brand">
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 text-brand-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-brand-gray-900 mb-2">
                  Ingen ansøgninger fundet
                </h3>
                <p className="text-brand-gray-600 mb-6">
                  Der er endnu ikke modtaget nogen B2B ansøgninger.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardApplications; 