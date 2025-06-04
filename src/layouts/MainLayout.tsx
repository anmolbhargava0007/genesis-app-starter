
import React from "react";
import Sidebar from "@/components/Sidebar";
import { WorkspaceProvider } from "@/context/WorkspaceContext";
import { useAuth } from "@/context/AuthContext";
import UserMenu from "@/components/UserMenu";
import { ThemeToggle } from "@/components/ThemeToggle";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { isAuthenticated } = useAuth();

  return (
    <WorkspaceProvider>
      <div className="flex h-screen bg-background">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="sticky top-0 z-20 border-b border-gray-700 p-4 bg-gray-800 shadow-sm flex items-center justify-between">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <h1 className="text-2xl font-semibold text-white">
                {/* <span className="text-[#A259FF]">SalesAdvisor</span> */}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              {isAuthenticated && <UserMenu />}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </WorkspaceProvider>
  );
};

export default MainLayout;
