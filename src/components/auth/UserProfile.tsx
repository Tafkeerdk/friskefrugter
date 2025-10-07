import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { isAdmin, isCustomer, getDiscountPercentage } from '../../lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '../ui/dropdown-menu';
import { LogOut, User, Settings, Shield, LayoutDashboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UserProfileProps {
  variant?: 'card' | 'dropdown';
}

export const UserProfile: React.FC<UserProfileProps> = ({ variant = 'card' }) => {
  const { user, customerUser, logout } = useAuth();
  const navigate = useNavigate();

  // Use customerUser for navbar display, fallback to user for admin contexts
  const displayUser = customerUser || user;

  if (!displayUser) return null;

  const handleLogout = () => {
    if (isCustomer(displayUser)) {
      logout('customer');
    } else if (isAdmin(displayUser)) {
      logout('admin');
    } else {
      logout();
    }
    navigate('/');
  };

  const handleProfileClick = () => {
    if (isCustomer(displayUser)) {
      navigate('/profile');
    } else if (isAdmin(displayUser)) {
      navigate('/admin/profile');
    }
  };

  const handleDashboardClick = () => {
    if (isCustomer(displayUser)) {
      navigate('/dashboard');
    } else if (isAdmin(displayUser)) {
      navigate('/admin');
    }
  };

  const getUserInitials = () => {
    if (isCustomer(displayUser)) {
      return displayUser.contactPersonName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'CU';
    } else if (isAdmin(displayUser)) {
      return displayUser.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'AD';
    }
    return 'U';
  };

  const getUserDisplayName = () => {
    if (isCustomer(displayUser)) {
      return displayUser.contactPersonName || 'Kunde';
    } else if (isAdmin(displayUser)) {
      return displayUser.name || 'Administrator';
    }
    return 'Bruger';
  };

  if (variant === 'dropdown') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage 
                src={displayUser.profilePictureUrl} 
                alt={getUserDisplayName()}
                enableCacheBusting={true}
              />
              <AvatarFallback>{getUserInitials()}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{getUserDisplayName()}</p>
              <p className="text-xs leading-none text-muted-foreground">{displayUser?.email}</p>
              {isCustomer(displayUser) && displayUser.companyName && (
                <p className="text-xs leading-none text-muted-foreground">{displayUser.companyName}</p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {isCustomer(displayUser) && (
            <>
              <DropdownMenuItem onClick={handleDashboardClick}>
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleProfileClick}>
                <User className="mr-2 h-4 w-4" />
                <span>Profil</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Indstillinger</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          
          {isAdmin(displayUser) && (
            <>
              <DropdownMenuItem>
                <Shield className="mr-2 h-4 w-4" />
                <span>Admin Panel</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log ud</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage 
              src={displayUser.profilePictureUrl} 
              alt={getUserDisplayName()}
              enableCacheBusting={true}
            />
            <AvatarFallback className="text-sm">{getUserInitials()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-sm leading-tight truncate">{getUserDisplayName()}</CardTitle>
            <CardDescription className="text-xs truncate">{displayUser?.email}</CardDescription>
            {isCustomer(displayUser) && displayUser.companyName && (
              <CardDescription className="text-xs truncate">{displayUser.companyName}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {isCustomer(displayUser) && (
          <>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Rabatgruppe</p>
              <div className="flex items-center space-x-2">
                <Badge 
                  variant="secondary" 
                  className="text-xs"
                  style={{
                    backgroundColor: typeof displayUser.discountGroup === 'object' && displayUser.discountGroup?.color 
                      ? `${displayUser.discountGroup.color}20` 
                      : undefined,
                    borderColor: typeof displayUser.discountGroup === 'object' && displayUser.discountGroup?.color 
                      ? displayUser.discountGroup.color 
                      : undefined,
                    color: typeof displayUser.discountGroup === 'object' && displayUser.discountGroup?.color 
                      ? displayUser.discountGroup.color 
                      : undefined
                  }}
                >
                  {typeof displayUser.discountGroup === 'object' && displayUser.discountGroup 
                    ? displayUser.discountGroup.name 
                    : (typeof displayUser.discountGroup === 'string' ? displayUser.discountGroup : 'Standard')
                  }
                </Badge>
              </div>
            </div>
          </>
        )}
        
        <div className="flex gap-2 pt-1">
          <Button 
            onClick={handleProfileClick}
            variant="outline" 
            size="sm"
            className="flex-1 text-xs h-7"
          >
            <User className="mr-1 h-3 w-3" />
            Profil
          </Button>
          <Button 
            onClick={handleLogout}
            variant="outline" 
            size="sm"
            className="flex-1 text-xs h-7"
          >
            <LogOut className="mr-1 h-3 w-3" />
            Log ud
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}; 