// Cloudflare Pages Function — upload an image/video to R2, return a same-origin URL.
// Binding required: MEDIA_BUCKET → R2 bucket "shuk-media" (declared in wrangler.toml).

const DEFAULT_PASSWORD = 'amit2389@';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const EXT = {
  'video/mp4': '.mp4', 'video/webm': '.webm', 'video/ogg': '.ogv', 'video/quicktime': '.mov',
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif',
};

export async function onRequestPost({ request, env }) {
  if (!env.MEDIA_BUCKET) return json({ error: 'R2 not configured' }, 500);

  const password = request.headers.get('x-admin-password');
  if (password !== (env.ADMIN_PASSWORD || DEFAULT_PASSWORD)) {
    return json({ error: 'unauthorized' }, 401);
  }

  const contentType = request.headers.get('content-type') || 'application/octet-stream';
  if (!contentType.startsWith('video/') && !contentType.startsWith('image/')) {
    return json({ error: 'only image/video allowed' }, 415);
  }

  const ext = EXT[contentType] || '';
  const key = `media/${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;

  await env.MEDIA_BUCKET.put(key, request.body, { httpMetadata: { contentType } });

  return json({ url: `/api/media/${key}`, type: contentType.startsWith('video/') ? 'video' : 'image' });
}
