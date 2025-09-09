import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AuthState, AuthUser, clearAuth, loadAuth, saveAuth, apiRequest } from '@/lib/auth';

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, phone: string, password: string, role?: 'user' | 'admin') => Promise<void>;
  registerStart: (name: string, email: string, phone: string, password: string, role?: 'user' | 'admin') => Promise<{ transactionId: string; email: string; devCode?: string }>;
  verifyRegistration: (transactionId: string, code: string) => Promise<void>;
  resendRegistrationOtp: (transactionId: string) => Promise<{ devCode?: string }>;
  forgotPassword: (email: string) => Promise<{ transactionId: string; email: string; devCode?: string }>;
  verifyForgotPasswordOtp: (transactionId: string, code: string) => Promise<{ resetToken: string; email: string }>;
  resetPassword: (resetToken: string, newPassword: string) => Promise<void>;
  resendForgotPasswordOtp: (transactionId: string) => Promise<{ devCode?: string }>;
  logout: () => void;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {

  // Only store token in localStorage, always fetch user from backend
  const [state, setState] = useState<AuthState>(() => {
    const { token } = loadAuth();
    return { user: null, token };
  });
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

      // Always fetch user from backend if token exists
      if (state.token) {
        console.log('[Auth] Token before /api/auth/me:', state.token);
        try {
          const data = await apiRequest<{ user: AuthUser }>('/api/auth/me', {}, state.token);
          setState((s) => ({ ...s, user: data.user }));
        } catch (err) {
          console.error('[Auth] Error fetching /api/auth/me:', err);
          setState({ user: null, token: null });
          clearAuth();
        }
      }
      setInitialized(true);
    })();
  }, [state.token]);

  // Only store token in localStorage
  useEffect(() => { saveAuth({ token: state.token, user: null }); }, [state.token]);

  async function login(email: string, password: string) {
    const data = await apiRequest<{ token: string; user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setState({ token: data.token, user: null }); // user will be fetched by effect
  }

  async function register(name: string, email: string, phone: string, password: string, role: 'user' | 'admin' = 'user') {
    const data = await apiRequest<{ token: string; user: AuthUser }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, phone, password, role })
    });
    setState({ token: data.token, user: null }); // user will be fetched by effect
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
    setState({ token: data.token, user: null }); // user will be fetched by effect
  }

  async function resendRegistrationOtp(transactionId: string) {
    const data = await apiRequest<{ expiresInSeconds: number; devCode?: string }>('/api/auth/register/resend', {
      method: 'POST',
      body: JSON.stringify({ transactionId })
    });
    return { devCode: (data as any).devCode };
  }

  async function forgotPassword(email: string) {
    const data = await apiRequest<{ transactionId: string; email: string; expiresInSeconds: number; devCode?: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
    return { transactionId: data.transactionId, email: data.email, devCode: (data as any).devCode };
  }

  async function verifyForgotPasswordOtp(transactionId: string, code: string) {
    const data = await apiRequest<{ resetToken: string; email: string; expiresInSeconds: number }>('/api/auth/forgot-password/verify', {
      method: 'POST',
      body: JSON.stringify({ transactionId, code })
    });
    return { resetToken: data.resetToken, email: data.email };
  }

  async function resetPassword(resetToken: string, newPassword: string) {
    await apiRequest<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ resetToken, newPassword })
    });
  }

  async function resendForgotPasswordOtp(transactionId: string) {
    const data = await apiRequest<{ expiresInSeconds: number; devCode?: string }>('/api/auth/forgot-password/resend', {
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

  const value = useMemo<AuthContextValue>(() => ({ 
    ...state, 
    login, 
    register, 
    registerStart, 
    verifyRegistration, 
    resendRegistrationOtp, 
    forgotPassword,
    verifyForgotPasswordOtp,
    resetPassword,
    resendForgotPasswordOtp,
    logout, 
    refreshMe 
  }), [state]);

  if (!initialized) return null;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}


