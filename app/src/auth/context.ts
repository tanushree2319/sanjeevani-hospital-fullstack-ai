import { createContext } from 'react';
import type { AuthSession } from '../lib/api';

export type AuthContextValue = {
  session: AuthSession | null;
  authenticate: (path: '/api/auth/login' | '/api/auth/register', payload: Record<string, string>) => Promise<AuthSession>;
  signOut: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);