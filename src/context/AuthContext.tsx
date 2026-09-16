import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, getStoredToken, setStoredToken } from '../api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (details: { name: string; email: string; password: string }) => Promise<void>;
  adminSetup: (details: { name: string; email: string; password: string; setup_key: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const stored = getStoredToken();
      if (stored) {
        try {
          const res = await api.getMe();
          setUser(res.user);
          setToken(stored);
        } catch {
          setStoredToken(null);
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    const res = await api.login(credentials);
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (details: { name: string; email: string; password: string }) => {
    const res = await api.register(details);
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const adminSetup = async (details: { name: string; email: string; password: string; setup_key: string }) => {
    const res = await api.adminSetup(details);
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    setStoredToken(null);
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (getStoredToken()) {
      try {
        const res = await api.getMe();
        setUser(res.user);
      } catch {
        logout();
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, adminSetup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
