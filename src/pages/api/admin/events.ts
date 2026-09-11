import type { APIRoute } from 'astro';
import { isAdminAuthenticated } from '../../../lib/adminAuth';
import { bulkDeleteEventPosts, createEventPost, deleteEventPost, reorderEventPosts, updateEventPost } from '../../../lib/eventPosts';

export const prerender = false;

function redirectToAdmin(request: Request) {
  const referer = request.headers.get('referer');
  let location = '/admin/akcie';

  if (referer) {
    try {
      const url = new URL(referer);
      if (url.pathname === '/admin/akcie') location = url.pathname + url.search;
    } catch {
      // keep default location
    }
  }

  return new Response(null, { status: 303, headers: { Location: location } });
}

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!isAdminAuthenticated(cookies)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const formData = await request.formData();
  const action = String(formData.get('action') ?? '');
  const id = String(formData.get('id') ?? '');
  const input = {
    eventType: String(formData.get('eventType') ?? ''),
    facebookPostUrl: String(formData.get('facebookPostUrl') ?? ''),
    facebookEmbedHeight: String(formData.get('facebookEmbedHeight') || 550),
  };

  try {
    if (action === 'create') {
      const position = formData.get('position') === 'bottom' ? 'bottom' : 'top';
      await createEventPost(input, position);
    } else if (action === 'update') {
      await updateEventPost(id, input);
    } else if (action === 'delete') {
      await deleteEventPost(id);
    } else if (action === 'bulk-delete') {
      const ids = formData.getAll('ids').map(String).filter(Boolean);
      await bulkDeleteEventPosts(ids);
    } else if (action === 'reorder') {
      const ids = formData.getAll('ids').map(String).filter(Boolean);
      await reorderEventPosts(ids);
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } else {
      return new Response('Unknown action', { status: 400 });
    }
  } catch (error) {
    return new Response(error instanceof Error ? error.message : 'Nepodarilo sa ulozit akciu.', { status: 400 });
  }

  return redirectToAdmin(request);
};