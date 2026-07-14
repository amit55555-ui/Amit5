// Cloudflare Pages Function — shared product catalog stored in KV.
// Binding required (Pages → Settings → Functions → KV namespace bindings):
//   Variable name: PRODUCTS_KV  →  namespace: shuk-products
// Env var required (Pages → Settings → Environment variables):
//   ADMIN_PASSWORD = amit2389@

const KEY = 'catalog';
const EMPTY = { custom: [], overrides: {}, hidden: [] };
// Write password. Uses the ADMIN_PASSWORD env var if set, otherwise this built-in value
// (same as the admin panel password). Keeps setup simple — no env var required.
const DEFAULT_PASSWORD = 'amit2389@';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

// GET /api/products → { custom, overrides, hidden }
export async function onRequestGet({ env }) {
  if (!env.PRODUCTS_KV) return json(EMPTY);
  try {
    const raw = await env.PRODUCTS_KV.get(KEY);
    return json(raw ? JSON.parse(raw) : EMPTY);
  } catch {
    return json(EMPTY);
  }
}

// POST /api/products  body: { password, data: { custom, overrides, hidden } }
export async function onRequestPost({ request, env }) {
  if (!env.PRODUCTS_KV) return json({ error: 'KV not configured' }, 500);
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad json' }, 400);
  }
  const expected = env.ADMIN_PASSWORD || DEFAULT_PASSWORD;
  if (body.password !== expected) {
    return json({ error: 'unauthorized' }, 401);
  }
  const data = body.data || {};
  const clean = {
    custom: Array.isArray(data.custom) ? data.custom : [],
    overrides: data.overrides && typeof data.overrides === 'object' ? data.overrides : {},
    hidden: Array.isArray(data.hidden) ? data.hidden : [],
  };
  await env.PRODUCTS_KV.put(KEY, JSON.stringify(clean));
  return json({ ok: true });
}
