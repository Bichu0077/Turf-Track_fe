export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'user' | 'admin' | 'superadmin';
  location?: string;
  company?: string;
  createdAt?: string;
  memberSince?: string;
  lastLoginAt?: string;
  avatar?: string;
  profile_pic?: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
}

const STORAGE_KEY = 'tms_auth';

export function saveAuth(state: AuthState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function loadAuth(): AuthState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { user: null, token: null };
  try { return JSON.parse(raw); } catch { return { user: null, token: null }; }
}

export function clearAuth() {
  localStorage.removeItem(STORAGE_KEY);
}

export async function apiRequest<T>(path: string, options: RequestInit = {}, tokenOverride?: string | null): Promise<T> {
  let token = tokenOverride;
  if (typeof token === 'undefined') {
    token = loadAuth().token;
  }
  
  // Construct full URL for API requests
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const fullUrl = path.startsWith('http') ? path : `${baseUrl}${path}`;
  
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  
  // Debug log for outgoing request
  console.log('[apiRequest] Request to', fullUrl, 'with headers:', Object.fromEntries(headers.entries()));
  
  const res = await fetch(fullUrl, { ...options, headers });
  if (!res.ok) {
    const msg = await res.text().catch(() => 'Request failed');
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return res.json();
}


