
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { User } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  userRole: number;
  expiryDate: string | null;
  signin: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, mobile: string, gender: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  updateUserData: (updatedUser: User) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: 1,
  expiryDate: null,
  signin: async () => {},
  signup: async () => {},
  logout: () => {},
  loading: false,
  updateUserData: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<number>(1);
  const [expiryDate, setExpiryDate] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user is already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('auth_token');
    
    if (storedUser && storedToken) {
      try {
        const userData = JSON.parse(storedUser) as User;
        setUser(userData);
        setUserRole(userData.role_id || 1);
        
        // Set expiry date (sample)
        const expiryDateValue = localStorage.getItem('expiry_date') || '2025-12-31';
        setExpiryDate(expiryDateValue);
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        logout();
      }
    }
    
    setLoading(false);
  }, []);

  // Protected routes redirect logic
  useEffect(() => {
    if (!loading) {
      const isAuthRoute = location.pathname === '/signin' || location.pathname === '/signup' || location.pathname === '/';
      
      if (!user && !isAuthRoute) {
        navigate('/signin');
      } else if (user && isAuthRoute) {
        navigate('/dashboard');
      }
    }
  }, [user, loading, location.pathname, navigate]);

  const signin = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // Make API call here
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_email: email, user_pwd: password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to sign in');
      }
      
      if (data.success && data.data && data.data.token) {
        // Store user data and token
        localStorage.setItem('auth_token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        localStorage.setItem('expiry_date', '2025-12-31'); // Sample expiry date
        
        // Update state
        setUser(data.data.user);
        setUserRole(data.data.user.role_id || 1);
        setExpiryDate('2025-12-31');
        
        toast.success('Signed in successfully');
        navigate('/dashboard');
      } else {
        throw new Error(data.message || 'Failed to sign in');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in';
      toast.error(errorMessage);
      console.error('Sign in error:', error);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string, mobile: string, gender: string) => {
    try {
      setLoading(true);
      
      // Make API call here
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_name: name,
          user_email: email,
          user_pwd: password,
          user_mobile: mobile,
          gender,
          is_active: true,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to sign up');
      }
      
      if (data.success) {
        toast.success('Signed up successfully. Please sign in.');
        navigate('/signin');
      } else {
        throw new Error(data.message || 'Failed to sign up');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign up';
      toast.error(errorMessage);
      console.error('Sign up error:', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('expiry_date');
    setUser(null);
    setUserRole(1);
    setExpiryDate(null);
    navigate('/signin');
  };

  const updateUserData = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, userRole, expiryDate, signin, signup, logout, loading, updateUserData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
