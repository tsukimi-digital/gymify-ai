export const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

function getCsrfToken(): string {
  const match = document.cookie.match(/gymify_csrf=([^;]+)/);
  return match?.[1] ?? '';
}

interface ApiFetchOptions extends RequestInit {
  skipCsrf?: boolean;
}

let accessToken: string | null = null;
export function setAccessToken(token: string | null) { accessToken = token; }
export function getAccessToken() { return accessToken; }

export class QuotaExceededError extends Error {
  constructor() { super('QUOTA_EXCEEDED'); this.name = 'QuotaExceededError'; }
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  if (!options.skipCsrf && !['GET', 'HEAD'].includes(options.method ?? 'GET')) {
    headers['X-CSRF-Token'] = getCsrfToken();
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers, credentials: 'include' });

  if (res.status === 402) throw new QuotaExceededError();
  if (res.status === 401) {
    // Try refresh
    const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-CSRF-Token': getCsrfToken() },
    });
    if (refreshRes.ok) {
      const data = await refreshRes.json();
      setAccessToken(data.accessToken);
      headers['Authorization'] = `Bearer ${data.accessToken}`;
      const retry = await fetch(`${API_BASE}${path}`, { ...options, headers, credentials: 'include' });
      if (retry.status === 402) throw new QuotaExceededError();
      if (!retry.ok) throw new Error(`HTTP ${retry.status}`);
      return retry.json();
    }
    setAccessToken(null);
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { code: 'UNKNOWN', message: `HTTP ${res.status}` } }));
    throw new Error(err.error?.message ?? `HTTP ${res.status}`);
  }
  return res.json();
}
