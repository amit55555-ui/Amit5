// Cloudflare Pages Function — shared, cross-device analytics stored in KV.
// Uses the same PRODUCTS_KV binding as the catalog (key: "analytics").
//
//   POST /api/analytics   body: { events: [{ id, type }] }   (public — from the app)
//     type ∈ views | likes | clicks | shares
//     Merges a batch of engagement events into the shared totals.
//
//   GET  /api/analytics?password=…   (admin only)
//     Returns the full aggregated map { [productId]: {views,likes,clicks,shares} }.
//     Gated by the admin password so the funnel data isn't public.

const KEY = 'analytics';
const FIELDS = ['views', 'likes', 'clicks', 'shares'];
const DEFAULT_PASSWORD = 'amit2389@';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

// GET — admin-gated read of the aggregated funnel data.
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const pw = url.searchParams.get('password') || request.headers.get('x-admin-password') || '';
  const expected = env.ADMIN_PASSWORD || DEFAULT_PASSWORD;
  if (pw !== expected) return json({ error: 'unauthorized' }, 401);
  if (!env.PRODUCTS_KV) return json({});
  try {
    const raw = await env.PRODUCTS_KV.get(KEY);
    return json(raw ? JSON.parse(raw) : {});
  } catch {
    return json({});
  }
}

// POST — public batch ingest of engagement events.
export async function onRequestPost({ request, env }) {
  if (!env.PRODUCTS_KV) return json({ ok: true }); // silently accept when unconfigured
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad json' }, 400);
  }
  // Admin-only reset: wipe all shared analytics.
  if (body.reset === true) {
    const expected = env.ADMIN_PASSWORD || DEFAULT_PASSWORD;
    if (body.password !== expected) return json({ error: 'unauthorized' }, 401);
    await env.PRODUCTS_KV.put(KEY, JSON.stringify({}));
    return json({ ok: true });
  }

  const events = Array.isArray(body.events) ? body.events : [];
  if (events.length === 0) return json({ ok: true });

  let map;
  try {
    const raw = await env.PRODUCTS_KV.get(KEY);
    map = raw ? JSON.parse(raw) : {};
  } catch {
    map = {};
  }

  let changed = false;
  for (const ev of events) {
    if (!ev || typeof ev.id !== 'string' || !FIELDS.includes(ev.type)) continue;
    // Cap batch counts defensively so a bad client can't inflate wildly.
    const n = Math.min(Math.max(parseInt(ev.n, 10) || 1, 1), 1000);
    const cur = map[ev.id] || { views: 0, likes: 0, clicks: 0, shares: 0 };
    cur[ev.type] += n;
    map[ev.id] = cur;
    changed = true;
  }
  if (changed) await env.PRODUCTS_KV.put(KEY, JSON.stringify(map));
  return json({ ok: true });
}
