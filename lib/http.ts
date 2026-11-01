import 'server-only';
import { NextResponse } from 'next/server';
import { zonedTime } from './calc';

export const ok = (data: unknown = { ok: true }) => NextResponse.json(data);
export const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function body(req: Request): Promise<Record<string, unknown>> {
  try { return (await req.json()) || {}; } catch { return {}; }
}

export const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
export const num = (v: unknown, def = 0) => { const n = Number(v); return Number.isFinite(n) ? n : def; };

/** מיקום מהדפדפן: {lat, lng, acc} */
export function parseLoc(v: unknown) {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  const lat = Number(o.lat), lng = Number(o.lng), acc = Number(o.acc);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6, acc: Number.isFinite(acc) ? Math.round(acc) : 0, t: Date.now() };
}

/** קלט משמרת מטופס: date, in, out (אופציונלי), breakMin, note */
export function parseShiftInput(b: Record<string, unknown>):
  { start: number; end: number | null; breakMin: number; note: string } | { error: string } {
  const date = str(b.date), tin = str(b.in), tout = str(b.out);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(tin)) return { error: 'יש להזין תאריך ושעת כניסה' };
  if (tout && !/^\d{2}:\d{2}$/.test(tout)) return { error: 'שעת יציאה לא תקינה' };
  const start = zonedTime(date, tin);
  let end: number | null = null;
  if (tout) {
    end = zonedTime(date, tout);
    if (end <= start) end += 86400000; // משמרת לילה שעוברת את חצות
  }
  const breakMin = Math.max(0, Math.round(num(b.breakMin)));
  if (end && breakMin * 60000 >= end - start) return { error: 'ההפסקה ארוכה מהמשמרת' };
  if (end && end - start > 24 * 3600000) return { error: 'משמרת לא יכולה להיות ארוכה מ-24 שעות' };
  if (start > Date.now() + 60000) return { error: 'לא ניתן לרשום משמרת בעתיד' };
  return { start, end, breakMin, note: str(b.note, 120) };
}
