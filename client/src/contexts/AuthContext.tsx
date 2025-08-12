import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { apiGet, apiPost } from '@/utils/api';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_img?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

interface RegisterData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirmPassword: string;
  profile_img?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await apiGet('/api/auth/me');

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setUser(data.data.user);
            setToken('authenticated'); // We don't store the actual token anymore
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await apiPost('/api/auth/login', { email, password });
      const data = await response.json();

      if (data.success) {
        setUser(data.data.user);
        setToken('authenticated'); // We don't store the actual token anymore
        toast.success('Login successful!');
        return true;
      } else {
        toast.error(data.message || 'Login failed');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
      return false;
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      const response = await apiPost('/api/auth/register', {
        ...userData,
        profile_img: userData.profile_img || "",
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.data.user);
        setToken('authenticated'); // We don't store the actual token anymore
        toast.success('Registration successful!');
        return true;
      } else {
        toast.error(data.message || 'Registration failed');
        return false;
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed. Please try again.');
      return false;
    }
  };

  const logout = async () => {
    try {
      await apiPost('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      toast.success('Logged out successfully');
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
