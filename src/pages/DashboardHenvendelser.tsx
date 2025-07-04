import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  AlertCircle,
  BarChart3,
  Building,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  Filter,
  Inbox,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Search,
  TrendingUp,
  User,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { authService } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';

interface Contact {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  industry: string;
  message: string;
  contactType: string;
  priority: 'low' | 'medium' | 'high';
  status: 'new' | 'in_progress' | 'responded' | 'resolved' | 'closed';
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  ipAddress?: string;
  userAgent?: string;
  confirmationEmailSent?: boolean;
  adminNotificationSent?: boolean;
}

interface ContactStats {
  total: number;
  new: number;
  thisMonth: number;
}

interface ContactResponse {
  success: boolean;
  contacts: Contact[];
  pagination: {
    current: number;
    total: number;
    count: number;
    totalItems: number;
  };
  statistics: ContactStats;
}

const DashboardHenvendelser: React.FC = () => {
  const { adminUser } = useAuth();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [stats, setStats] = useState<ContactStats>({ total: 0, new: 0, thisMonth: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters and search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchContacts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authService.getContacts({
        limit: 20,
        page: currentPage,
        status: statusFilter,
        search: search
      });
      
      if (response.success) {
        setContacts(response.contacts as Contact[]);
        if (response.statistics) {
          setStats(response.statistics);
        }
      } else {
        throw new Error('Failed to fetch contacts');
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError('Kunne ikke indlæse henvendelser. Prøv igen senere.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (adminUser) {
      fetchContacts();
    }
  }, [adminUser, currentPage, statusFilter, search]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      new: { label: 'Ny', variant: 'default' as const, color: 'bg-brand-primary text-white' },
      in_progress: { label: 'Under behandling', variant: 'secondary' as const, color: 'bg-brand-warning text-white' },
      responded: { label: 'Besvaret', variant: 'outline' as const, color: 'bg-brand-success text-white' },
      resolved: { label: 'Løst', variant: 'outline' as const, color: 'bg-brand-success text-white' },
      closed: { label: 'Lukket', variant: 'outline' as const, color: 'bg-brand-gray-500 text-white' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.new;
    
    return (
      <Badge className={`${config.color} border-0`}>
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { label: 'Lav', color: 'bg-brand-gray-500 text-white' },
      medium: { label: 'Medium', color: 'bg-brand-warning text-white' },
      high: { label: 'Høj', color: 'bg-brand-error text-white' }
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    
    return (
      <Badge className={`${config.color} border-0`}>
        {config.label}
      </Badge>
    );
  };

  const getIndustryLabel = (industry: string) => {
    const industryLabels = {
      restaurant: 'Restaurant',
      cafe: 'Café',
      hotel: 'Hotel',
      catering: 'Catering',
      retail: 'Detailhandel',
      institution: 'Institution',
      other: 'Andet'
    };
    
    return industryLabels[industry as keyof typeof industryLabels] || industry;
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
                Du skal være logget ind som administrator for at se henvendelser.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="dashboard-page-container">
        <div className="content-width">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-brand-gray-900">Henvendelser</h1>
              <p className="text-brand-gray-600 mt-1">
                Administrer kontakthenvendelser fra website kontaktformular
              </p>
            </div>
            <Button 
              onClick={fetchContacts}
              disabled={isLoading}
              className="btn-brand-primary"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <BarChart3 className="h-4 w-4 mr-2" />
              )}
              Opdater
            </Button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="card-brand">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-brand-gray-700">
                  Totale henvendelser
                </CardTitle>
                <Inbox className="h-4 w-4 text-brand-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-brand-gray-900">{stats.total}</div>
                <p className="text-xs text-brand-gray-500">
                  Alle kontakter i systemet
                </p>
              </CardContent>
            </Card>

            <Card className="card-brand">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-brand-gray-700">
                  Nye henvendelser
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-brand-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-brand-warning">{stats.new}</div>
                <p className="text-xs text-brand-gray-500">
                  Kræver behandling
                </p>
              </CardContent>
            </Card>

            <Card className="card-brand">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-brand-gray-700">
                  Denne måned
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-brand-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-brand-success">{stats.thisMonth}</div>
                <p className="text-xs text-brand-gray-500">
                  {new Date().toLocaleDateString('da-DK', { month: 'long', year: 'numeric' })}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="card-brand mb-6">
            <CardHeader>
              <CardTitle className="text-lg text-brand-gray-900">
                <Filter className="h-5 w-5 mr-2 inline-block text-brand-primary" />
                Filtre og søgning
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-gray-500" />
                    <Input
                      placeholder="Søg efter navn, email, virksomhed..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="input-brand pl-10"
                    />
                  </div>
                </div>
                <div className="sm:w-48">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Vælg status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle status</SelectItem>
                      <SelectItem value="new">Nye</SelectItem>
                      <SelectItem value="in_progress">Under behandling</SelectItem>
                      <SelectItem value="responded">Besvaret</SelectItem>
                      <SelectItem value="resolved">Løst</SelectItem>
                      <SelectItem value="closed">Lukket</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error State */}
          {error && (
            <Alert className="border-brand-error bg-brand-error/10 mb-6">
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
              <span className="ml-3 text-brand-gray-600">Indlæser henvendelser...</span>
            </div>
          )}

          {/* Contacts List */}
          {!isLoading && contacts.length > 0 && (
            <div className="space-y-4">
              {contacts.map((contact) => (
                <Card key={contact._id} className="card-brand hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Main Contact Info */}
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-brand-primary" />
                            <span className="font-semibold text-brand-gray-900">
                              {contact.firstName} {contact.lastName}
                            </span>
                            {!contact.isRead && (
                              <Badge className="bg-brand-primary text-white border-0 text-xs">
                                Ny
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(contact.status)}
                            {getPriorityBadge(contact.priority)}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-brand-gray-600">
                            <Mail className="h-4 w-4 text-brand-primary" />
                            <a href={`mailto:${contact.email}`} className="hover:text-brand-primary">
                              {contact.email}
                            </a>
                          </div>
                          <div className="flex items-center gap-2 text-brand-gray-600">
                            <Phone className="h-4 w-4 text-brand-primary" />
                            <a href={`tel:${contact.phone}`} className="hover:text-brand-primary">
                              {contact.phone}
                            </a>
                          </div>
                          <div className="flex items-center gap-2 text-brand-gray-600">
                            <Building className="h-4 w-4 text-brand-primary" />
                            <span>{contact.companyName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-brand-gray-600">
                            <BarChart3 className="h-4 w-4 text-brand-primary" />
                            <span>{getIndustryLabel(contact.industry)}</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 text-brand-primary mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-brand-gray-700 line-clamp-2">
                            {contact.message}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-brand-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatDate(contact.createdAt)}</span>
                          </div>
                          {contact.confirmationEmailSent && (
                            <div className="flex items-center gap-1 text-brand-success">
                              <CheckCircle className="h-3 w-3" />
                              <span>Bekræftelse sendt</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-row lg:flex-col gap-2">
                        <Button 
                          onClick={() => navigate(`/admin/henvendelser/${contact._id}`)}
                          variant="outline" 
                          size="sm"
                          className="border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Se detaljer
                        </Button>

                        <Button 
                          size="sm"
                          className="btn-brand-secondary"
                          onClick={() => window.open(`mailto:${contact.email}?subject=Angående din henvendelse til Multi Grønt&body=Hej ${contact.firstName},%0D%0A%0D%0ATak for din henvendelse til Multi Grønt.`, '_blank')}
                        >
                          <Mail className="h-4 w-4" />
                          <span className="hidden sm:inline ml-2">Svar</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && contacts.length === 0 && (
            <Card className="card-brand">
              <CardContent className="p-12 text-center">
                <Inbox className="h-12 w-12 text-brand-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-brand-gray-900 mb-2">
                  Ingen henvendelser fundet
                </h3>
                <p className="text-brand-gray-600 mb-6">
                  {search || statusFilter !== 'all' 
                    ? 'Prøv at justere dine filtre for at se flere henvendelser.'
                    : 'Der er endnu ikke modtaget nogen henvendelser fra kontaktformularen.'
                  }
                </p>
                <Button 
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('all');
                  }}
                  className="btn-brand-primary"
                >
                  Ryd filtre
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardHenvendelser; 