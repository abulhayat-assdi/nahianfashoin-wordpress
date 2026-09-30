import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const EXPIRY = '30d';
const EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

export interface JWTPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
  jti?: string;
  iat?: number;
  exp?: number;
}

// In-memory revoked token set. Best-effort: cleared on server restart.
// Tokens are auto-removed after 30 days (their natural expiry).
const revokedJtis = new Set<string>();

export function revokeJti(jti: string) {
  revokedJtis.add(jti);
  setTimeout(() => revokedJtis.delete(jti), EXPIRY_MS);
}

export function isJtiRevoked(jti: string): boolean {
  return revokedJtis.has(jti);
}

export async function createToken(payload: Omit<JWTPayload, 'iat' | 'exp' | 'jti'>): Promise<string> {
  const jti = crypto.randomUUID();
  return await new SignJWT({ ...payload, jti })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    const parsed = payload as unknown as JWTPayload;
    if (parsed.jti && isJtiRevoked(parsed.jti)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function getServerUser(type: 'public' | 'admin' = 'public'): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const cookieName = type === 'admin' ? 'surma-admin' : 'surma-auth';
  const token = cookieStore.get(cookieName)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 30, // 30 days
};
