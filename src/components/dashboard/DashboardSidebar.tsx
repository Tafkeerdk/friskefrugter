import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
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
} from "lucide-react";

const DashboardSidebar: React.FC = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  
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

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center px-2">
          <div className="flex items-center gap-2 text-xl font-medium">
            <div className="rounded-full bg-gradient-to-r from-blue-600 to-blue-700 p-1.5">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span>Admin Panel</span>
          </div>
          {user && (
            <div className="mt-2 text-xs text-gray-600">
              {user.name || user.email}
            </div>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin Overblik</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleNavigation("/admin")}
                  isActive={window.location.pathname === "/admin"}
                >
                  <LayoutDashboard className="mr-2 h-5 w-5" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleNavigation("/admin/applications")}>
                  <UserCheck className="mr-2 h-5 w-5" />
                  <span>B2B Ansøgninger</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleNavigation("/admin/products")}>
                  <Package className="mr-2 h-5 w-5" />
                  <span>Produkter</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleNavigation("/admin/categories")}>
                  <LayoutGrid className="mr-2 h-5 w-5" />
                  <span>Kategorier</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleNavigation("/admin/orders")}>
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  <span>Ordrer</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleNavigation("/admin/invoices")}>
                  <FileText className="mr-2 h-5 w-5" />
                  <span>Fakturaer</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleNavigation("/admin/customers")}>
                  <Users className="mr-2 h-5 w-5" />
                  <span>B2B Kunder</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleNavigation("/admin/discount-groups")}>
                  <Percent className="mr-2 h-5 w-5" />
                  <span>Rabatgrupper</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Analyse & Rapporter</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleNavigation("/admin/statistics")}>
                  <BarChart3 className="mr-2 h-5 w-5" />
                  <span>Statistik</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>System Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleNavigation("/admin/profile")}>
                  <Shield className="mr-2 h-5 w-5" />
                  <span>Min Profil</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleNavigation("/admin/settings")}>
                  <Settings className="mr-2 h-5 w-5" />
                  <span>Systemindstillinger</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <div className="px-2 py-2 text-xs text-gray-500 border-t">
          <div className="flex items-center gap-1 mb-1">
            <Shield className="h-3 w-3" />
            <span>Sikker Admin Session</span>
          </div>
          <div>Netlify Compatible</div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut className="mr-2 h-5 w-5" />
              <span>Log ud</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default DashboardSidebar;
