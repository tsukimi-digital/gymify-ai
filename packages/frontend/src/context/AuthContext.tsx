import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { setAccessToken } from '../api/client';
import { getOrCreateFingerprint } from '../lib/fingerprint';

interface AuthState {
  userId: string | null;
  email: string | null;
  isPremium: boolean;
  plansGenerated: number;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  identify: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  setIsPremium: (v: boolean) => void;
  incrementPlansGenerated: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    userId: null, email: null, isPremium: false, plansGenerated: 0, isLoading: true,
  });

  const refreshAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setAccessToken(data.accessToken);
        // Decode JWT payload to get user state
        const payload = JSON.parse(atob(data.accessToken.split('.')[1]));
        setState(s => ({
          ...s,
          userId: payload.userId,
          isPremium: payload.isPremium,
          plansGenerated: payload.plansGenerated,
          isLoading: false,
        }));
      } else {
        setState(s => ({ ...s, isLoading: false }));
      }
    } catch {
      setState(s => ({ ...s, isLoading: false }));
    }
  }, []);

  useEffect(() => { refreshAuth(); }, [refreshAuth]);

  const identify = useCallback(async (email: string) => {
    const { apiFetch } = await import('../api/client');
    const fp = getOrCreateFingerprint();
    const data = await apiFetch<{
      userId: string;
      isPremium: boolean;
      plansGenerated: number;
      accessToken: string;
    }>('/auth/identify', {
      method: 'POST',
      body: JSON.stringify({ email, fingerprintToken: fp }),
      skipCsrf: true,
    });
    setAccessToken(data.accessToken);
    setState(s => ({
      ...s,
      userId: data.userId,
      email,
      isPremium: data.isPremium,
      plansGenerated: data.plansGenerated,
    }));
  }, []);

  const logout = useCallback(async () => {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); } catch {}
    setAccessToken(null);
    setState({ userId: null, email: null, isPremium: false, plansGenerated: 0, isLoading: false });
  }, []);

  const setIsPremium = useCallback((v: boolean) => setState(s => ({ ...s, isPremium: v })), []);
  const incrementPlansGenerated = useCallback(
    () => setState(s => ({ ...s, plansGenerated: s.plansGenerated + 1 })),
    [],
  );

  return (
    <AuthContext.Provider value={{ ...state, identify, logout, refreshAuth, setIsPremium, incrementPlansGenerated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
