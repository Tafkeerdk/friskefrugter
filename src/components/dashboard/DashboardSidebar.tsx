
import React from "react";
import { useNavigate } from "react-router-dom";
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
  MessageSquare,
  Settings,
  LayoutGrid,
  HelpCircle,
  LogOut,
} from "lucide-react";

const DashboardSidebar: React.FC = () => {
  const navigate = useNavigate();
  
  const handleNavigation = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(path);
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center px-2">
          <div className="flex items-center gap-2 text-xl font-medium">
            <div className="rounded-full bg-gradient-green p-1.5">
              <Package className="h-5 w-5 text-white" />
            </div>
            <span>FriskeFrugter</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Overblik</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleNavigation("/dashboard")}
                  isActive={window.location.pathname === "/dashboard"}
                >
                  <LayoutDashboard className="mr-2 h-5 w-5" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleNavigation("/dashboard/products")}>
                  <Package className="mr-2 h-5 w-5" />
                  <span>Produkter</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleNavigation("/dashboard/categories")}>
                  <LayoutGrid className="mr-2 h-5 w-5" />
                  <span>Kategorier</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleNavigation("/dashboard/orders")}>
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  <span>Ordrer</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleNavigation("/dashboard/invoices")}>
                  <FileText className="mr-2 h-5 w-5" />
                  <span>Fakturaer</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleNavigation("/dashboard/customers")}>
                  <Users className="mr-2 h-5 w-5" />
                  <span>Kunder</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Analyse</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleNavigation("/dashboard/statistics")}>
                  <BarChart3 className="mr-2 h-5 w-5" />
                  <span>Statistik</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Support</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleNavigation("/dashboard/messages")}>
                  <MessageSquare className="mr-2 h-5 w-5" />
                  <span>Beskeder</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleNavigation("/dashboard/settings")}>
                  <Settings className="mr-2 h-5 w-5" />
                  <span>Indstillinger</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleNavigation("/dashboard/help")}>
                  <HelpCircle className="mr-2 h-5 w-5" />
                  <span>Hjælp</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleNavigation("/login")}>
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
