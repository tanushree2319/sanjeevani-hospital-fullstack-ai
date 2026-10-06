export type ApiUser = {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'admin';
};

export type AuthSession = {
  token: string;
  user: ApiUser;
};

const SESSION_KEY = 'sanjeevani-session';

export function readSession(): AuthSession | null {
  try {
    const value = localStorage.getItem(SESSION_KEY);
    return value ? JSON.parse(value) as AuthSession : null;
  } catch {
    return null;
  }
}

export function writeSession(session: AuthSession | null) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = readSession();
  const headers = new Headers(init.headers);
  if (init.body) headers.set('Content-Type', 'application/json');
  if (session?.token) headers.set('Authorization', `Bearer ${session.token}`);

  let response: Response;
  try {
    response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}${path}`, { ...init, headers });
  } catch {
    throw new Error('Could not reach the hospital API. Check that the backend is running and try again.');
  }
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => ({})) as {
      error?: string | { message?: string };
      message?: string;
    }
    : {};
  const errorMessage = typeof payload.error === 'string' ? payload.error : payload.error?.message;
  if (!response.ok) {
    const fallback = response.status >= 500 || !contentType.includes('application/json')
      ? 'The hospital booking service is not configured or is unavailable. Please contact the hospital directly or try again later.'
      : 'The request could not be completed.';
    throw new Error(errorMessage || payload.message || fallback);
  }
  return payload as T;
}