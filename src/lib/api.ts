const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Singleton refresh promise to avoid concurrent refresh races
let refreshingPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshingPromise) return refreshingPromise;
  refreshingPromise = fetch(`${API_URL}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => { refreshingPromise = null; });
  return refreshingPromise;
}

const NO_RETRY_PATHS = ['/api/auth/refresh', '/api/auth/login'];

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const opts: RequestInit = {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  };

  let res = await fetch(`${API_URL}${path}`, opts);

  // Auto-refresh on 401 (expired access token) — but not for auth endpoints
  if (res.status === 401 && !NO_RETRY_PATHS.some((p) => path.startsWith(p))) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      res = await fetch(`${API_URL}${path}`, opts);
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    if (body.details) console.error('[API validation]', body.details);
    const message =
      body.error ||
      (body.details
        ? Object.entries(body.details as Record<string, string[]>)
            .map(([k, v]) => `${k}: ${v.join(', ')}`)
            .join(' | ')
        : res.statusText) ||
      'Error desconocido';
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'DELETE',
      body: body ? JSON.stringify(body) : undefined,
    }),
};

export { ApiError };
