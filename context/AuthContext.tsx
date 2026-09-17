import React, { createContext, useContext, useEffect, useState } from 'react';

import { ApiAuthError, fetchMe, sendLoginOtp, verifyLoginOtp, type ApiAuthUser } from '@/lib/api';
import { clearStoredToken, getStoredToken, setStoredToken } from '@/lib/auth-storage';

interface AuthState {
  user: ApiAuthUser | null;
  token: string | null;
  isLoading: boolean;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  // Called by the profile screen after a successful PATCH /auth/me so the
  // rest of the app (checkout prefill, account header) sees the new data
  // without waiting for a full re-login.
  setUser: (user: ApiAuthUser) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ApiAuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const storedToken = await getStoredToken();
      if (!storedToken) {
        if (!cancelled) setIsLoading(false);
        return;
      }
      try {
        const me = await fetchMe(storedToken);
        if (!cancelled) {
          setUser(me);
          setToken(storedToken);
        }
      } catch {
        // Token expired/invalid server-side — drop it instead of retrying
        // forever with a session the backend will never accept again.
        await clearStoredToken();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function sendOtp(phone: string) {
    await sendLoginOtp(phone);
  }

  async function verifyOtp(phone: string, otp: string) {
    const result = await verifyLoginOtp(phone, otp);
    await setStoredToken(result.token);
    setUser(result.user);
    setToken(result.token);
  }

  async function logout() {
    await clearStoredToken();
    setUser(null);
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, sendOtp, verifyOtp, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

export { ApiAuthError };
