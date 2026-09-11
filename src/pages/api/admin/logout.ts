import type { APIRoute } from 'astro';
import { ADMIN_COOKIE } from '../../../lib/adminAuth';

export const prerender = false;

export const POST: APIRoute = async ({ cookies }) => {
  cookies.delete(ADMIN_COOKIE, { path: '/' });
  return new Response(null, { status: 303, headers: { Location: '/admin/akcie' } });
};