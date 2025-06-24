import React from "react";
import DashboardSidebar from "./DashboardSidebar";
import DashboardTopbar from "./DashboardTopbar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <div className={cn(
        "flex min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100/50 overflow-hidden",
        isMobile ? "dashboard-layout" : ""
      )}>
        <DashboardSidebar />
        <SidebarInset className="flex-1 min-w-0">
          <div className="flex flex-col h-full w-full">
            <DashboardTopbar />
            <main className="flex-1 overflow-auto w-full">
              <div className={cn(
                "w-full transition-all duration-200",
                isMobile 
                  ? "px-3 py-4 space-y-4 max-w-full dashboard-content" 
                  : "px-4 md:px-6 py-4 md:py-6 space-y-6 max-w-full"
              )}>
                <div className={cn(
                  "w-full",
                  isMobile 
                    ? "max-w-full min-w-0" 
                    : "container mx-auto max-w-full"
                )}>
                  {children}
                </div>
              </div>
            </main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
