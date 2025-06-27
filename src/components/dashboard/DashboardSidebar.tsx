import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileText,
  Users,
  BarChart3,
  Settings,
  LayoutGrid,
  LogOut,
  Shield,
  UserCheck,
  Percent,
  Bell,
  ExternalLink,
  Scale,
  Star,
} from "lucide-react";

const DashboardSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const isMobile = useIsMobile();
  
  const handleNavigation = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(path);
  };

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await logout();
      navigate('/super/admin');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/super/admin');
    }
  };

  const handleGoToHomepage = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar>
      <SidebarHeader className={cn(isMobile ? "p-3" : "p-4")}>
        <div className="flex items-center">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <div className="rounded-lg bg-gradient-to-r from-green-600 to-green-700 p-2 flex-shrink-0">
              <Shield className={cn("text-white", isMobile ? "h-4 w-4" : "h-5 w-5")} />
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className={cn(
                "truncate",
                isMobile ? "text-base" : "text-lg"
              )}>
                Admin Panel
              </span>
              {user && (
                <div className={cn(
                  "text-muted-foreground font-normal truncate",
                  isMobile ? "text-xs" : "text-sm"
                )}>
                  {user?.name || user?.email || 'Bruger'}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Prominent "Gå til forsiden" button */}
        <div className="mt-3 pt-3 border-t border-border/50">
          <SidebarMenuButton 
            onClick={handleGoToHomepage}
            className={cn(
              "w-full justify-center bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white hover:text-white font-medium transition-all duration-200 shadow-sm hover:shadow-md",
              isMobile ? "h-10 text-sm" : "h-11 text-base"
            )}
          >
            <ExternalLink className={cn(
              "mr-2 flex-shrink-0",
              isMobile ? "h-4 w-4" : "h-5 w-5"
            )} />
            <span className="truncate">Gå til forsiden</span>
          </SidebarMenuButton>
        </div>
      </SidebarHeader>
      
      <SidebarContent className={cn(isMobile ? "px-2" : "px-3")}>
        <SidebarGroup>
          <SidebarGroupLabel className={cn(isMobile ? "text-xs px-2" : "text-sm")}>
            Admin Overblik
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleNavigation("/admin")}
                  isActive={isActive("/admin")}
                  className={cn(
                    "transition-all duration-200 group",
                    isMobile ? "h-10 text-sm" : "h-11",
                    isActive("/admin") && "bg-primary/10 text-primary font-medium"
                  )}
                >
                  <LayoutDashboard className={cn(
                    "transition-all flex-shrink-0",
                    isMobile ? "h-4 w-4" : "h-5 w-5"
                  )} />
                  <span className="truncate">Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleNavigation("/admin/applications")}
                  isActive={isActive("/admin/applications")}
                  className={cn(
                    "transition-all duration-200 group",
                    isMobile ? "h-10 text-sm" : "h-11",
                    isActive("/admin/applications") && "bg-primary/10 text-primary font-medium"
                  )}
                >
                  <UserCheck className={cn(
                    "transition-all flex-shrink-0",
                    isMobile ? "h-4 w-4" : "h-5 w-5"
                  )} />
                  <span className="truncate min-w-0 flex-1">
                    {isMobile ? "B2B Apps" : "B2B Ansøgninger"}
                  </span>
                  <div className="ml-auto flex items-center flex-shrink-0">
                    <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleNavigation("/admin/products")}
                  isActive={isActive("/admin/products")}
                  className={cn(
                    "transition-all duration-200",
                    isMobile ? "h-10 text-sm" : "h-11",
                    isActive("/admin/products") && "bg-primary/10 text-primary font-medium"
                  )}
                >
                  <Package className={cn(
                    "transition-all flex-shrink-0",
                    isMobile ? "h-4 w-4" : "h-5 w-5"
                  )} />
                  <span className="truncate">Produkter</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleNavigation("/admin/categories")}
                  isActive={isActive("/admin/categories")}
                  className={cn(
                    "transition-all duration-200",
                    isMobile ? "h-10 text-sm" : "h-11",
                    isActive("/admin/categories") && "bg-primary/10 text-primary font-medium"
                  )}
                >
                  <LayoutGrid className={cn(
                    "transition-all flex-shrink-0",
                    isMobile ? "h-4 w-4" : "h-5 w-5"
                  )} />
                  <span className="truncate">Kategorier</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleNavigation("/admin/units")}
                  isActive={isActive("/admin/units")}
                  className={cn(
                    "transition-all duration-200",
                    isMobile ? "h-10 text-sm" : "h-11",
                    isActive("/admin/units") && "bg-primary/10 text-primary font-medium"
                  )}
                >
                  <Scale className={cn(
                    "transition-all flex-shrink-0",
                    isMobile ? "h-4 w-4" : "h-5 w-5"
                  )} />
                  <span className="truncate">Enheder</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleNavigation("/admin/orders")}
                  isActive={isActive("/admin/orders")}
                  className={cn(
                    "transition-all duration-200",
                    isMobile ? "h-10 text-sm" : "h-11",
                    isActive("/admin/orders") && "bg-primary/10 text-primary font-medium"
                  )}
                >
                  <ShoppingCart className={cn(
                    "transition-all flex-shrink-0",
                    isMobile ? "h-4 w-4" : "h-5 w-5"
                  )} />
                  <span className="truncate">Ordrer</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleNavigation("/admin/invoices")}
                  isActive={isActive("/admin/invoices")}
                  className={cn(
                    "transition-all duration-200",
                    isMobile ? "h-10 text-sm" : "h-11",
                    isActive("/admin/invoices") && "bg-primary/10 text-primary font-medium"
                  )}
                >
                  <FileText className={cn(
                    "transition-all flex-shrink-0",
                    isMobile ? "h-4 w-4" : "h-5 w-5"
                  )} />
                  <span className="truncate">Fakturaer</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleNavigation("/admin/customers")}
                  isActive={isActive("/admin/customers")}
                  className={cn(
                    "transition-all duration-200",
                    isMobile ? "h-10 text-sm" : "h-11",
                    isActive("/admin/customers") && "bg-primary/10 text-primary font-medium"
                  )}
                >
                  <Users className={cn(
                    "transition-all flex-shrink-0",
                    isMobile ? "h-4 w-4" : "h-5 w-5"
                  )} />
                  <span className="truncate">
                    {isMobile ? "B2B Kunder" : "B2B Kunder"}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleNavigation("/admin/discount-groups")}
                  isActive={isActive("/admin/discount-groups")}
                  className={cn(
                    "transition-all duration-200",
                    isMobile ? "h-10 text-sm" : "h-11",
                    isActive("/admin/discount-groups") && "bg-primary/10 text-primary font-medium"
                  )}
                >
                  <Percent className={cn(
                    "transition-all flex-shrink-0",
                    isMobile ? "h-4 w-4" : "h-5 w-5"
                  )} />
                  <span className="truncate">
                    {isMobile ? "Rabat" : "Rabatgrupper"}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleNavigation("/admin/unique-offers")}
                  isActive={isActive("/admin/unique-offers")}
                  className={cn(
                    "transition-all duration-200",
                    isMobile ? "h-10 text-sm" : "h-11",
                    isActive("/admin/unique-offers") && "bg-primary/10 text-primary font-medium"
                  )}
                >
                  <Star className={cn(
                    "transition-all flex-shrink-0",
                    isMobile ? "h-4 w-4" : "h-5 w-5"
                  )} />
                  <span className="truncate">
                    {isMobile ? "Unikke" : "Unikke Tilbud"}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel className={cn(isMobile ? "text-xs px-2" : "text-sm")}>
            Analyse & Rapporter
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleNavigation("/admin/statistics")}
                  isActive={isActive("/admin/statistics")}
                  className={cn(
                    "transition-all duration-200",
                    isMobile ? "h-10 text-sm" : "h-11",
                    isActive("/admin/statistics") && "bg-primary/10 text-primary font-medium"
                  )}
                >
                  <BarChart3 className={cn(
                    "transition-all flex-shrink-0",
                    isMobile ? "h-4 w-4" : "h-5 w-5"
                  )} />
                  <span className="truncate">Statistik</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel className={cn(isMobile ? "text-xs px-2" : "text-sm")}>
            System Administration
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleNavigation("/admin/profile")}
                  isActive={isActive("/admin/profile")}
                  className={cn(
                    "transition-all duration-200",
                    isMobile ? "h-10 text-sm" : "h-11",
                    isActive("/admin/profile") && "bg-primary/10 text-primary font-medium"
                  )}
                >
                  <Shield className={cn(
                    "transition-all flex-shrink-0",
                    isMobile ? "h-4 w-4" : "h-5 w-5"
                  )} />
                  <span className="truncate">Min Profil</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleNavigation("/admin/settings")}
                  isActive={isActive("/admin/settings")}
                  className={cn(
                    "transition-all duration-200",
                    isMobile ? "h-10 text-sm" : "h-11",
                    isActive("/admin/settings") && "bg-primary/10 text-primary font-medium"
                  )}
                >
                  <Settings className={cn(
                    "transition-all flex-shrink-0",
                    isMobile ? "h-4 w-4" : "h-5 w-5"
                  )} />
                  <span className="truncate">
                    {isMobile ? "Indstillinger" : "Systemindstillinger"}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className={cn(isMobile ? "p-2" : "p-3")}>
        <div className={cn(
          "text-muted-foreground border-t pt-2 mb-2",
          isMobile ? "px-2 text-xs" : "px-2 text-xs"
        )}>
          <div className="flex items-center gap-1 mb-1">
            <Shield className="h-3 w-3 text-brand-primary flex-shrink-0" />
            <span className="truncate">Admin Session Aktiv</span>
          </div>
          <div className="text-xs text-muted-foreground truncate">
            Sikker forbindelse til Netlify
          </div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout}
              className={cn(
                "transition-all duration-200 hover:bg-red-50 hover:text-red-600",
                isMobile ? "h-10 text-sm" : "h-11"
              )}
            >
              <LogOut className={cn(
                "transition-all flex-shrink-0",
                isMobile ? "h-4 w-4" : "h-5 w-5"
              )} />
              <span className="truncate">Log ud</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default DashboardSidebar;
