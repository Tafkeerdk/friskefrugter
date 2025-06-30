import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { Bell, Search, ChevronDown, User, Settings, LogOut, X, Home, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { authService } from '@/lib/auth';

interface DashboardTopbarProps {
  title?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
}

const DashboardTopbar: React.FC<DashboardTopbarProps> = ({
  title,
  showSearch = true,
  searchPlaceholder,
  onSearch
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [searchValue, setSearchValue] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  const unreadCount = notifications.filter(n => n.unread).length;

  // Load notifications from API
  useEffect(() => {
    loadNotifications();
    
    // Set up periodic refresh for notifications
    const refreshInterval = setInterval(() => {
      loadNotifications();
    }, 30000); // Refresh every 30 seconds
    
    // Listen for notification updates from other components
    const handleNotificationsUpdate = () => {
      console.log('🔄 Topbar: Received notifications-updated event, refreshing...');
      loadNotifications();
    };
    
    window.addEventListener('notifications-updated', handleNotificationsUpdate);
    
    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('notifications-updated', handleNotificationsUpdate);
    };
  }, []);

  const loadNotifications = async () => {
    if (!user || isLoadingNotifications) return;
    
    setIsLoadingNotifications(true);
    try {
      const response = await authService.getNotifications({ limit: 10 });

      if (response.success) {
        setNotifications(response.notifications || []);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const response = await authService.markNotificationAsRead(notificationId);

      if (response.success) {
        // Update local state immediately
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, unread: false }
              : notif
          )
        );
        
        // Dispatch event to refresh other components
        window.dispatchEvent(new CustomEvent('notifications-updated'));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/super/admin');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/super/admin');
    }
  };

  const handleProfileClick = () => {
    navigate('/admin/profile');
  };

  const handleHomeClick = () => {
    navigate('/admin');
  };

  // Navigate to the base route (homepage)
  const handleGoToHomepage = () => {
    navigate('/');
  };

  const getUserInitials = () => {
    return user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'AD';
  };

  const getPageTitle = () => {
    if (title) return title;
    
    const pathMap: { [key: string]: string } = {
      '/admin': 'Dashboard',
      '/admin/products': 'Produkter',
      '/admin/categories': 'Kategorier',
      '/admin/orders': 'Ordrer',
      '/admin/customers': 'Kunder',
      '/admin/invoices': 'Fakturaer',
      '/admin/statistics': 'Statistikker',
      '/admin/discount-groups': 'Rabatgrupper',
      '/admin/unique-offers': 'Unikke Tilbud',
      '/admin/henvendelser': 'Henvendelser',
      '/admin/profile': 'Min Profil',
    };
    
    return pathMap[location.pathname] || 'Admin Panel';
  };

  const getSearchPlaceholder = () => {
    if (searchPlaceholder) return searchPlaceholder;
    
    const placeholderMap: { [key: string]: string } = {
      '/admin/products': 'Søg produkter...',
      '/admin/customers': 'Søg kunder...',
      '/admin/orders': 'Søg ordrer...',
      '/admin/invoices': 'Søg fakturaer...',
    };
    
    return placeholderMap[location.pathname] || 'Søg...';
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    onSearch?.(value);
  };

  const handleSearchFocus = () => {
    if (isMobile) {
      setIsSearchExpanded(true);
    }
  };

  const handleSearchBlur = () => {
    if (isMobile && !searchValue) {
      setIsSearchExpanded(false);
    }
  };

  const clearSearch = () => {
    setSearchValue("");
    setIsSearchExpanded(false);
    onSearch?.("");
  };

  return (
    <header className={cn(
      "sticky top-0 z-30 flex items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 w-full min-w-0",
      isMobile ? "h-14 px-3 dashboard-topbar" : "h-14 lg:h-16 px-4 lg:px-6"
    )}>
      {/* Mobile: Collapsed state */}
      {isMobile && !isSearchExpanded && (
        <>
          <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
            <SidebarTrigger className="h-8 w-8 flex-shrink-0" />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleHomeClick}
              className="h-8 w-8 flex-shrink-0"
              title="Gå til admin dashboard"
            >
              <Home className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGoToHomepage}
              className="h-8 px-2 flex-shrink-0 text-xs font-medium border-brand-gray-200 hover:bg-brand-gray-100 hover:text-brand-primary-dark hover:border-brand-gray-300 transition-colors"
              title="Gå til forsiden"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              <span className="hidden xs:inline">Forside</span>
            </Button>
            <div className="font-semibold text-sm truncate min-w-0 flex-1">{getPageTitle()}</div>
          </div>
          
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            {showSearch && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSearchFocus}
                className="h-8 w-8 flex-shrink-0"
              >
                <Search className="h-4 w-4" />
              </Button>
            )}
            
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 relative">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center text-xs bg-destructive text-destructive-foreground rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[90vw] max-w-[320px]">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Notifikationer</span>
                  {unreadCount > 0 && (
                    <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                      {unreadCount} nye
                    </span>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isLoadingNotifications ? (
                  <DropdownMenuItem className="py-3 justify-center">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-primary"></div>
                      <span className="text-sm">Indlæser notifikationer...</span>
                    </div>
                  </DropdownMenuItem>
                ) : notifications.length === 0 ? (
                  <DropdownMenuItem className="py-3 justify-center">
                    <div className="text-sm text-muted-foreground">
                      Ingen notifikationer
                    </div>
                  </DropdownMenuItem>
                ) : (
                  notifications.map((notification) => (
                    <DropdownMenuItem 
                      key={notification.id} 
                      className="py-3 cursor-pointer"
                      onClick={() => {
                        if (notification.unread) {
                          markNotificationAsRead(notification.id);
                        }
                        if (notification.actionUrl) {
                          navigate(notification.actionUrl);
                        }
                      }}
                    >
                      <div className="flex flex-col gap-1 w-full min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-sm truncate flex-1">
                            {notification.title}
                          </div>
                          {notification.unread && (
                            <div className="h-2 w-2 rounded-full bg-brand-primary flex-shrink-0"></div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {notification.message}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {notification.time}
                        </div>
                        {notification.requiresAction && (
                          <div className="text-xs text-brand-primary font-medium mt-1">
                            {notification.actionText || 'Se mere'}
                          </div>
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="justify-center font-medium text-sm cursor-pointer"
                  onClick={() => navigate('/admin/notifications')}
                >
                  Vis alle notifikationer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 px-1 flex items-center gap-1 min-w-0">
                  <Avatar className="h-6 w-6 flex-shrink-0">
                    <AvatarImage 
                      src={user?.profilePictureUrl} 
                      alt={user?.name || 'Admin'}
                    />
                    <AvatarFallback className="text-xs font-medium">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="truncate">Min konto</span>
                    <span className="text-xs text-muted-foreground font-normal truncate">
                      {user?.name || user?.email || 'Administrator'}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleGoToHomepage} className="cursor-pointer">
                  <ExternalLink className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Gå til forsiden</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Min profil</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Indstillinger</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Log ud</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      )}

      {/* Mobile: Expanded search state */}
      {isMobile && isSearchExpanded && (
        <div className="flex items-center gap-2 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="search"
              placeholder={getSearchPlaceholder()}
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              onBlur={handleSearchBlur}
              autoFocus
              className="pl-8 h-9 text-sm bg-muted/50 border-0 focus:bg-background focus:ring-2 focus:ring-primary/20"
            />
            {searchValue && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSearchExpanded(false)}
            className="h-8 w-8 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Desktop Layout - Improved width management */}
      {!isMobile && (
        <>
          {/* Left side - Sidebar trigger, title, and homepage button */}
          <div className="flex items-center gap-3 lg:gap-4 flex-shrink-0 min-w-0">
            <SidebarTrigger className="h-9 w-9 lg:h-10 lg:w-10 flex-shrink-0" />
            <div className="font-semibold text-lg lg:text-xl tracking-tight whitespace-nowrap truncate min-w-0">
              {getPageTitle()}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGoToHomepage}
              className="h-9 lg:h-10 px-3 lg:px-4 font-medium border-brand-gray-200 hover:bg-brand-gray-100 hover:text-brand-primary-dark hover:border-brand-gray-300 transition-colors whitespace-nowrap flex-shrink-0"
              title="Gå til forsiden"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Gå til forsiden
            </Button>
          </div>

          {/* Spacer */}
          <div className="flex-1 min-w-4" />

          {/* Search Bar - Centered with controlled width */}
          {showSearch && (
            <div className="relative w-full max-w-sm lg:max-w-md xl:max-w-lg 2xl:max-w-xl min-w-0">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={getSearchPlaceholder()}
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 h-9 lg:h-10 rounded-md bg-muted/50 border-0 focus:bg-background focus:ring-1 focus:ring-primary/30 transition-all w-full"
              />
              {searchValue && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearSearch}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 lg:h-8 lg:w-8"
                >
                  <X className="h-3 w-3 lg:h-4 lg:w-4" />
                </Button>
              )}
            </div>
          )}

          {/* Another spacer */}
          <div className="flex-1 min-w-4" />

          {/* Action Buttons - Right side */}
          <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 lg:h-10 lg:w-10 relative">
                  <Bell className="h-4 w-4 lg:h-5 lg:w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 lg:h-5 lg:w-5 flex items-center justify-center text-xs bg-destructive text-destructive-foreground rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[280px] lg:w-[320px] max-h-[400px] overflow-y-auto">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Notifikationer</span>
                  {unreadCount > 0 && (
                    <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                      {unreadCount} nye
                    </span>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isLoadingNotifications ? (
                  <DropdownMenuItem className="py-3 justify-center">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-primary"></div>
                      <span className="text-sm">Indlæser notifikationer...</span>
                    </div>
                  </DropdownMenuItem>
                ) : notifications.length === 0 ? (
                  <DropdownMenuItem className="py-3 justify-center">
                    <div className="text-sm text-muted-foreground">
                      Ingen notifikationer
                    </div>
                  </DropdownMenuItem>
                ) : (
                  notifications.map((notification) => (
                    <DropdownMenuItem 
                      key={notification.id} 
                      className="py-3 cursor-pointer"
                      onClick={() => {
                        if (notification.unread) {
                          markNotificationAsRead(notification.id);
                        }
                        if (notification.actionUrl) {
                          navigate(notification.actionUrl);
                        }
                      }}
                    >
                      <div className="flex flex-col gap-1 w-full min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-sm truncate flex-1">
                            {notification.title}
                          </div>
                          {notification.unread && (
                            <div className="h-2 w-2 rounded-full bg-brand-primary flex-shrink-0"></div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {notification.message}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {notification.time}
                        </div>
                        {notification.requiresAction && (
                          <div className="text-xs text-brand-primary font-medium mt-1">
                            {notification.actionText || 'Se mere'}
                          </div>
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="justify-center font-medium text-sm cursor-pointer"
                  onClick={() => navigate('/admin/notifications')}
                >
                  Vis alle notifikationer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 lg:h-10 px-2 lg:px-3 flex items-center gap-2 min-w-0">
                  <Avatar className="h-7 w-7 lg:h-8 lg:w-8 flex-shrink-0">
                    <AvatarImage 
                      src={user?.profilePictureUrl} 
                      alt={user?.name || 'Admin'}
                    />
                    <AvatarFallback className="text-xs lg:text-sm font-medium">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm lg:text-base font-medium truncate max-w-[100px] lg:max-w-[150px] hidden md:block">
                    {user?.name || 'Administrator'}
                  </span>
                  <ChevronDown className="h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground flex-shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px] lg:w-[220px]">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="truncate">Min konto</span>
                    <span className="text-xs text-muted-foreground font-normal truncate">
                      {user?.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleGoToHomepage} className="cursor-pointer">
                  <ExternalLink className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Gå til forsiden</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Min profil</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Indstillinger</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Log ud</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      )}
    </header>
  );
};

export default DashboardTopbar;
