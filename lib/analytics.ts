// Simple localStorage-based analytics for product engagement.
// Tracks views (card shown), likes (swipe right/up), and clicks (affiliate link opened).

export interface ProductStat {
  views: number;
  likes: number;
  clicks: number;
  shares: number;
}

export type AnalyticsMap = Record<string, ProductStat>;

const LS_ANALYTICS = 'shuk_analytics';

function read(): AnalyticsMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LS_ANALYTICS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function write(map: AnalyticsMap) {
  try {
    localStorage.setItem(LS_ANALYTICS, JSON.stringify(map));
  } catch {
    /* ignore quota errors */
  }
}

function bump(id: string, field: keyof ProductStat) {
  if (!id) return;
  const map = read();
  const cur = map[id] || { views: 0, likes: 0, clicks: 0, shares: 0 };
  cur[field] += 1;
  map[id] = cur;
  write(map);
  queueServer(id, field);
}

/* ─── Shared (cross-device) analytics — batched to the server ─── */
// Events are buffered locally and flushed as a single request to keep KV writes
// low. We flush on a short timer and whenever the page is hidden/closed.
type Field = keyof ProductStat;
let buffer: { id: string; type: Field }[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function queueServer(id: string, type: Field) {
  if (typeof window === 'undefined') return;
  buffer.push({ id, type });
  if (!flushTimer) flushTimer = setTimeout(flushServer, 8000);
  if (buffer.length >= 25) flushServer();
}

function flushServer() {
  if (flushTimer) { clearTimeout(flushTimer); flushTimer = null; }
  if (buffer.length === 0) return;
  const events = buffer;
  buffer = [];
  const payload = JSON.stringify({ events });
  try {
    // sendBeacon survives page unload; fall back to fetch when unavailable.
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics', new Blob([payload], { type: 'application/json' }));
    } else {
      fetch('/api/analytics', { method: 'POST', headers: { 'content-type': 'application/json' }, body: payload, keepalive: true });
    }
  } catch {
    /* best-effort; local analytics already captured it */
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushServer(); });
  window.addEventListener('pagehide', flushServer);
}

// Admin-only: wipe the shared cross-device analytics on the server.
export async function resetServerAnalytics(password: string): Promise<boolean> {
  try {
    const res = await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reset: true, password }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Admin-only: fetch the aggregated cross-device analytics from the server.
export async function fetchServerAnalytics(password: string): Promise<AnalyticsMap | null> {
  try {
    const res = await fetch(`/api/analytics?password=${encodeURIComponent(password)}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data && typeof data === 'object' ? (data as AnalyticsMap) : {};
  } catch {
    return null;
  }
}

export const trackView  = (id: string) => bump(id, 'views');
export const trackLike  = (id: string) => bump(id, 'likes');
export const trackClick = (id: string) => bump(id, 'clicks');
export const trackShare = (id: string) => bump(id, 'shares');

export function getAnalytics(): AnalyticsMap {
  return read();
}

export function getStat(id: string): ProductStat {
  return read()[id] || { views: 0, likes: 0, clicks: 0, shares: 0 };
}

export function resetAnalytics() {
  write({});
}

export interface Totals {
  views: number;
  likes: number;
  clicks: number;
  shares: number;
}

export function totalsFrom(map: AnalyticsMap): Totals {
  return Object.values(map).reduce<Totals>(
    (acc, s) => ({
      views: acc.views + (s.views || 0),
      likes: acc.likes + (s.likes || 0),
      clicks: acc.clicks + (s.clicks || 0),
      shares: acc.shares + (s.shares || 0),
    }),
    { views: 0, likes: 0, clicks: 0, shares: 0 }
  );
}

export function getTotals(): Totals {
  const map = read();
  return Object.values(map).reduce<Totals>(
    (acc, s) => ({
      views: acc.views + s.views,
      likes: acc.likes + s.likes,
      clicks: acc.clicks + s.clicks,
      shares: acc.shares + s.shares,
    }),
    { views: 0, likes: 0, clicks: 0, shares: 0 }
  );
}
