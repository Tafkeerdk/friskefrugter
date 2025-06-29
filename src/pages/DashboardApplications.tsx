import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  X
} from 'lucide-react';

interface ApplicationData {
  id: string;
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

const DashboardApplications: React.FC = () => {
  const [applications, setApplications] = useState<ApplicationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) return;

      const response = await fetch('/.netlify/functions/admin-applications', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setApplications(data.applications || []);
        }
      }
    } catch (error) {
      console.error('Failed to load applications data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (applicationId: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) return;

      const response = await fetch('/.netlify/functions/admin-applications', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId,
          action: 'approve'
        })
      });

      if (response.ok) {
        await loadData(); // Refresh data
      }
    } catch (error) {
      console.error('Failed to approve application:', error);
    }
  };

  const handleReject = async (applicationId: string, reason: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) return;

      const response = await fetch('/.netlify/functions/admin-applications', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId,
          action: 'reject',
          rejectionReason: reason
        })
      });

      if (response.ok) {
        await loadData(); // Refresh data
      }
    } catch (error) {
      console.error('Failed to reject application:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'Afventer godkendelse': { label: 'Afventer', variant: 'default' as const },
      'Godkendt': { label: 'Godkendt', variant: 'default' as const },
      'Afvist': { label: 'Afvist', variant: 'destructive' as const }
    };
    const config = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const pendingApplications = applications.filter(app => app.status === 'Afventer godkendelse');
  const processedApplications = applications.filter(app => app.status !== 'Afventer godkendelse');

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="dashboard-page-container">
          <div className="content-width">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="dashboard-page-container">
        <div className="content-width space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-brand-gray-900">B2B Ansøgninger</h1>
              <p className="text-brand-gray-600 mt-1">
                Administrer B2B kundeansøgninger og godkendelser
              </p>
            </div>
            <Button onClick={loadData} className="btn-brand-primary">
              <RefreshCw className="h-4 w-4 mr-2" />
              Opdater data
            </Button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Afventende ansøgninger</CardTitle>
                <Users className="h-4 w-4 text-brand-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-brand-primary">{pendingApplications.length}</div>
                <p className="text-xs text-muted-foreground">Kræver handling</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Totale ansøgninger</CardTitle>
                <FileText className="h-4 w-4 text-brand-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-brand-primary">{applications.length}</div>
                <p className="text-xs text-muted-foreground">Alle ansøgninger</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Godkendte kunder</CardTitle>
                <Check className="h-4 w-4 text-brand-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-brand-primary">
                  {applications.filter(app => app.status === 'Godkendt').length}
                </div>
                <p className="text-xs text-muted-foreground">Aktive B2B kunder</p>
              </CardContent>
            </Card>
          </div>

          {/* Pending Applications */}
          {pendingApplications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Afventende ansøgninger ({pendingApplications.length})</CardTitle>
                <CardDescription>Ansøgninger der kræver godkendelse</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {pendingApplications.map((application) => (
                    <Card key={application.id} className="border-l-4 border-l-orange-500">
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
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4 text-brand-gray-500" />
                                <span>CVR: {application.cvrNumber}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-brand-gray-500" />
                                <span>{application.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-brand-gray-500" />
                                <span>{application.phone}</span>
                              </div>
                            </div>

                            <div className="text-sm">
                              <span className="font-medium">Kontaktperson:</span>
                              <span className="ml-2">{application.contactPersonName}</span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 lg:items-end">
                            <div className="flex items-center gap-2 text-sm text-brand-gray-500">
                              <Clock className="h-4 w-4" />
                              <span>{new Date(application.appliedAt).toLocaleDateString('da-DK')}</span>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                onClick={() => handleApprove(application.id)} 
                                className="btn-brand-primary"
                                size="sm"
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Godkend
                              </Button>
                              <Button 
                                onClick={() => handleReject(application.id, 'Afvist af administrator')}
                                variant="destructive"
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
          <Card>
            <CardHeader>
              <CardTitle>Behandlede ansøgninger ({processedApplications.length})</CardTitle>
              <CardDescription>Godkendte og afviste ansøgninger</CardDescription>
            </CardHeader>
            <CardContent>
              {processedApplications.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                    Ingen behandlede ansøgninger endnu
                  </h3>
                  <p className="text-muted-foreground">
                    Behandlede ansøgninger vil vises her
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {processedApplications.map((application) => (
                    <Card key={application.id}>
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
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4 text-brand-gray-500" />
                                <span>CVR: {application.cvrNumber}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-brand-gray-500" />
                                <span>{application.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-brand-gray-500" />
                                <span>{application.phone}</span>
                              </div>
                            </div>

                            <div className="text-sm">
                              <span className="font-medium">Kontaktperson:</span>
                              <span className="ml-2">{application.contactPersonName}</span>
                            </div>

                            {application.rejectionReason && (
                              <div className="text-sm">
                                <span className="font-medium text-red-600">Afvisningsårsag:</span>
                                <span className="ml-2 text-red-600">{application.rejectionReason}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2 lg:items-end">
                            <div className="flex items-center gap-2 text-sm text-brand-gray-500">
                              <Clock className="h-4 w-4" />
                              <span>{new Date(application.reviewedAt || application.appliedAt).toLocaleDateString('da-DK')}</span>
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
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardApplications; 