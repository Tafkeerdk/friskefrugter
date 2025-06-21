import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
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
import { Loader2, CheckCircle, XCircle, Clock, Eye, ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react';
import { authService, ApplicationsResponse } from '../../lib/auth';
import { format } from 'date-fns';
import { ApplicationListSkeleton, TableLoadingSkeleton } from '../ui/loading-states';

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
  
  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState('appliedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Bulk operations state
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [bulkRejectionReason, setBulkRejectionReason] = useState('');
  const [showBulkRejectDialog, setShowBulkRejectDialog] = useState(false);
  
  // Statistics state
  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  const loadApplications = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setIsLoading(true);
      setError(null);
      
      const response: ApplicationsResponse = await authService.getApplications({
        page: currentPage,
        limit: pageSize,
        status: statusFilter === 'all' ? undefined : statusFilter,
        sortBy,
        sortOrder
      });
      
      if (response.success) {
        setApplications(response.applications as Application[]);
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages);
          setTotalCount(response.pagination.totalCount);
        }
        if (response.statistics) {
          setStatistics(response.statistics);
        }
      } else {
        setError('Kunne ikke hente ansøgninger');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Der opstod en fejl';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        // Reset to first page when searching
        setCurrentPage(1);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Filter applications based on search term
  const filteredApplications = useMemo(() => {
    if (!searchTerm) return applications;
    
    const searchLower = searchTerm.toLowerCase();
    return applications.filter(app =>
      app.companyName.toLowerCase().includes(searchLower) ||
      app.contactPersonName.toLowerCase().includes(searchLower) ||
      app.email.toLowerCase().includes(searchLower) ||
      app.cvrNumber.includes(searchTerm)
    );
  }, [applications, searchTerm]);

  const handleApprove = async (applicationId: string) => {
    try {
      setActionLoading(applicationId);
      const response = await authService.approveApplication(applicationId);
      
      if (response.success) {
        await loadApplications(false); // Refresh without showing loader
        setSelectedApplication(null);
        setSelectedApplications(prev => {
          const newSet = new Set(prev);
          newSet.delete(applicationId);
          return newSet;
        });
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

  const handleReject = async (applicationId: string, reason?: string) => {
    const finalReason = reason || rejectionReason;
    if (!finalReason.trim()) {
      setError('Angiv venligst en årsag til afvisning');
      return;
    }

    try {
      setActionLoading(applicationId);
      const response = await authService.rejectApplication(applicationId, finalReason);
      
      if (response.success) {
        await loadApplications(false); // Refresh without showing loader
        setSelectedApplication(null);
        setRejectionReason('');
        setSelectedApplications(prev => {
          const newSet = new Set(prev);
          newSet.delete(applicationId);
          return newSet;
        });
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

  const handleBulkApprove = async () => {
    if (selectedApplications.size === 0) return;

    try {
      setBulkActionLoading(true);
      const response = await authService.bulkApproveApplications(Array.from(selectedApplications));
      
      if (response.success) {
        await loadApplications(false);
        setSelectedApplications(new Set());
      } else {
        setError(response.message || 'Kunne ikke godkende ansøgninger');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Der opstod en fejl';
      setError(errorMessage);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedApplications.size === 0 || !bulkRejectionReason.trim()) return;

    try {
      setBulkActionLoading(true);
      const response = await authService.bulkRejectApplications(
        Array.from(selectedApplications), 
        bulkRejectionReason
      );
      
      if (response.success) {
        await loadApplications(false);
        setSelectedApplications(new Set());
        setBulkRejectionReason('');
        setShowBulkRejectDialog(false);
      } else {
        setError(response.message || 'Kunne ikke afvise ansøgninger');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Der opstod en fejl';
      setError(errorMessage);
    } finally {
      setBulkActionLoading(false);
    }
  };

  const toggleApplicationSelection = (applicationId: string) => {
    setSelectedApplications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(applicationId)) {
        newSet.delete(applicationId);
      } else {
        newSet.add(applicationId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    const pendingApplications = filteredApplications
      .filter(app => app.status === 'Afventer godkendelse')
      .map(app => app.id);
    
    if (selectedApplications.size === pendingApplications.length) {
      setSelectedApplications(new Set());
    } else {
      setSelectedApplications(new Set(pendingApplications));
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

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setSelectedApplications(new Set()); // Clear selections when changing pages
  };

  if (isLoading && applications.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Henter ansøgninger...</span>
        </div>
        <ApplicationListSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ansøgninger</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Afventer Godkendelse</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{statistics.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Godkendt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statistics.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Afvist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statistics.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filtre og Søgning</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search">Søg</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Søg efter firma, navn, email eller CVR..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Vælg status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="Afventer godkendelse">Afventer</SelectItem>
                  <SelectItem value="Godkendt">Godkendt</SelectItem>
                  <SelectItem value="Afvist">Afvist</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sort-by">Sorter efter</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="appliedAt">Ansøgt dato</SelectItem>
                  <SelectItem value="companyName">Firmanavn</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sort-order">Rækkefølge</Label>
              <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Nyeste først</SelectItem>
                  <SelectItem value="asc">Ældste først</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Bulk Actions */}
      {selectedApplications.size > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedApplications.size} ansøgning(er) valgt
              </span>
              <div className="flex gap-2">
                <Button
                  onClick={handleBulkApprove}
                  disabled={bulkActionLoading}
                  className="bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  {bulkActionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Godkend alle
                </Button>
                <Button
                  onClick={() => setShowBulkRejectDialog(true)}
                  disabled={bulkActionLoading}
                  variant="destructive"
                  size="sm"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Afvis alle
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Kundeansøgninger</CardTitle>
          <CardDescription>
            Viser {filteredApplications.length} af {totalCount} ansøgninger
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableLoadingSkeleton rows={5} columns={6} />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          filteredApplications.filter(app => app.status === 'Afventer godkendelse').length > 0 &&
                          selectedApplications.size === filteredApplications.filter(app => app.status === 'Afventer godkendelse').length
                        }
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Firma</TableHead>
                    <TableHead>Kontaktperson</TableHead>
                    <TableHead>CVR</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ansøgt</TableHead>
                    <TableHead className="text-right">Handlinger</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell>
                        {application.status === 'Afventer godkendelse' && (
                          <Checkbox
                            checked={selectedApplications.has(application.id)}
                            onCheckedChange={() => toggleApplicationSelection(application.id)}
                          />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{application.companyName}</TableCell>
                      <TableCell>{application.contactPersonName}</TableCell>
                      <TableCell>{application.cvrNumber}</TableCell>
                      <TableCell>{getStatusBadge(application.status)}</TableCell>
                      <TableCell>{format(new Date(application.appliedAt), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
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
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Ansøgningsdetaljer</DialogTitle>
                                <DialogDescription>
                                  Detaljer for {application.companyName}
                                </DialogDescription>
                              </DialogHeader>
                              
                              {selectedApplication && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="font-semibold">Firmanavn</Label>
                                      <p>{selectedApplication.companyName}</p>
                                    </div>
                                    <div>
                                      <Label className="font-semibold">CVR-nummer</Label>
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
                                      <Label className="font-semibold">CVR Data</Label>
                                      <div className="grid grid-cols-2 gap-2 mt-2">
                                        {selectedApplication.cvrData.companyType && (
                                          <div>
                                            <span className="text-sm text-muted-foreground">Type:</span>
                                            <p className="text-sm">{selectedApplication.cvrData.companyType}</p>
                                          </div>
                                        )}
                                        {selectedApplication.cvrData.industry && (
                                          <div>
                                            <span className="text-sm text-muted-foreground">Branche:</span>
                                            <p className="text-sm">{selectedApplication.cvrData.industry}</p>
                                          </div>
                                        )}
                                        {selectedApplication.cvrData.employees && (
                                          <div>
                                            <span className="text-sm text-muted-foreground">Medarbejdere:</span>
                                            <p className="text-sm">{selectedApplication.cvrData.employees}</p>
                                          </div>
                                        )}
                                        {selectedApplication.cvrData.foundedYear && (
                                          <div>
                                            <span className="text-sm text-muted-foreground">Grundlagt:</span>
                                            <p className="text-sm">{selectedApplication.cvrData.foundedYear}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {selectedApplication.reviewedBy && (
                                    <div>
                                      <Label className="font-semibold">Behandlet af</Label>
                                      <p>{selectedApplication.reviewedBy.name} ({selectedApplication.reviewedBy.email})</p>
                                      {selectedApplication.reviewedAt && (
                                        <p className="text-sm text-muted-foreground">
                                          {format(new Date(selectedApplication.reviewedAt), 'dd/MM/yyyy HH:mm')}
                                        </p>
                                      )}
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
                                        <Label htmlFor="rejection-reason">Afvisningsårsag</Label>
                                        <Textarea
                                          id="rejection-reason"
                                          placeholder="Angiv årsag til afvisning..."
                                          value={rejectionReason}
                                          onChange={(e) => setRejectionReason(e.target.value)}
                                        />
                                        <Button
                                          onClick={() => handleReject(selectedApplication.id)}
                                          disabled={actionLoading === selectedApplication.id || !rejectionReason.trim()}
                                          variant="destructive"
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Side {currentPage} af {totalPages} ({totalCount} total)
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Forrige
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Næste
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Bulk Reject Dialog */}
      <Dialog open={showBulkRejectDialog} onOpenChange={setShowBulkRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Afvis valgte ansøgninger</DialogTitle>
            <DialogDescription>
              Du er ved at afvise {selectedApplications.size} ansøgning(er). Angiv en årsag til afvisning.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulk-rejection-reason">Afvisningsårsag</Label>
              <Textarea
                id="bulk-rejection-reason"
                placeholder="Angiv årsag til afvisning..."
                value={bulkRejectionReason}
                onChange={(e) => setBulkRejectionReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowBulkRejectDialog(false)}
              >
                Annuller
              </Button>
              <Button
                variant="destructive"
                onClick={handleBulkReject}
                disabled={!bulkRejectionReason.trim() || bulkActionLoading}
              >
                {bulkActionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2" />
                )}
                Afvis ansøgninger
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 