export function getFacebookPostHref(value: string) {
  const rawUrl = value.trim().replaceAll('&amp;', '&');
  const iframeSrc = rawUrl.match(/<iframe[^>]+src=["']([^"']+)/i)?.[1] ?? rawUrl;

  try {
    const url = new URL(iframeSrc);
    return url.pathname === '/plugins/post.php' ? (url.searchParams.get('href') ?? iframeSrc) : iframeSrc;
  } catch {
    return iframeSrc;
  }
}

export function getFacebookPostEmbedSrc(value: string) {
  const href = getFacebookPostHref(value);
  return `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(href)}&show_text=true&width=350`;
}