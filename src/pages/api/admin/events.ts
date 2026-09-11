import type { APIRoute } from 'astro';
import { isAdminAuthenticated } from '../../../lib/adminAuth';
import { createEventPost, deleteEventPost, updateEventPost } from '../../../lib/eventPosts';

export const prerender = false;

function redirectToAdmin() {
  return new Response(null, { status: 303, headers: { Location: '/admin/akcie' } });
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
    facebookEmbedHeight: String(formData.get('facebookEmbedHeight') ?? ''),
  };

  try {
    if (action === 'create') {
      await createEventPost(input);
    } else if (action === 'update') {
      await updateEventPost(id, input);
    } else if (action === 'delete') {
      await deleteEventPost(id);
    } else {
      return new Response('Unknown action', { status: 400 });
    }
  } catch (error) {
    return new Response(error instanceof Error ? error.message : 'Nepodarilo sa ulozit akciu.', { status: 400 });
  }

  return redirectToAdmin();
};