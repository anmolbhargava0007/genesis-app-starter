
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
      <div className="flex h-screen bg-background text-foreground">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="sticky top-0 z-20 border-b bg-gray-700 backdrop-blur p-3 shadow-sm flex items-center justify-between">
            <div className="flex flex-col bg-gray-700 sm:flex-row items-start sm:items-center gap-4">
              <h1 className="text-2xl font-semibold">
                {/* <span className="text-[#A259FF]">DataGpt</span> */}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              {/* <ThemeToggle /> */}
              {isAuthenticated && <UserMenu />}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto bg-background">
            {children}
          </div>
        </div>
      </div>
    </WorkspaceProvider>
  );
};

export default MainLayout;
