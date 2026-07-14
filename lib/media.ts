// Helpers for handling media URLs (direct video files vs. YouTube embeds).

const VIDEO_EXT = /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i;

export function isDirectVideo(url: string): boolean {
  return VIDEO_EXT.test(url);
}

// Extract a YouTube video id from the common URL shapes.
export function youTubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/watch\?v=([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
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
