'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api } from '@/lib/api';
import * as authService from '@/services/auth';
import type { User, AuthResponse } from '@/lib/auth.types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { name: string; email: string; password: string; role?: string; company?: string; phone?: string; ref?: string }) => Promise<User>;
  verifyEmail: (email: string, otp: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * On mount: try a silent refresh first (HttpOnly cookie). If the access
   * token is still valid this is a cheap no-op that also rotates it.
   */
  const refreshUser = useCallback(async () => {
    try {
      if (!api.getAccessToken()) {
        const refreshed = await authService.refreshToken();
        if (!refreshed.success) {
          setUser(null);
          return;
        }
      }
      const res = await api.get<User>('/auth/me');
      if (res.success && res.data?.id) {
        setUser(res.data);
      } else {
        // One more attempt through the refresh path before giving up.
        const retry = await authService.refreshToken();
        if (retry.success && retry.data?.accessToken) {
          api.setTokens(retry.data.accessToken);
          const meRes = await api.get<User>('/auth/me');
          setUser(meRes.success ? meRes.data : null);
        } else {
          setUser(null);
          api.clearTokens();
        }
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [refreshUser]);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.post<AuthResponse>('/auth/login', { email, password });
    if (!res.success || !res.data?.accessToken) throw new Error(res.message || 'Login failed');
    api.setTokens(res.data.accessToken);
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (data: { name: string; email: string; password: string; role?: string; company?: string; phone?: string; ref?: string }): Promise<User> => {
    const res = await api.post<Partial<AuthResponse> & { user: User }>('/auth/register', data);
    if (!res.success) throw new Error(res.message);
    if (res.data.accessToken) {
      api.setTokens(res.data.accessToken);
    }
    setUser(res.data.user);
    return res.data.user;
  };

  const verifyEmail = async (email: string, otp: string): Promise<User> => {
    const res = await api.post<AuthResponse>('/auth/verify-email', { email, otp });
    if (!res.success || !res.data?.accessToken) throw new Error(res.message || 'Verification failed');
    api.setTokens(res.data.accessToken);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore network errors — clear locally regardless
    }
    api.clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, verifyEmail, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
