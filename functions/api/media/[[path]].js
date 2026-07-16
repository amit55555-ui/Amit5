// Cloudflare Pages Function — serve a media object from R2 (same-origin), with
// HTTP range support so videos stream/seek correctly (required by iOS Safari).

export async function onRequestGet({ params, env, request }) {
  if (!env.MEDIA_BUCKET) return new Response('R2 not configured', { status: 500 });

  const key = Array.isArray(params.path) ? params.path.join('/') : String(params.path || '');
  if (!key) return new Response('not found', { status: 404 });

  // Parse a Range header (e.g. "bytes=0-1023") into an R2 range option.
  let range;
  const rangeHeader = request.headers.get('range');
  if (rangeHeader) {
    const m = /bytes=(\d*)-(\d*)/.exec(rangeHeader);
    if (m) {
      const start = m[1] === '' ? undefined : parseInt(m[1], 10);
      const end = m[2] === '' ? undefined : parseInt(m[2], 10);
      if (start !== undefined && end !== undefined) range = { offset: start, length: end - start + 1 };
      else if (start !== undefined) range = { offset: start };
      else if (end !== undefined) range = { suffix: end };
    }
  }

  const obj = await env.MEDIA_BUCKET.get(key, range ? { range } : undefined);
  if (!obj) return new Response('not found', { status: 404 });

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  headers.set('accept-ranges', 'bytes');

  const total = obj.size;
  if (obj.range) {
    const offset = obj.range.offset || 0;
    const length = obj.range.length !== undefined ? obj.range.length : total - offset;
    const endPos = offset + length - 1;
    headers.set('content-range', `bytes ${offset}-${endPos}/${total}`);
    headers.set('content-length', String(length));
    return new Response(obj.body, { status: 206, headers });
  }

  headers.set('content-length', String(total));
  return new Response(obj.body, { status: 200, headers });
}
