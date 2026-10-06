import { useState } from 'react';
import type { AuthSession } from '../lib/api';
import { apiRequest, readSession, writeSession } from '../lib/api';
import { AuthContext } from './context';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(() => readSession());

  const authenticate = async (path: '/api/auth/login' | '/api/auth/register', payload: Record<string, string>) => {
    const nextSession = await apiRequest<AuthSession>(path, { method: 'POST', body: JSON.stringify(payload) });
    writeSession(nextSession);
    setSession(nextSession);
    return nextSession;
  };

  const signOut = () => {
    writeSession(null);
    setSession(null);
  };

  return <AuthContext.Provider value={{ session, authenticate, signOut }}>{children}</AuthContext.Provider>;
}
