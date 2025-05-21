
import { useAuth } from "@/context/AuthContext";
import { Navigate, Outlet } from "react-router-dom";
interface AuthLayoutProps {
  protected?: boolean;
  withHeader?: boolean;
}

export const AuthLayout = ({ protected: isProtected = false, withHeader = false }: AuthLayoutProps) => {
  const { isAuthenticated, loading, userRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (isProtected && !isAuthenticated) {
    return <Navigate to="/signin" />;
  }

  if (!isProtected && isAuthenticated) {
    // Redirect based on user role
    return <Navigate to={userRole === 1 ? "/dashboard" : "/workspace"} />;
  }

  return (
    <>
      <Outlet />
    </>
  );
};
