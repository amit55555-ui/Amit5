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
