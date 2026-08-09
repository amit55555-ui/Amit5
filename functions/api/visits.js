// Cloudflare Pages Function — site traffic tracking (shared, in KV).
// Reuses the PRODUCTS_KV binding.
//   POST /api/visits  body: { type: 'visit' | 'ping', sid }   (public)
//     'visit' — counted once per browser per day (daily totals).
//     'ping'  — heartbeat that keeps the sender in the live presence map.
//   GET  /api/visits?password=…   (admin only)
//     → { online, today, last7, last30, series:[{date,count}] }

const DAILY = 'mz_visits_daily';   // { 'YYYY-MM-DD': count }
const PRES  = 'mz_presence';       // { sid: lastSeenMs }
const ONLINE_WINDOW = 90_000;      // consider "online" if seen in last 90s
const DEFAULT_PASSWORD = 'amit2389@';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });

const dayStr = (d) => d.toISOString().slice(0, 10);

export async function onRequestPost({ request, env }) {
  if (!env.PRODUCTS_KV) return json({ ok: true });
  let b;
  try { b = await request.json(); } catch { return json({ error: 'bad json' }, 400); }
  const sid = typeof b.sid === 'string' ? b.sid.slice(0, 64) : '';
  const now = Date.now();

  // Update presence (prune stale entries first).
  let pres = {};
  try { const r = await env.PRODUCTS_KV.get(PRES); pres = r ? JSON.parse(r) : {}; } catch { pres = {}; }
  for (const k in pres) { if (now - pres[k] > ONLINE_WINDOW) delete pres[k]; }
  if (sid) pres[sid] = now;
  await env.PRODUCTS_KV.put(PRES, JSON.stringify(pres));

  // Count a daily visit.
  if (b.type === 'visit') {
    let daily = {};
    try { const r = await env.PRODUCTS_KV.get(DAILY); daily = r ? JSON.parse(r) : {}; } catch { daily = {}; }
    const t = dayStr(new Date());
    daily[t] = (daily[t] || 0) + 1;
    const keys = Object.keys(daily).sort();
    while (keys.length > 120) { delete daily[keys.shift()]; } // keep ~4 months
    await env.PRODUCTS_KV.put(DAILY, JSON.stringify(daily));
  }
  return json({ ok: true });
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const pw = url.searchParams.get('password') || request.headers.get('x-admin-password') || '';
  if (pw !== (env.ADMIN_PASSWORD || DEFAULT_PASSWORD)) return json({ error: 'unauthorized' }, 401);
  if (!env.PRODUCTS_KV) return json({ online: 0, today: 0, last7: 0, last30: 0, series: [] });

  const now = Date.now();
  let pres = {}, daily = {};
  try { const r = await env.PRODUCTS_KV.get(PRES); pres = r ? JSON.parse(r) : {}; } catch { /**/ }
  try { const r = await env.PRODUCTS_KV.get(DAILY); daily = r ? JSON.parse(r) : {}; } catch { /**/ }

  let online = 0;
  for (const k in pres) { if (now - pres[k] <= ONLINE_WINDOW) online++; }

  const base = new Date();
  let last7 = 0, last30 = 0;
  const todayCount = daily[dayStr(base)] || 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(base); d.setDate(d.getDate() - i);
    const c = daily[dayStr(d)] || 0;
    if (i < 7) last7 += c;
    last30 += c;
  }
  const series = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(base); d.setDate(d.getDate() - i);
    const k = dayStr(d);
    series.push({ date: k, count: daily[k] || 0 });
  }
  return json({ online, today: todayCount, last7, last30, series });
}
