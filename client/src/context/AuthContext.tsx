// client/src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../config/api.ts';

interface User {
  id: number;
  username: string;
  name: string;
  role: 'ADMIN' | 'SUPERVISOR' | 'VIEWER';
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/api/auth/profile');
      if (res.data.success) {
        setUser(res.data.data);
      }
    } catch (e) {
      console.error('Failed to restore login session:', e);
      logoutLocal();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchProfile();
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.post('/api/auth/login', { username, password });
      if (res.data.success) {
        const { accessToken, refreshToken, user: userData } = res.data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        setUser(userData);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logoutLocal = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('refreshToken');
      await api.post('/api/auth/logout', { refreshToken: token });
    } catch (e) {
      console.error('Network logout failed:', e);
    } finally {
      logoutLocal();
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
