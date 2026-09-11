import { createHmac, timingSafeEqual } from 'node:crypto';
import type { AstroCookies } from 'astro';

export const ADMIN_COOKIE = 'detickovo_admin';

const maxAgeSeconds = 60 * 60 * 8;

function getAdminSecret() {
  return import.meta.env.ADMIN_PASSWORD ?? import.meta.env.ADMIN_SECRET;
}

export function isAdminConfigured() {
  return Boolean(getAdminSecret());
}

function sign(value: string) {
  const secret = getAdminSecret();
  if (!secret) throw new Error('ADMIN_SECRET is not configured.');
  return createHmac('sha256', secret).update(value).digest('hex');
}

export function verifyAdminPassword(password: string) {
  const secret = getAdminSecret();
  return Boolean(secret && password === secret);
}

export function createAdminToken() {
  const expires = Date.now() + maxAgeSeconds * 1000;
  return `${expires}.${sign(String(expires))}`;
}

export function isAdminAuthenticated(cookies: AstroCookies) {
  const token = cookies.get(ADMIN_COOKIE)?.value;
  if (!token) return false;

  const [expires, signature] = token.split('.');
  if (!expires || !signature || Number(expires) < Date.now()) return false;

  const expected = sign(expires);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  return signatureBuffer.length === expectedBuffer.length && timingSafeEqual(signatureBuffer, expectedBuffer);
}

export function getAdminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'strict' as const,
    secure: import.meta.env.PROD,
    path: '/',
    maxAge: maxAgeSeconds,
  };
}