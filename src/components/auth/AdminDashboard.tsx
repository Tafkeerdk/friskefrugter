import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '../ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import { Loader2, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { authService } from '../../lib/auth';
import { format } from 'date-fns';

interface Application {
  id: string;
  companyName: string;
  cvrNumber: string;
  contactPersonName: string;
  email: string;
  phone: string;
  address: {
    street?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
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

export const AdminDashboard: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setIsLoading(true);
      const response = await authService.getApplications();
      if (response.success) {
        setApplications(response.applications as Application[]);
      } else {
        setError('Kunne ikke hente ansøgninger');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Der opstod en fejl';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (applicationId: string) => {
    try {
      setActionLoading(applicationId);
      const response = await authService.approveApplication(applicationId);
      
      if (response.success) {
        await loadApplications(); // Refresh the list
        setSelectedApplication(null);
      } else {
        setError(response.message || 'Kunne ikke godkende ansøgning');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Der opstod en fejl';
      setError(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (applicationId: string) => {
    if (!rejectionReason.trim()) {
      setError('Angiv venligst en årsag til afvisning');
      return;
    }

    try {
      setActionLoading(applicationId);
      const response = await authService.rejectApplication(applicationId, rejectionReason);
      
      if (response.success) {
        await loadApplications(); // Refresh the list
        setSelectedApplication(null);
        setRejectionReason('');
      } else {
        setError(response.message || 'Kunne ikke afvise ansøgning');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Der opstod en fejl';
      setError(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Afventer godkendelse':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Afventer</Badge>;
      case 'Godkendt':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Godkendt</Badge>;
      case 'Afvist':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Afvist</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = applications.filter(app => app.status === 'Afventer godkendelse').length;
  const approvedCount = applications.filter(app => app.status === 'Godkendt').length;
  const rejectedCount = applications.filter(app => app.status === 'Afvist').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Henter ansøgninger...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Administrer B2B kundeansøgninger</p>
        </div>
        <Button onClick={loadApplications} variant="outline">
          Opdater
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Afventer godkendelse</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Godkendte</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Afviste</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Kundeansøgninger</CardTitle>
          <CardDescription>
            Oversigt over alle indkomne B2B ansøgninger
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Virksomhed</TableHead>
                <TableHead>CVR</TableHead>
                <TableHead>Kontaktperson</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ansøgt</TableHead>
                <TableHead>Handlinger</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell className="font-medium">
                    {application.companyName}
                  </TableCell>
                  <TableCell>{application.cvrNumber}</TableCell>
                  <TableCell>{application.contactPersonName}</TableCell>
                  <TableCell>{application.email}</TableCell>
                  <TableCell>{getStatusBadge(application.status)}</TableCell>
                  <TableCell>
                    {format(new Date(application.appliedAt), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedApplication(application)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Se detaljer
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Ansøgningsdetaljer</DialogTitle>
                            <DialogDescription>
                              Detaljeret information om ansøgningen
                            </DialogDescription>
                          </DialogHeader>
                          
                          {selectedApplication && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="font-semibold">Virksomhed</Label>
                                  <p>{selectedApplication.companyName}</p>
                                </div>
                                <div>
                                  <Label className="font-semibold">CVR nummer</Label>
                                  <p>{selectedApplication.cvrNumber}</p>
                                </div>
                                <div>
                                  <Label className="font-semibold">Kontaktperson</Label>
                                  <p>{selectedApplication.contactPersonName}</p>
                                </div>
                                <div>
                                  <Label className="font-semibold">Email</Label>
                                  <p>{selectedApplication.email}</p>
                                </div>
                                <div>
                                  <Label className="font-semibold">Telefon</Label>
                                  <p>{selectedApplication.phone}</p>
                                </div>
                                <div>
                                  <Label className="font-semibold">Status</Label>
                                  <div className="mt-1">{getStatusBadge(selectedApplication.status)}</div>
                                </div>
                              </div>

                              {selectedApplication.address && (
                                <div>
                                  <Label className="font-semibold">Adresse</Label>
                                  <p>
                                    {selectedApplication.address.street}<br />
                                    {selectedApplication.address.postalCode} {selectedApplication.address.city}<br />
                                    {selectedApplication.address.country}
                                  </p>
                                </div>
                              )}

                              {selectedApplication.cvrData && (
                                <div>
                                  <Label className="font-semibold">CVR oplysninger</Label>
                                  <div className="grid grid-cols-2 gap-2 mt-1">
                                    {selectedApplication.cvrData.companyType && (
                                      <p><strong>Type:</strong> {selectedApplication.cvrData.companyType}</p>
                                    )}
                                    {selectedApplication.cvrData.industry && (
                                      <p><strong>Branche:</strong> {selectedApplication.cvrData.industry}</p>
                                    )}
                                    {selectedApplication.cvrData.employees && (
                                      <p><strong>Ansatte:</strong> {selectedApplication.cvrData.employees}</p>
                                    )}
                                    {selectedApplication.cvrData.foundedYear && (
                                      <p><strong>Grundlagt:</strong> {selectedApplication.cvrData.foundedYear}</p>
                                    )}
                                  </div>
                                </div>
                              )}

                              {selectedApplication.rejectionReason && (
                                <div>
                                  <Label className="font-semibold">Afvisningsårsag</Label>
                                  <p className="text-red-600">{selectedApplication.rejectionReason}</p>
                                </div>
                              )}

                              {selectedApplication.status === 'Afventer godkendelse' && (
                                <div className="space-y-4 pt-4 border-t">
                                  <div className="flex space-x-2">
                                    <Button
                                      onClick={() => handleApprove(selectedApplication.id)}
                                      disabled={actionLoading === selectedApplication.id}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      {actionLoading === selectedApplication.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                      ) : (
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                      )}
                                      Godkend ansøgning
                                    </Button>
                                  </div>

                                  <div className="space-y-2">
                                    <Label htmlFor="rejectionReason">Afvis med begrundelse</Label>
                                    <Textarea
                                      id="rejectionReason"
                                      placeholder="Angiv årsag til afvisning..."
                                      value={rejectionReason}
                                      onChange={(e) => setRejectionReason(e.target.value)}
                                    />
                                    <Button
                                      variant="destructive"
                                      onClick={() => handleReject(selectedApplication.id)}
                                      disabled={actionLoading === selectedApplication.id || !rejectionReason.trim()}
                                    >
                                      {actionLoading === selectedApplication.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                      ) : (
                                        <XCircle className="w-4 h-4 mr-2" />
                                      )}
                                      Afvis ansøgning
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {applications.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Ingen ansøgninger fundet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 