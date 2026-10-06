import type { NextFunction, Request, Response } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';

export type AuthUser = {
  id: string;
  email: string;
  role: 'patient' | 'admin';
};

declare global {
  namespace Express {
    interface Locals {
      user?: AuthUser;
    }
  }
}

const secret = () => {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters.');
  }
  return value;
};

export function signToken(user: AuthUser) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, secret(), { expiresIn: '8h' });
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authorization = req.header('authorization');
  if (!authorization) return next();

  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  try {
    const payload = jwt.verify(token, secret()) as JwtPayload;
    if (typeof payload.sub !== 'string' || typeof payload.email !== 'string' || !['patient', 'admin'].includes(String(payload.role))) {
      return res.status(401).json({ error: 'Invalid authentication token.' });
    }
    res.locals.user = { id: payload.sub, email: payload.email, role: payload.role as AuthUser['role'] };
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.header('authorization')) return res.status(401).json({ error: 'Authentication required.' });
  return optionalAuth(req, res, next);
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  return requireAuth(req, res, () => {
    if (res.locals.user?.role !== 'admin') return res.status(403).json({ error: 'Administrator access required.' });
    return next();
  });
}

export function jwtSecret() {
  return secret();
}