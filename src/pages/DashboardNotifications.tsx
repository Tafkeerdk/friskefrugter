import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  Bell, 
  BellRing, 
  Eye, 
  EyeOff, 
  CheckCheck, 
  Trash2, 
  Clock, 
  AlertTriangle,
  Loader2,
  RefreshCw,
  Mail,
  User,
  FileText,
  Package,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../lib/auth';

interface Notification {
  _id: string;
  title: string;
  message: string;
  description?: string;
  type: 'contact' | 'application' | 'order' | 'customer' | 'product' | 'inventory' | 'system';
  category: 'info' | 'warning' | 'success' | 'error' | 'urgent';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isOpened: boolean;
  openedBy?: Array<{
    adminId: string;
    openedAt: string;
  }>;
  targetAdmins: string[];
  isGlobal: boolean;
  actionUrl?: string;
  actionText?: string;
  requiresAction: boolean;
  relatedData?: any;
  createdAt: string;
  updatedAt: string;
}

interface NotificationResponse {
  success: boolean;
  notifications: Notification[];
  pagination: {
    current: number;
    total: number;
    count: number;
    totalItems: number;
  };
  statistics: {
    total: number;
    unread: number;
    urgent: number;
    thisWeek: number;
  };
}

const DashboardNotifications: React.FC = () => {
  const { adminUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState({ total: 0, unread: 0, urgent: 0, thisWeek: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all');

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authService.getNotifications({
        limit: 50,
        page: 1,
        unreadOnly: filter === 'unread'
      });
      
      if (response.success) {
        setNotifications(response.notifications || []);
        setStats(response.statistics || { total: 0, unread: 0, urgent: 0, thisWeek: 0 });
      } else {
        throw new Error(response.message || 'Failed to fetch notifications');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Kunne ikke indlæse notifikationer. Prøv igen senere.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (adminUser) {
      fetchNotifications();
    }
  }, [adminUser, filter]);

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await authService.markNotificationAsRead(notificationId);

      if (response.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === notificationId 
              ? { ...notif, isOpened: true }
              : notif
          )
        );
        // Update stats
        setStats(prev => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await authService.markAllNotificationsAsRead();

      if (response.success) {
        await fetchNotifications(); // Refresh data
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    const iconMap = {
      contact: Mail,
      application: User,
      order: Package,
      customer: User,
      product: Package,
      inventory: Package,
      system: Bell
    };
    
    const IconComponent = iconMap[type as keyof typeof iconMap] || Bell;
    return <IconComponent className="h-4 w-4" />;
  };

  const getTypeBadge = (type: string) => {
    const typeMap = {
      contact: { label: 'Kontakt', color: 'bg-blue-100 text-blue-800' },
      application: { label: 'Ansøgning', color: 'bg-green-100 text-green-800' },
      order: { label: 'Ordre', color: 'bg-purple-100 text-purple-800' },
      customer: { label: 'Kunde', color: 'bg-yellow-100 text-yellow-800' },
      product: { label: 'Produkt', color: 'bg-orange-100 text-orange-800' },
      inventory: { label: 'Lager', color: 'bg-red-100 text-red-800' },
      system: { label: 'System', color: 'bg-gray-100 text-gray-800' }
    };
    
    const config = typeMap[type as keyof typeof typeMap] || typeMap.system;
    
    return (
      <Badge className={`${config.color} border-0`}>
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap = {
      low: { label: 'Lav', color: 'bg-brand-gray-500 text-white' },
      medium: { label: 'Medium', color: 'bg-brand-warning text-white' },
      high: { label: 'Høj', color: 'bg-brand-error text-white' },
      urgent: { label: 'Akut', color: 'bg-red-600 text-white animate-pulse' }
    };
    
    const config = priorityMap[priority as keyof typeof priorityMap] || priorityMap.medium;
    
    return (
      <Badge className={`${config.color} border-0`}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes} min siden`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} timer siden`;
    } else {
      return date.toLocaleDateString('da-DK', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
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
                Du skal være logget ind som administrator for at se notifikationer.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const filteredNotifications = filter === 'urgent' 
    ? notifications.filter(n => n.priority === 'urgent')
    : notifications;

  return (
    <DashboardLayout>
      <div className="dashboard-page-container">
        <div className="content-width">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-brand-gray-900">Notifikationer</h1>
              <p className="text-brand-gray-600 mt-1">
                Administrer systemnotifikationer og beskeder
              </p>
            </div>
            <div className="flex gap-2">
              {stats.unread > 0 && (
                <Button 
                  onClick={markAllAsRead}
                  variant="outline"
                  className="border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white"
                >
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Marker alle som læst
                </Button>
              )}
              <Button 
                onClick={fetchNotifications}
                disabled={isLoading}
                className="btn-brand-primary"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Opdater
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="card-brand">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-brand-gray-700">
                  Totale notifikationer
                </CardTitle>
                <Bell className="h-4 w-4 text-brand-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-brand-gray-900">{stats.total}</div>
                <p className="text-xs text-brand-gray-500">
                  Alle notifikationer
                </p>
              </CardContent>
            </Card>

            <Card className="card-brand">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-brand-gray-700">
                  Ulæste
                </CardTitle>
                <BellRing className="h-4 w-4 text-brand-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-brand-warning">{stats.unread}</div>
                <p className="text-xs text-brand-gray-500">
                  Kræver opmærksomhed
                </p>
              </CardContent>
            </Card>

            <Card className="card-brand">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-brand-gray-700">
                  Akutte
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-brand-error" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-brand-error">{stats.urgent}</div>
                <p className="text-xs text-brand-gray-500">
                  Øjeblikkelig handling
                </p>
              </CardContent>
            </Card>

            <Card className="card-brand">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-brand-gray-700">
                  Denne uge
                </CardTitle>
                <Clock className="h-4 w-4 text-brand-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-brand-success">{stats.thisWeek}</div>
                <p className="text-xs text-brand-gray-500">
                  Nye denne uge
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="card-brand mb-6">
            <CardHeader>
              <CardTitle className="text-lg text-brand-gray-900">
                Filter notifikationer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant={filter === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilter('all')}
                  className={filter === 'all' ? 'btn-brand-primary' : ''}
                >
                  Alle ({stats.total})
                </Button>
                <Button 
                  variant={filter === 'unread' ? 'default' : 'outline'}
                  onClick={() => setFilter('unread')}
                  className={filter === 'unread' ? 'btn-brand-primary' : ''}
                >
                  Ulæste ({stats.unread})
                </Button>
                <Button 
                  variant={filter === 'urgent' ? 'default' : 'outline'}
                  onClick={() => setFilter('urgent')}
                  className={filter === 'urgent' ? 'bg-brand-error hover:bg-brand-error/90 text-white border-0' : ''}
                >
                  Akutte ({stats.urgent})
                </Button>
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
              <span className="ml-3 text-brand-gray-600">Indlæser notifikationer...</span>
            </div>
          )}

          {/* Notifications List */}
          {!isLoading && filteredNotifications.length > 0 && (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <Card 
                  key={notification._id} 
                  className={`card-brand transition-all duration-200 ${
                    !notification.isOpened 
                      ? 'border-l-4 border-l-brand-primary bg-brand-primary/5' 
                      : 'hover:shadow-md'
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                      {/* Notification Content */}
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary">
                              {getTypeIcon(notification.type)}
                            </div>
                            <h3 className="font-semibold text-brand-gray-900 text-lg">
                              {notification.title}
                            </h3>
                            {!notification.isOpened && (
                              <Badge className="bg-brand-primary text-white border-0 text-xs">
                                Ny
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {getTypeBadge(notification.type)}
                            {getPriorityBadge(notification.priority)}
                          </div>
                        </div>

                        <p className="text-brand-gray-700 leading-relaxed">
                          {notification.message}
                        </p>

                        {notification.description && (
                          <p className="text-sm text-brand-gray-600">
                            {notification.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-brand-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatDate(notification.createdAt)}</span>
                          </div>
                          {notification.isGlobal && (
                            <div className="flex items-center gap-1">
                              <Bell className="h-3 w-3" />
                              <span>Global notifikation</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-row lg:flex-col gap-2">
                        {!notification.isOpened && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => markAsRead(notification._id)}
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            <span className="hidden sm:inline">Marker som læst</span>
                          </Button>
                        )}
                        
                        {notification.actionUrl && notification.actionText && (
                          <Button 
                            size="sm"
                            className="btn-brand-primary"
                            onClick={() => {
                              if (notification.actionUrl?.startsWith('http')) {
                                window.open(notification.actionUrl, '_blank');
                              } else {
                                window.location.href = notification.actionUrl || '#';
                              }
                              if (!notification.isOpened) {
                                markAsRead(notification._id);
                              }
                            }}
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span className="hidden sm:inline ml-2">{notification.actionText}</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && filteredNotifications.length === 0 && (
            <Card className="card-brand">
              <CardContent className="p-12 text-center">
                <Bell className="h-12 w-12 text-brand-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-brand-gray-900 mb-2">
                  Ingen notifikationer fundet
                </h3>
                <p className="text-brand-gray-600 mb-6">
                  {filter === 'unread' 
                    ? 'Alle notifikationer er læst.'
                    : filter === 'urgent'
                    ? 'Ingen akutte notifikationer.'
                    : 'Der er endnu ingen notifikationer at vise.'
                  }
                </p>
                <Button 
                  onClick={() => setFilter('all')}
                  className="btn-brand-primary"
                >
                  Vis alle notifikationer
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardNotifications; 