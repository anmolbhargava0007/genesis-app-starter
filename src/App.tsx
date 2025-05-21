
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SigninPage from "./pages/SigninPage";
import SignupPage from "./pages/SignupPage";
import MainLayout from "./layouts/MainLayout";
import DashboardContent from "./pages/DashboardContent";
import WorkspaceContent from "./pages/WorkspaceContent";
import UserManagementContent from "./pages/UserManagementContent";
import { AuthProvider } from "./context/AuthContext";
import { AuthLayout } from "./components/AuthLayout";
import { ThemeProvider } from "./context/ThemeContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider defaultTheme="dark">
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route element={<AuthLayout />}>
                <Route path="/signin" element={<SigninPage />} />
                <Route path="/signup" element={<SignupPage />} />
              </Route>

              {/* Protected routes with persistent layout */}
              <Route element={<AuthLayout protected withHeader />}>
                <Route path="/dashboard" element={<MainLayout><DashboardContent /></MainLayout>} />
                <Route path="/workspace" element={<MainLayout><WorkspaceContent /></MainLayout>} />
                <Route path="/usermanagement" element={<MainLayout><UserManagementContent /></MainLayout>} />
              </Route>

              {/* Redirect route */}
              <Route path="/" element={<Index />} />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
