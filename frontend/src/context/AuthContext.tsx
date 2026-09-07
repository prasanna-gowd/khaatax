import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthResponse } from '../types';
import { apiClient } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (emailOrPhone: string, password: string) => Promise<void>;
  register: (name: string, emailOrPhone: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('khaatax_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('khaatax_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await apiClient.get<User>('/auth/me');
          setUser(res.data);
          localStorage.setItem('khaatax_user', JSON.stringify(res.data));
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (email_or_phone: string, password: string) => {
    const res = await apiClient.post<AuthResponse>('/auth/login', {
      email_or_phone,
      password,
    });
    setToken(res.data.access_token);
    setUser(res.data.user);
    localStorage.setItem('khaatax_token', res.data.access_token);
    localStorage.setItem('khaatax_user', JSON.stringify(res.data.user));
  };

  const register = async (name: string, email_or_phone: string, password: string) => {
    const res = await apiClient.post<AuthResponse>('/auth/register', {
      name,
      email_or_phone,
      password,
    });
    setToken(res.data.access_token);
    setUser(res.data.user);
    localStorage.setItem('khaatax_token', res.data.access_token);
    localStorage.setItem('khaatax_user', JSON.stringify(res.data.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('khaatax_token');
    localStorage.removeItem('khaatax_user');
    localStorage.removeItem('khaatax_active_group_id');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
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
