function getIframeSrc(value: string) {
  const rawUrl = value.trim().replaceAll('&amp;', '&');
  return rawUrl.match(/<iframe[^>]+src=["']([^"']+)/i)?.[1] ?? rawUrl;
}

function isFacebookHost(hostname: string) {
  return hostname === 'facebook.com' || hostname.endsWith('.facebook.com');
}

export function parseFacebookPostUrl(value: string) {
  const iframeSrc = getIframeSrc(value);

  try {
    const url = new URL(iframeSrc);

    if (!isFacebookHost(url.hostname)) return null;

    if (url.pathname === '/plugins/post.php') {
      const href = url.searchParams.get('href');
      return href ? parseFacebookPostUrl(href) : null;
    }

    if (url.pathname.includes('/posts/') || url.pathname === '/permalink.php' || url.searchParams.has('story_fbid')) {
      const href = url.toString();
      return {
        href,
        embedSrc: `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(href)}&show_text=true&width=350`,
      };
    }
  } catch {
    return null;
  }

  return null;
}

export function isValidFacebookPostUrl(value: string) {
  return Boolean(parseFacebookPostUrl(value));
}

export function getFacebookPostHref(value: string) {
  return parseFacebookPostUrl(value)?.href ?? value.trim();
}

export function getFacebookPostEmbedSrc(value: string) {
  return parseFacebookPostUrl(value)?.embedSrc ?? `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(value.trim())}&show_text=true&width=350`;
}