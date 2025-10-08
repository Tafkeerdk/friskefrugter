import React, { useState } from "react";
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Store,
  TrendingUp,
  Cog,
} from "lucide-react";

const DashboardSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const isMobile = useIsMobile();
  
  // State for collapsible menu sections
  const [expandedSections, setExpandedSections] = useState({
    products: true,
    customers: true,
    analytics: false,
    system: false,
  });
  
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
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
  
  const isAnySubMenuActive = (paths: string[]) => {
    return paths.some(path => location.pathname === path);
  };

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
        {/* Dashboard & Overview Section */}
        <SidebarGroup>
          <SidebarGroupLabel className={cn(isMobile ? "text-xs px-2" : "text-sm")}>
            Dashboard & Overblik
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
                    isActive("/admin") && "bg-brand-primary/10 text-brand-primary font-medium"
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
                    isActive("/admin/applications") && "bg-brand-primary/10 text-brand-primary font-medium"
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
                  onClick={handleNavigation("/admin/notifications")}
                  isActive={isActive("/admin/notifications")}
                  className={cn(
                    "transition-all duration-200 group",
                    isMobile ? "h-10 text-sm" : "h-11",
                    isActive("/admin/notifications") && "bg-brand-primary/10 text-brand-primary font-medium"
                  )}
                >
                  <Bell className={cn(
                    "transition-all flex-shrink-0",
                    isMobile ? "h-4 w-4" : "h-5 w-5"
                  )} />
                  <span className="truncate min-w-0 flex-1">
                    {isMobile ? "Notifikationer" : "Se alle notifikationer"}
                  </span>
                  <div className="ml-auto flex items-center flex-shrink-0">
                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleNavigation("/admin/henvendelser")}
                  isActive={isActive("/admin/henvendelser")}
                  className={cn(
                    "transition-all duration-200 group",
                    isMobile ? "h-10 text-sm" : "h-11",
                    isActive("/admin/henvendelser") && "bg-brand-primary/10 text-brand-primary font-medium"
                  )}
                >
                  <MessageSquare className={cn(
                    "transition-all flex-shrink-0",
                    isMobile ? "h-4 w-4" : "h-5 w-5"
                  )} />
                  <span className="truncate min-w-0 flex-1">
                    {isMobile ? "Henvendelser" : "Henvendelser"}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Product Management Section */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible 
                open={expandedSections.products} 
                onOpenChange={() => toggleSection('products')}
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton 
                      className={cn(
                        "transition-all duration-200 group w-full justify-between",
                        isMobile ? "h-10 text-sm" : "h-11",
                        isAnySubMenuActive([
                          "/admin/products", 
                          "/admin/featured-products", 
                          "/admin/categories", 
                          "/admin/units"
                        ]) && "bg-brand-primary/10 text-brand-primary font-medium"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Store className={cn(
                          "transition-all flex-shrink-0",
                          isMobile ? "h-4 w-4" : "h-5 w-5"
                        )} />
                        <span className="truncate">Produktstyring</span>
                      </div>
                      {expandedSections.products ? (
                        <ChevronDown className={cn("transition-transform", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                      ) : (
                        <ChevronRight className={cn("transition-transform", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                </SidebarMenuItem>
                
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton 
                        onClick={handleNavigation("/admin/products")}
                        isActive={isActive("/admin/products")}
                        className={cn(
                          "transition-all duration-200",
                          isMobile ? "text-xs" : "text-sm"
                        )}
                      >
                        <Package className={cn("flex-shrink-0", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                        <span className="truncate">Produkter</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton 
                        onClick={handleNavigation("/admin/featured-products")}
                        isActive={isActive("/admin/featured-products")}
                        className={cn(
                          "transition-all duration-200",
                          isMobile ? "text-xs" : "text-sm"
                        )}
                      >
                        <Star className={cn("flex-shrink-0", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                        <span className="truncate">
                          {isMobile ? "Udvalgte" : "Udvalgte Produkter"}
                        </span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton 
                        onClick={handleNavigation("/admin/categories")}
                        isActive={isActive("/admin/categories")}
                        className={cn(
                          "transition-all duration-200",
                          isMobile ? "text-xs" : "text-sm"
                        )}
                      >
                        <LayoutGrid className={cn("flex-shrink-0", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                        <span className="truncate">Kategorier</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton 
                        onClick={handleNavigation("/admin/units")}
                        isActive={isActive("/admin/units")}
                        className={cn(
                          "transition-all duration-200",
                          isMobile ? "text-xs" : "text-sm"
                        )}
                      >
                        <Scale className={cn("flex-shrink-0", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                        <span className="truncate">Enheder</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Customer & Sales Management Section */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible 
                open={expandedSections.customers} 
                onOpenChange={() => toggleSection('customers')}
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton 
                      className={cn(
                        "transition-all duration-200 group w-full justify-between",
                        isMobile ? "h-10 text-sm" : "h-11",
                        isAnySubMenuActive([
                          "/admin/customers", 
                          "/admin/customer-carts",
                          "/admin/discount-groups", 
                          "/admin/unique-offers",
                          "/admin/orders",
                          "/admin/invoices"
                        ]) && "bg-brand-primary/10 text-brand-primary font-medium"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Users className={cn(
                          "transition-all flex-shrink-0",
                          isMobile ? "h-4 w-4" : "h-5 w-5"
                        )} />
                        <span className="truncate">Kunder & Salg</span>
                      </div>
                      {expandedSections.customers ? (
                        <ChevronDown className={cn("transition-transform", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                      ) : (
                        <ChevronRight className={cn("transition-transform", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                </SidebarMenuItem>
                
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton 
                        onClick={handleNavigation("/admin/customers")}
                        isActive={isActive("/admin/customers")}
                        className={cn(
                          "transition-all duration-200",
                          isMobile ? "text-xs" : "text-sm"
                        )}
                      >
                        <Users className={cn("flex-shrink-0", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                        <span className="truncate">B2B Kunder</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton 
                        onClick={handleNavigation("/admin/customer-carts")}
                        isActive={isActive("/admin/customer-carts")}
                        className={cn(
                          "transition-all duration-200",
                          isMobile ? "text-xs" : "text-sm"
                        )}
                      >
                        <ShoppingCart className={cn("flex-shrink-0", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                        <span className="truncate">Kunde Kurve</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton 
                        onClick={handleNavigation("/admin/orders")}
                        isActive={isActive("/admin/orders")}
                        className={cn(
                          "transition-all duration-200",
                          isMobile ? "text-xs" : "text-sm"
                        )}
                      >
                        <ShoppingCart className={cn("flex-shrink-0", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                        <span className="truncate">Ordrer</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton 
                        onClick={handleNavigation("/admin/invoices")}
                        isActive={isActive("/admin/invoices")}
                        className={cn(
                          "transition-all duration-200",
                          isMobile ? "text-xs" : "text-sm"
                        )}
                      >
                        <FileText className={cn("flex-shrink-0", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                        <span className="truncate">Fakturaer</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton 
                        onClick={handleNavigation("/admin/discount-groups")}
                        isActive={isActive("/admin/discount-groups")}
                        className={cn(
                          "transition-all duration-200",
                          isMobile ? "text-xs" : "text-sm"
                        )}
                      >
                        <Percent className={cn("flex-shrink-0", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                        <span className="truncate">
                          {isMobile ? "Tilbud" : "Tilbudgrupper"}
                        </span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton 
                        onClick={handleNavigation("/admin/unique-offers")}
                        isActive={isActive("/admin/unique-offers")}
                        className={cn(
                          "transition-all duration-200",
                          isMobile ? "text-xs" : "text-sm"
                        )}
                      >
                        <Star className={cn("flex-shrink-0", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                        <span className="truncate">
                          {isMobile ? "Unikke" : "Unikke Tilbud"}
                        </span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Analytics & Reports Section */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible 
                open={expandedSections.analytics} 
                onOpenChange={() => toggleSection('analytics')}
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton 
                      className={cn(
                        "transition-all duration-200 group w-full justify-between",
                        isMobile ? "h-10 text-sm" : "h-11",
                        isAnySubMenuActive(["/admin/statistics"]) && "bg-brand-primary/10 text-brand-primary font-medium"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <TrendingUp className={cn(
                          "transition-all flex-shrink-0",
                          isMobile ? "h-4 w-4" : "h-5 w-5"
                        )} />
                        <span className="truncate">Analyse & Rapporter</span>
                      </div>
                      {expandedSections.analytics ? (
                        <ChevronDown className={cn("transition-transform", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                      ) : (
                        <ChevronRight className={cn("transition-transform", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                </SidebarMenuItem>
                
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton 
                        onClick={handleNavigation("/admin/statistics")}
                        isActive={isActive("/admin/statistics")}
                        className={cn(
                          "transition-all duration-200",
                          isMobile ? "text-xs" : "text-sm"
                        )}
                      >
                        <BarChart3 className={cn("flex-shrink-0", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                        <span className="truncate">Statistik</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* System Administration Section */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible 
                open={expandedSections.system} 
                onOpenChange={() => toggleSection('system')}
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton 
                      className={cn(
                        "transition-all duration-200 group w-full justify-between",
                        isMobile ? "h-10 text-sm" : "h-11",
                        isAnySubMenuActive(["/admin/profile", "/admin/settings"]) && "bg-brand-primary/10 text-brand-primary font-medium"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Cog className={cn(
                          "transition-all flex-shrink-0",
                          isMobile ? "h-4 w-4" : "h-5 w-5"
                        )} />
                        <span className="truncate">System Administration</span>
                      </div>
                      {expandedSections.system ? (
                        <ChevronDown className={cn("transition-transform", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                      ) : (
                        <ChevronRight className={cn("transition-transform", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                </SidebarMenuItem>
                
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton 
                        onClick={handleNavigation("/admin/profile")}
                        isActive={isActive("/admin/profile")}
                        className={cn(
                          "transition-all duration-200",
                          isMobile ? "text-xs" : "text-sm"
                        )}
                      >
                        <Shield className={cn("flex-shrink-0", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                        <span className="truncate">Min Profil</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton 
                        onClick={handleNavigation("/admin/settings")}
                        isActive={isActive("/admin/settings")}
                        className={cn(
                          "transition-all duration-200",
                          isMobile ? "text-xs" : "text-sm"
                        )}
                      >
                        <Settings className={cn("flex-shrink-0", isMobile ? "h-3 w-3" : "h-4 w-4")} />
                        <span className="truncate">
                          {isMobile ? "Indstillinger" : "Systemindstillinger"}
                        </span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </Collapsible>
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
