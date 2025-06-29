import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Building, 
  User, 
  MessageSquare,
  Calendar,
  FileText,
  Loader2,
  AlertTriangle,
  Eye,
  Clock,
  CheckCircle,
  Globe,
  Star,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../lib/auth';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

interface Contact {
  _id: string;
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  industry: string;
  message: string;
  contactType: string;
  priority: string;
  status: string;
  isRead: boolean;
  respondedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  responseDate?: string;
  internalNotes: string;
  ipAddress: string;
  userAgent: string;
  source: string;
  confirmationEmailSent: boolean;
  confirmationEmailDate?: string;
  adminNotificationSent: boolean;
  adminNotificationDate?: string;
  followUpRequired: boolean;
  followUpDate?: string;
  estimatedBusinessValue: string;
  createdAt: string;
  updatedAt: string;
}

const DashboardContactDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { adminUser } = useAuth();
  const [contact, setContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [internalNotes, setInternalNotes] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (id && adminUser) {
      loadContact();
    }
  }, [id, adminUser]);

  const loadContact = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      setError(null);

      const response = await authService.getContact(id);
      
      if (response.success) {
        setContact(response.contact);
        setInternalNotes(response.contact.internalNotes || '');
        setStatus(response.contact.status);
        
        // Mark as read if not already read
        if (!response.contact.isRead) {
          await authService.markContactAsRead(id);
        }
      } else {
        setError(response.error || 'Kontakt ikke fundet');
      }
    } catch (err) {
      console.error('Error fetching contact:', err);
      setError('Kunne ikke indlæse kontakt. Prøv igen senere.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!contact) return;
    
    try {
      setActionLoading(true);
      const response = await authService.updateContactStatus(contact.id, status, internalNotes);
      
      if (response.success) {
        await loadContact(); // Refresh data
      } else {
        setError('Kunne ikke opdatere kontakt. Prøv igen.');
      }
    } catch (error) {
      console.error('Failed to update contact:', error);
      setError('Kunne ikke opdatere kontakt. Prøv igen.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge className="bg-brand-primary text-white"><Clock className="h-3 w-3 mr-1" />Ny</Badge>;
      case 'in_progress':
        return <Badge className="bg-brand-warning text-white"><Eye className="h-3 w-3 mr-1" />I gang</Badge>;
      case 'responded':
        return <Badge className="bg-brand-success text-white"><CheckCircle className="h-3 w-3 mr-1" />Besvaret</Badge>;
      case 'resolved':
        return <Badge className="bg-brand-success text-white"><CheckCircle className="h-3 w-3 mr-1" />Løst</Badge>;
      case 'closed':
        return <Badge className="bg-brand-gray-500 text-white">Lukket</Badge>;
      default:
        return <Badge className="bg-brand-gray-500 text-white">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-brand-error text-white"><AlertTriangle className="h-3 w-3 mr-1" />Høj</Badge>;
      case 'medium':
        return <Badge className="bg-brand-warning text-white">Medium</Badge>;
      case 'low':
        return <Badge className="bg-brand-gray-500 text-white">Lav</Badge>;
      default:
        return <Badge className="bg-brand-gray-500 text-white">{priority}</Badge>;
    }
  };

  const getIndustryName = (industry: string) => {
    const industryMap: { [key: string]: string } = {
      restaurant: 'Restaurant',
      cafe: 'Café',
      hotel: 'Hotel',
      catering: 'Catering',
      retail: 'Detailhandel',
      institution: 'Institution',
      other: 'Andet'
    };
    return industryMap[industry] || industry;
  };

  const getBusinessValueBadge = (value: string) => {
    switch (value) {
      case 'high':
        return <Badge className="bg-green-600 text-white"><DollarSign className="h-3 w-3 mr-1" />Høj værdi</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-600 text-white"><DollarSign className="h-3 w-3 mr-1" />Medium værdi</Badge>;
      case 'low':
        return <Badge className="bg-gray-500 text-white"><DollarSign className="h-3 w-3 mr-1" />Lav værdi</Badge>;
      default:
        return <Badge className="bg-gray-400 text-white">Ukendt værdi</Badge>;
    }
  };

  if (!adminUser) {
    return (
      <DashboardLayout>
        <div className="dashboard-page-container">
          <div className="content-width">
            <Alert className="border-brand-error bg-brand-error/10">
              <AlertTriangle className="h-4 w-4 text-brand-error" />
              <AlertDescription className="text-brand-error">
                Du skal være logget ind som administrator for at se kontaktdetaljer.
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
              <span className="ml-3 text-brand-gray-600">Indlæser kontakt...</span>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !contact) {
    return (
      <DashboardLayout>
        <div className="dashboard-page-container">
          <div className="content-width">
            <Alert className="border-brand-error bg-brand-error/10">
              <AlertTriangle className="h-4 w-4 text-brand-error" />
              <AlertDescription className="text-brand-error">
                {error || 'Kontakt ikke fundet'}
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => navigate('/admin/henvendelser')} 
              className="mt-4"
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tilbage til henvendelser
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
                onClick={() => navigate('/admin/henvendelser')} 
                variant="outline"
                size="sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tilbage
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-brand-gray-900">Kontakthenvendelse</h1>
                <p className="text-brand-gray-600">{contact.fullName} fra {contact.companyName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(contact.status)}
              {getPriorityBadge(contact.priority)}
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
            {/* Contact Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Information */}
              <Card className="card-brand">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-brand-gray-900">
                    <User className="h-5 w-5 text-brand-primary" />
                    Kontaktoplysninger
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-brand-gray-700">Fulde navn</Label>
                      <p className="text-brand-gray-900 font-medium">{contact.fullName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-brand-gray-700">Email</Label>
                      <p className="text-brand-gray-900">
                        <a href={`mailto:${contact.email}`} className="text-brand-primary hover:underline">
                          {contact.email}
                        </a>
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-brand-gray-700">Telefon</Label>
                      <p className="text-brand-gray-900">
                        <a href={`tel:${contact.phone}`} className="text-brand-primary hover:underline">
                          {contact.phone}
                        </a>
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-brand-gray-700">Virksomhed</Label>
                      <p className="text-brand-gray-900 font-medium">{contact.companyName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-brand-gray-700">Branche</Label>
                      <p className="text-brand-gray-900">{getIndustryName(contact.industry)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-brand-gray-700">Forretningsværdi</Label>
                      <div className="mt-1">
                        {getBusinessValueBadge(contact.estimatedBusinessValue)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Message */}
              <Card className="card-brand">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-brand-gray-900">
                    <MessageSquare className="h-5 w-5 text-brand-primary" />
                    Besked
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-brand-gray-50 rounded-lg">
                    <p className="text-brand-gray-900 whitespace-pre-wrap">{contact.message}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Technical Information */}
              <Card className="card-brand">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-brand-gray-900">
                    <Globe className="h-5 w-5 text-brand-primary" />
                    Tekniske oplysninger
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-brand-gray-700">IP-adresse</Label>
                      <p className="text-brand-gray-600">{contact.ipAddress}</p>
                    </div>
                    <div>
                      <Label className="text-brand-gray-700">Kilde</Label>
                      <p className="text-brand-gray-600">{contact.source}</p>
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-brand-gray-700">User Agent</Label>
                      <p className="text-brand-gray-600 text-xs break-all">{contact.userAgent}</p>
                    </div>
                  </div>
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
                    <Label className="text-sm font-medium text-brand-gray-700">Modtaget</Label>
                    <p className="text-brand-gray-900">
                      {format(new Date(contact.createdAt), 'dd. MMMM yyyy HH:mm', { locale: da })}
                    </p>
                  </div>
                  
                  {contact.responseDate && (
                    <div>
                      <Label className="text-sm font-medium text-brand-gray-700">Besvaret</Label>
                      <p className="text-brand-gray-900">
                        {format(new Date(contact.responseDate), 'dd. MMMM yyyy HH:mm', { locale: da })}
                      </p>
                    </div>
                  )}
                  
                  {contact.respondedBy && (
                    <div>
                      <Label className="text-sm font-medium text-brand-gray-700">Behandlet af</Label>
                      <p className="text-brand-gray-900">{contact.respondedBy.name}</p>
                    </div>
                  )}
                  
                  <div className="pt-3 border-t">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${contact.confirmationEmailSent ? 'bg-brand-success' : 'bg-brand-gray-300'}`}></div>
                        <span className="text-brand-gray-600">Bekræftelse sendt</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${contact.adminNotificationSent ? 'bg-brand-success' : 'bg-brand-gray-300'}`}></div>
                        <span className="text-brand-gray-600">Admin notificeret</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${contact.isRead ? 'bg-brand-success' : 'bg-brand-warning'}`}></div>
                        <span className="text-brand-gray-600">Læst</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${contact.followUpRequired ? 'bg-brand-warning' : 'bg-brand-gray-300'}`}></div>
                        <span className="text-brand-gray-600">Opfølgning</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Admin Actions */}
              <Card className="card-brand">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-brand-gray-900">
                    <FileText className="h-5 w-5 text-brand-primary" />
                    Admin handlinger
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="status" className="text-sm font-medium text-brand-gray-700">
                      Status
                    </Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Vælg status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Ny</SelectItem>
                        <SelectItem value="in_progress">I gang</SelectItem>
                        <SelectItem value="responded">Besvaret</SelectItem>
                        <SelectItem value="resolved">Løst</SelectItem>
                        <SelectItem value="closed">Lukket</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="internalNotes" className="text-sm font-medium text-brand-gray-700">
                      Interne noter
                    </Label>
                    <Textarea
                      id="internalNotes"
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      placeholder="Tilføj interne noter til denne henvendelse..."
                      className="input-brand mt-1"
                      rows={4}
                    />
                  </div>
                  
                  <Button 
                    onClick={handleUpdateStatus}
                    disabled={actionLoading}
                    className="w-full btn-brand-primary"
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Opdater kontakt
                  </Button>
                  
                  <div className="pt-2 border-t">
                    <Button 
                      asChild
                      variant="outline"
                      className="w-full"
                    >
                      <a href={`mailto:${contact.email}?subject=Re: Din henvendelse til Multi Grønt&body=Hej ${contact.firstName},%0D%0A%0D%0ATak for din henvendelse til Multi Grønt.%0D%0A%0D%0A`}>
                        <Mail className="h-4 w-4 mr-2" />
                        Svar via email
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardContactDetail; 