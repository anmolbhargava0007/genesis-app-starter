import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { User, SigninRequest, SignupRequest, AuthResponse } from "@/types/auth";
import { toast } from "sonner";
import { authApi } from "@/services/authApi";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  userRole: number;
  expiryDate: string | null;
  isAppValid: boolean;
  signin: (credentials: SigninRequest) => Promise<boolean>;
  signup: (userData: SignupRequest) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<number>(2); // Default to GUEST
  const [expiryDate, setExpiryDate] = useState<string | null>(null);
  const [isAppValid, setIsAppValid] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user data exists in localStorage
    const storedUser = localStorage.getItem("user");
    const storedRole = localStorage.getItem("userRole");
    const storedExpiryDate = localStorage.getItem("expiryDate");
    const storedIsAppValid = localStorage.getItem("isAppValid");

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        if (storedRole) setUserRole(parseInt(storedRole, 10));
        if (storedExpiryDate) setExpiryDate(storedExpiryDate);
        if (storedIsAppValid) setIsAppValid(storedIsAppValid === "true");
      } catch (error) {
        console.error("Failed to parse user data:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("userRole");
        localStorage.removeItem("expiryDate");
        localStorage.removeItem("isAppValid");
      }
    }

    setLoading(false);
  }, []);

  const signin = async (credentials: SigninRequest): Promise<boolean> => {
    try {
      const response = await authApi.signin(credentials);

      if (response.success && response.data && response.data.length > 0) {
        if (!response.is_app_valid) {
          toast.error(
            "You have consumed the free tier of Prototype, please connect with Product team to enable the features."
          );
          return false;
        }

        const userData = response.data[0];

        // Set user role from response
        let roleId = 2; // Default to GUEST
        if (userData.pi_roles && userData.pi_roles.length > 0) {
          roleId = userData.pi_roles[0].role_id;
        }

        setUser(userData);
        setUserRole(roleId);
        setExpiryDate(response.expiry_date || null);
        setIsAppValid(response.is_app_valid || false);

        // Store data in localStorage
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("userRole", roleId.toString());
        if (response.expiry_date)
          localStorage.setItem("expiryDate", response.expiry_date);
        localStorage.setItem(
          "isAppValid",
          (response.is_app_valid || false).toString()
        );

        toast.success("Signed in successfully");

        // Redirect based on user role
        if (roleId === 1) {
          // Super Admin redirects to dashboard
          navigate("/dashboard");
        } else if (roleId === 2) {
          // Other users (like Guests) redirect to workspace
          navigate("/workspace");
        }
        return true;
      } else {
        toast.error(response.msg || "Failed to sign in");
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Failed to sign in. Please check your credentials.");
      return false;
    }
  };

  const signup = async (userData: SignupRequest): Promise<boolean> => {
    try {
      const response = await authApi.signup(userData);

      if (response.success) {
        toast.success("Account created successfully. Please sign in.");
        navigate("/signin");
        return true;
      } else {
        toast.error(response.msg || "Failed to create account");
        return false;
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast.error("Failed to create account. Please try again.");
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setUserRole(2); // Reset to GUEST
    setExpiryDate(null);
    setIsAppValid(true);
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    localStorage.removeItem("expiryDate");
    localStorage.removeItem("isAppValid");
    toast.success("Logged out successfully");
    navigate("/signin");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        userRole,
        expiryDate,
        isAppValid,
        signin,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
