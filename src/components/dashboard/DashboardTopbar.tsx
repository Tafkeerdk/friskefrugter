import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Bell, Search, ChevronDown, User, Settings, LogOut } from "lucide-react";
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

const DashboardTopbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchValue, setSearchValue] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

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
    <header className="sticky top-0 z-30 flex h-14 md:h-16 items-center gap-2 md:gap-4 border-b bg-background px-3 md:px-6">
      {/* Mobile: Sidebar trigger + Brand */}
      <div className="flex items-center gap-2 md:hidden min-w-0">
        <SidebarTrigger className="h-8 w-8 flex-shrink-0" />
        <div className="font-semibold text-sm truncate">Multi Grønt</div>
      </div>

      {/* Desktop: Brand */}
      <div className="hidden md:flex md:items-center">
        <div className="font-semibold text-lg">Multi Grønt Admin</div>
      </div>

      {/* Search Bar - Mobile First Design */}
      <div className={cn(
        "relative flex-1 max-w-md transition-all duration-200",
        isMobile && isSearchFocused ? "max-w-full" : "max-w-md"
      )}>
        <Search className={cn(
          "absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground transition-all flex-shrink-0",
          isMobile ? "h-3.5 w-3.5" : "h-4 w-4"
        )} />
        <Input
          type="search"
          placeholder={isMobile ? "Søg..." : "Søg produkter, kunder, ordrer..."}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          className={cn(
            "pl-8 rounded-full bg-muted/50 border-0 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all",
            isMobile ? "h-9 text-sm" : "h-10",
            isMobile && isSearchFocused && "bg-background ring-2 ring-primary/20"
          )}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className={cn(
              "relative transition-all hover:bg-muted",
              isMobile ? "h-8 w-8" : "h-9 w-9"
            )}>
              <Bell className={cn(isMobile ? "h-4 w-4" : "h-4 w-4")} />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary animate-pulse"></span>
              <span className="sr-only">Notifikationer</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className={cn(
            "w-[280px] max-h-[400px] overflow-y-auto",
            isMobile && "w-[90vw] max-w-[320px]"
          )}>
            <DropdownMenuLabel className="flex items-center justify-between">
              <span className="truncate">Notifikationer</span>
              <span className="text-xs text-muted-foreground flex-shrink-0">3 nye</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="py-3 cursor-pointer">
              <div className="flex flex-col gap-1 w-full min-w-0">
                <div className="font-medium text-sm truncate">Ny B2B ansøgning</div>
                <div className="text-xs text-muted-foreground truncate">Restaurant Noma har ansøgt om oprettelse</div>
                <div className="text-xs text-muted-foreground">For 5 minutter siden</div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem className="py-3 cursor-pointer">
              <div className="flex flex-col gap-1 w-full min-w-0">
                <div className="font-medium text-sm truncate">Lav lagerstatus</div>
                <div className="text-xs text-muted-foreground truncate">Økologiske æbler (3 kg tilbage)</div>
                <div className="text-xs text-muted-foreground">For 22 minutter siden</div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem className="py-3 cursor-pointer">
              <div className="flex flex-col gap-1 w-full min-w-0">
                <div className="font-medium text-sm truncate">Stor ordre modtaget</div>
                <div className="text-xs text-muted-foreground truncate">Café Sunshine - 15.000 kr</div>
                <div className="text-xs text-muted-foreground">For 1 time siden</div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center font-medium text-sm cursor-pointer">
              Vis alle notifikationer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className={cn(
              "relative flex items-center gap-2 px-2 transition-all hover:bg-muted min-w-0",
              isMobile ? "h-8" : "h-9"
            )}>
              <Avatar className={cn(isMobile ? "h-6 w-6" : "h-7 w-7", "flex-shrink-0")}>
                <AvatarImage 
                  src={user?.profilePictureUrl} 
                  alt={user?.name || 'Admin'}
                />
                <AvatarFallback className="text-xs font-medium">{getUserInitials()}</AvatarFallback>
              </Avatar>
              {!isMobile && (
                <div className="flex flex-col items-start min-w-0 flex-1">
                  <span className="text-sm font-medium truncate max-w-[120px]">{user?.name || 'Administrator'}</span>
                  <span className="text-xs text-muted-foreground truncate">{user?.role || 'Admin'}</span>
                </div>
              )}
              <ChevronDown className={cn(
                "text-muted-foreground flex-shrink-0",
                isMobile ? "h-3 w-3" : "h-3 w-3"
              )} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className={cn(
            isMobile && "w-[200px]"
          )}>
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="truncate">Min konto</span>
                {isMobile && (
                  <span className="text-xs text-muted-foreground font-normal truncate">
                    {user?.name || 'Administrator'}
                  </span>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
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
    </header>
  );
};

export default DashboardTopbar;
