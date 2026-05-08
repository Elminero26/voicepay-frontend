import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '../types';
import { authService } from '../services/api';
import { parseJwt, isTokenExpired } from '../utils/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('jwt_token'));
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const logout = useCallback(() => {
    localStorage.removeItem('jwt_token');
    setToken(null);
    setUser(null);
    // Use window.location instead of navigate for a hard redirect to clear state if needed,
    // or just navigate to login.
    navigate('/login');
  }, [navigate]);

  const checkSession = useCallback(() => {
    const storedToken = localStorage.getItem('jwt_token');
    
    if (!storedToken) {
      if (user) {
        setUser(null);
        setToken(null);
      }
      return;
    }

    if (isTokenExpired(storedToken)) {
      console.warn('Session expired detected in AuthContext');
      logout();
      return;
    }

    if (!user) {
      const decoded = parseJwt(storedToken);
      if (decoded) {
        setUser({
          id: decoded.sub || decoded.userId || '1',
          name: decoded.name || 'Admin User',
          email: decoded.email || decoded.sub || '',
          role: decoded.role?.toLowerCase() || 'admin',
          status: 'active',
          createdAt: '',
          phoneNumber: ''
        });
      }
    }
  }, [logout, user]);

  useEffect(() => {
    checkSession();
    setIsLoading(false);

    // Monitor storage changes (e.g. logout from another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'jwt_token') {
        if (!e.newValue) {
          logout();
        } else {
          setToken(e.newValue);
          checkSession();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Periodically check for expiration
    const interval = setInterval(() => {
      if (token && isTokenExpired(token)) {
        logout();
      }
    }, 30000); // Every 30 seconds

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [checkSession, logout, token]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await authService.login(email, password);
      localStorage.setItem('jwt_token', response.token);
      setToken(response.token);
      
      const decoded = parseJwt(response.token);
      setUser({
        id: decoded.sub || decoded.userId || '1',
        name: decoded.name || 'Admin User',
        email: decoded.email || decoded.sub || '',
        role: decoded.role?.toLowerCase() || 'admin',
        status: 'active',
        createdAt: '',
        phoneNumber: ''
      });
      
      // The Login component handles navigation or we can do it here
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !isTokenExpired(token),
        isLoading,
        login,
        logout,
        checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
