
import React from "react";
import Sidebar from "@/components/Sidebar";
import { WorkspaceProvider } from "@/context/WorkspaceContext";
import { useAuth } from "@/context/AuthContext";
import UserMenu from "@/components/UserMenu";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { isAuthenticated } = useAuth();

  return (
    <WorkspaceProvider>
      <div className="flex h-screen w-full bg-background text-foreground">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="sticky top-0 z-20 border-b border-border bg-gray-700 dark:bg-gray-700 backdrop-blur supports-[backdrop-filter]:bg-gray-700/90 dark:supports-[backdrop-filter]:bg-gray-700/90 p-4 shadow-sm flex items-center justify-between">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <h1 className="text-2xl font-semibold text-foreground">
                {/* <span className="text-[#A259FF]">SalesAdvisor</span> */}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              {isAuthenticated && <UserMenu />}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto bg-gray-700 dark:bg-gray-700">
            {children}
          </div>
        </div>
      </div>
    </WorkspaceProvider>
  );
};

export default MainLayout;
