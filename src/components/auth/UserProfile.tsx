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
import { LogOut, User, Settings, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UserProfileProps {
  variant?: 'card' | 'dropdown';
}

export const UserProfile: React.FC<UserProfileProps> = ({ variant = 'card' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    if (isCustomer(user)) {
      logout('customer');
    } else if (isAdmin(user)) {
      logout('admin');
    } else {
      logout();
    }
    navigate('/');
  };

  const handleProfileClick = () => {
    if (isCustomer(user)) {
      navigate('/profile');
    } else if (isAdmin(user)) {
      navigate('/admin/profile');
    }
  };

  const getUserInitials = () => {
    if (isCustomer(user)) {
      return user.contactPersonName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'CU';
    } else if (isAdmin(user)) {
      return user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'AD';
    }
    return 'U';
  };

  const getUserDisplayName = () => {
    if (isCustomer(user)) {
      return user.contactPersonName || 'Kunde';
    } else if (isAdmin(user)) {
      return user.name || 'Administrator';
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
                src={user.profilePictureUrl} 
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
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              {isCustomer(user) && user.companyName && (
                <p className="text-xs leading-none text-muted-foreground">{user.companyName}</p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {isCustomer(user) && (
            <>
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
          
          {isAdmin(user) && (
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
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback>{getUserInitials()}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">{getUserDisplayName()}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isCustomer(user) && (
          <>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Virksomhed</p>
              <p className="text-sm">{user.companyName}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">Rabatgruppe</p>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">{user.discountGroup}</Badge>
                <span className="text-sm text-muted-foreground">
                  ({getDiscountPercentage(user.discountGroup)}% rabat)
                </span>
              </div>
            </div>
          </>
        )}

        {isAdmin(user) && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Rolle</p>
            <Badge variant="default">
              <Shield className="w-3 h-3 mr-1" />
              {user.role || 'Administrator'}
            </Badge>
          </div>
        )}

        <div className="flex space-x-2">
          <Button variant="outline" className="flex-1">
            <Settings className="w-4 h-4 mr-2" />
            Indstillinger
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Log ud
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}; 