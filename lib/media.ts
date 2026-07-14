// Helpers for handling media URLs (direct video files vs. YouTube embeds).

const VIDEO_EXT = /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i;

export function isDirectVideo(url: string): boolean {
  return VIDEO_EXT.test(url);
}

// Extract a YouTube video id from any common URL shape
// (watch, youtu.be, shorts, live, embed, mobile, with extra params).
export function youTubeId(url: string): string | null {
  if (!url) return null;
  const id = (s: string | null | undefined) =>
    s && /^[\w-]{11}$/.test(s) ? s : null;

  // Try proper URL parsing first (handles m.youtube.com, extra query params, etc.)
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\./, '').replace(/^m\./, '');
    if (host === 'youtu.be') {
      return id(u.pathname.split('/')[1]);
    }
    if (host.endsWith('youtube.com')) {
      const v = u.searchParams.get('v');
      if (id(v)) return v;
      const parts = u.pathname.split('/').filter(Boolean); // e.g. ["shorts","ID"]
      if (['shorts', 'live', 'embed', 'v'].includes(parts[0])) return id(parts[1]);
    }
  } catch {
    /* not a valid absolute URL — fall through to regex */
  }

  // Regex fallback for messy/partial inputs
  const m = url.match(/(?:youtu\.be\/|v=|\/shorts\/|\/live\/|\/embed\/)([\w-]{11})/);
  return m ? m[1] : null;
}

export function isYouTube(url: string): boolean {
  return youTubeId(url) !== null;
}

// Autoplaying, muted, looping embed URL suitable for a background-style player.
export function youTubeEmbed(url: string): string {
  const id = youTubeId(url);
  return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&modestbranding=1&playsinline=1&rel=0`;
}

// Any URL we can treat as playable "video" media (direct file or YouTube).
export function isVideoUrl(url: string): boolean {
  return isDirectVideo(url) || isYouTube(url);
}
