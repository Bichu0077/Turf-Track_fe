import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AuthState, AuthUser, clearAuth, loadAuth, saveAuth, apiRequest } from '@/lib/auth';

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, phone: string, password: string, role?: 'user' | 'admin') => Promise<void>;
  registerStart: (name: string, email: string, phone: string, password: string, role?: 'user' | 'admin') => Promise<{ transactionId: string; email: string; devCode?: string }>;
  verifyRegistration: (transactionId: string, code: string) => Promise<void>;
  resendRegistrationOtp: (transactionId: string) => Promise<{ devCode?: string }>;
  logout: () => void;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => loadAuth());
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    (async () => {
      // one-time migration: clear legacy mock bookings and user stub
      try {
        if (!localStorage.getItem('tms_migration_clear_1')) {
          localStorage.removeItem('bookings');
          localStorage.removeItem('user');
          localStorage.setItem('tms_migration_clear_1', '1');
        }
      } catch {}

      if (state.token && !state.user) {
        try {
          const data = await apiRequest<{ user: AuthUser }>('/api/auth/me');
          setState((s) => ({ ...s, user: data.user }));
        } catch {
          setState({ user: null, token: null });
          clearAuth();
        }
      }
      setInitialized(true);
    })();
  }, []);

  useEffect(() => { saveAuth(state); }, [state]);

  async function login(email: string, password: string) {
    const data = await apiRequest<{ token: string; user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setState({ token: data.token, user: data.user });
  }

  async function register(name: string, email: string, phone: string, password: string, role: 'user' | 'admin' = 'user') {
    const data = await apiRequest<{ token: string; user: AuthUser }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, phone, password, role })
    });
    setState({ token: data.token, user: data.user });
  }

  async function registerStart(name: string, email: string, phone: string, password: string, role: 'user' | 'admin' = 'user') {
    const data = await apiRequest<{ transactionId: string; email: string; expiresInSeconds: number; devCode?: string }>('/api/auth/register/start', {
      method: 'POST',
      body: JSON.stringify({ name, email, phone, password, role })
    });
    // Do not set auth state yet; wait for OTP verification
    return { transactionId: data.transactionId, email: data.email, devCode: (data as any).devCode };
  }

  async function verifyRegistration(transactionId: string, code: string) {
    const data = await apiRequest<{ token: string; user: AuthUser }>('/api/auth/register/verify', {
      method: 'POST',
      body: JSON.stringify({ transactionId, code })
    });
    setState({ token: data.token, user: data.user });
  }

  async function resendRegistrationOtp(transactionId: string) {
    const data = await apiRequest<{ expiresInSeconds: number; devCode?: string }>('/api/auth/register/resend', {
      method: 'POST',
      body: JSON.stringify({ transactionId })
    });
    return { devCode: (data as any).devCode };
  }

  function logout() {
    setState({ token: null, user: null });
    clearAuth();
  }

  async function refreshMe() {
    if (!state.token) return;
    const data = await apiRequest<{ user: AuthUser }>('/api/auth/me');
    setState((s) => ({ ...s, user: data.user }));
  }

  const value = useMemo<AuthContextValue>(() => ({ ...state, login, register, registerStart, verifyRegistration, resendRegistrationOtp, logout, refreshMe }), [state]);

  if (!initialized) return null;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}


