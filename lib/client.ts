// עזרים לצד הלקוח
'use client';

export async function api<T = Record<string, unknown>>(path: string, method = 'GET', data?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: data ? { 'content-type': 'application/json' } : undefined,
    body: data ? JSON.stringify(data) : undefined,
    cache: 'no-store',
  });
  let json: Record<string, unknown> = {};
  try { json = await res.json(); } catch { /* ריק */ }
  if (!res.ok) {
    const err = new Error((json.error as string) || 'משהו השתבש. נסו שוב.') as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return json as T;
}

export function downloadCsv(name: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const text = '﻿' + rows.map((r) => r.map(esc).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export type GeoResult = { lat: number; lng: number; acc: number } | { error: string };

/** מבקש מיקום מהטלפון (מוצג לעובד חלון אישור בפעם הראשונה) */
export function getLocation(timeoutMs = 12000): Promise<GeoResult> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve({ error: 'הדפדפן הזה לא תומך במיקום. נסו דפדפן אחר (Chrome או Safari).' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }),
      (e) => resolve({
        error: e.code === 1
          ? 'הגישה למיקום חסומה. אפשרו מיקום לאתר הזה בהגדרות הדפדפן ונסו שוב.'
          : e.code === 3
            ? 'איתור המיקום לקח יותר מדי זמן. ודאו שהמיקום (GPS) בטלפון דלוק ונסו שוב.'
            : 'לא הצלחנו לאתר מיקום. ודאו שהמיקום (GPS) בטלפון דלוק ונסו שוב.',
      }),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 30000 },
    );
  });
}
