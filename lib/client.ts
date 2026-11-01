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
