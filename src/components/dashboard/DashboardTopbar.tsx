
import React from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Bell, Search, ChevronDown, User, Settings, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
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

const DashboardTopbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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

  const getUserInitials = () => {
    return user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'AD';
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <SidebarTrigger />
        <div className="font-medium">FriskeFrugter</div>
      </div>

      <div className="hidden md:flex md:flex-1 md:items-center md:gap-4 lg:gap-8">
        <div className="font-medium text-lg">FriskeFrugter</div>
      </div>

      <div className="relative flex-1 md:grow-0 lg:flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Søg..."
          className="pl-8 rounded-full bg-muted w-full md:w-[300px] lg:w-[400px]"
        />
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary"></span>
              <span className="sr-only">Notifikationer</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[300px]">
            <DropdownMenuLabel>Notifikationer</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="py-2">
              <div className="flex flex-col gap-1">
                <div className="font-medium">Ny ordre modtaget</div>
                <div className="text-sm text-muted-foreground">Fra Café Sunshine (#12345)</div>
                <div className="text-xs text-muted-foreground">For 5 minutter siden</div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem className="py-2">
              <div className="flex flex-col gap-1">
                <div className="font-medium">Lav lagerstatus</div>
                <div className="text-sm text-muted-foreground">Økologiske æbler (3 kg tilbage)</div>
                <div className="text-xs text-muted-foreground">For 22 minutter siden</div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem className="py-2">
              <div className="flex flex-col gap-1">
                <div className="font-medium">Ny prisændring godkendt</div>
                <div className="text-sm text-muted-foreground">Jordbær, Hindbær, Blåbær</div>
                <div className="text-xs text-muted-foreground">For 1 time siden</div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center font-medium">
              Vis alle notifikationer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 flex items-center gap-2">
                          <Avatar className="h-8 w-8">
              <AvatarImage 
                src={user?.profilePictureUrl} 
                alt={user?.name || 'Admin'}
                enableCacheBusting={true}
              />
              <AvatarFallback>{getUserInitials()}</AvatarFallback>
            </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium">{user?.name || 'Administrator'}</span>
                <span className="text-xs text-muted-foreground">{user?.role || 'Administrator'}</span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Min konto</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleProfileClick}>
              <User className="mr-2 h-4 w-4" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Indstillinger
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log ud
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default DashboardTopbar;
