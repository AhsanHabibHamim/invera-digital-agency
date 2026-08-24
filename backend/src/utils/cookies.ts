import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export const REFRESH_COOKIE = 'refreshToken';

const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    // Cross-site deployments (frontend on Vercel, API on Railway) need None;
    // localhost dev is same-site so Lax is fine.
    sameSite: env.nodeEnv === 'production' ? 'none' : 'lax',
    path: '/api/auth',
    maxAge: REFRESH_MAX_AGE_MS,
  });
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: env.nodeEnv === 'production' ? 'none' : 'lax',
    path: '/api/auth',
  });
}

/**
 * Extract the refresh token from the HttpOnly cookie, falling back to a
 * JSON body value for non-browser clients during migration.
 */
export function extractRefreshToken(req: Request): string | undefined {
  const fromCookie = req.cookies?.[REFRESH_COOKIE];
  if (fromCookie && typeof fromCookie === 'string') return fromCookie;
  if (typeof req.body?.refreshToken === 'string') return req.body.refreshToken;
  return undefined;
}

/** Verify without DB — used by socket handshake. */
export function verifyAccessToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, env.jwtSecret) as { userId: string };
  } catch {
    return null;
  }
}
