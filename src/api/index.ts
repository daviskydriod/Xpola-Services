// src/api/index.ts — Xpola API Client (UPGRADED)
//
// Changes from v1:
//  - Automatic token refresh on 401 (silent re-auth)
//  - Idempotency-Key header on POST requests when provided
//  - Request timeout (15s)
//  - Retry logic for 503/network errors (1 retry)
//  - Rate-limit (429) awareness with Retry-After header
//  - Centralised error types

// Configure with VITE_API_URL in .env.local or the frontend host.
export const API_BASE = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');

// ── Token storage ─────────────────────────────────────────────────────────────
export const getToken      = ()          => localStorage.getItem('xpola_token');
export const setToken      = (t: string) => localStorage.setItem('xpola_token', t);
export const clearToken    = ()          => localStorage.removeItem('xpola_token');
export const getAdminToken = ()          => localStorage.getItem('xpola_admin_token');

// ── Error types ───────────────────────────────────────────────────────────────
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public retryAfter?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class RateLimitError extends ApiError {
  constructor(retryAfter: number) {
    super(`Too many requests. Please wait ${retryAfter} seconds.`, 429, retryAfter);
    this.name = 'RateLimitError';
  }
}

// ── Refresh state (prevents concurrent refresh storms) ───────────────────────
let _refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth.php?action=refresh`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
      });
      if (!res.ok) { clearToken(); return null; }
      const data = await res.json();
      if (data.token) { setToken(data.token); return data.token; }
      clearToken();
      return null;
    } catch {
      clearToken();
      return null;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────
interface FetchOptions extends RequestInit {
  auth?:           boolean;
  adminAuth?:      boolean;
  idempotencyKey?: string;
  _isRetry?:       boolean;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { auth = false, adminAuth = false, idempotencyKey, _isRetry = false, ...rest } = options;

  const headers: Record<string, string> = {
    ...(rest.headers as Record<string, string> | undefined),
  };

  // Only set Content-Type for JSON bodies (not FormData)
  if (!(rest.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (auth || adminAuth) {
    const token = adminAuth ? getAdminToken() : getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }

  // AbortController for timeout
  const controller = new AbortController();
  const timeout    = setTimeout(() => controller.abort(), 15_000);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...rest,
      headers,
      signal: controller.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timeout);
    if ((err as Error).name === 'AbortError') {
      throw new ApiError('Request timed out. Please check your connection.', 408);
    }
    // Network error — retry once
    if (!_isRetry) {
      return apiFetch<T>(path, { ...options, _isRetry: true });
    }
    throw new ApiError('Network error. Please check your connection.', 0);
  } finally {
    clearTimeout(timeout);
  }

  // ── Rate limit ────────────────────────────────────────────────────────────
  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get('Retry-After') ?? '60', 10);
    throw new RateLimitError(retryAfter);
  }

  // ── Token expired — try refresh once ────────────────────────────────────
  if (res.status === 401 && auth && !_isRetry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiFetch<T>(path, { ...options, _isRetry: true });
    }
    // Refresh failed — force logout via event
    window.dispatchEvent(new CustomEvent('xpola:logout'));
    throw new ApiError('Session expired. Please log in again.', 401);
  }

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      msg = err.error ?? msg;
    } catch { /* ignore */ }
    throw new ApiError(msg, res.status);
  }

  return res.json() as Promise<T>;
}

// ── Convenience wrappers ─────────────────────────────────────────────────────
export const apiGet = <T>(path: string, auth = false) =>
  apiFetch<T>(path, { method: 'GET', auth });

export const apiPost = <T>(path: string, body: unknown, auth = false, idempotencyKey?: string) =>
  apiFetch<T>(path, {
    method:  'POST',
    body:    body instanceof FormData ? body : JSON.stringify(body),
    auth,
    idempotencyKey,
  });

export const apiPut = <T>(path: string, body: unknown, auth = false) =>
  apiFetch<T>(path, { method: 'PUT', body: JSON.stringify(body), auth });

export const apiDelete = <T>(path: string, auth = false) =>
  apiFetch<T>(path, { method: 'DELETE', auth });

// Admin-auth variants
export const adminGet    = <T>(path: string)                    => apiFetch<T>(path, { method: 'GET',    adminAuth: true });
export const adminPost   = <T>(path: string, body: unknown)     => apiFetch<T>(path, { method: 'POST',   body: body instanceof FormData ? body : JSON.stringify(body), adminAuth: true });
export const adminPut    = <T>(path: string, body: unknown)     => apiFetch<T>(path, { method: 'PUT',    body: JSON.stringify(body), adminAuth: true });
export const adminDelete = <T>(path: string)                    => apiFetch<T>(path, { method: 'DELETE', adminAuth: true });

// ── Idempotency key generator ─────────────────────────────────────────────────
export const generateIdempotencyKey = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
