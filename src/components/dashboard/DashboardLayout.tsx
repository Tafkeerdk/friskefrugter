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
      <div className="flex min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100/50">
        <DashboardSidebar />
        <SidebarInset className="flex-1">
          <div className="flex flex-col h-full">
            <DashboardTopbar />
            <main className="flex-1 overflow-auto">
              <div className={cn(
                "w-full max-w-full transition-all duration-200",
                isMobile 
                  ? "px-2 py-3 space-y-3" 
                  : "px-4 md:px-6 py-4 md:py-6 space-y-6"
              )}>
                <div className={cn(
                  "w-full max-w-full",
                  isMobile 
                    ? "max-w-[calc(100vw-1rem)]" 
                    : "container mx-auto"
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
