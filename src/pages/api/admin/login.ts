import type { APIRoute } from 'astro';
import { ADMIN_COOKIE, createAdminToken, getAdminCookieOptions, isAdminConfigured, verifyAdminPassword } from '../../../lib/adminAuth';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const formData = await request.formData();
  const password = String(formData.get('password') ?? '');

  if (!isAdminConfigured()) {
    return new Response('ADMIN_SECRET is not configured.', { status: 500 });
  }

  if (!verifyAdminPassword(password)) {
    return new Response('Nespravne heslo.', { status: 401 });
  }

  cookies.set(ADMIN_COOKIE, createAdminToken(), getAdminCookieOptions());
  return new Response(null, { status: 303, headers: { Location: '/admin/akcie' } });
};