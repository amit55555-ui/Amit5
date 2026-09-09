// ===== שכבת נתונים בצד הלקוח למערכת הנוכחות =====
// כל הקריאות הולכות לשרת (Postgres); אין מצב דמו נפרד — גם בלי מסד
// נתונים מוגדר, השרת נופל אוטומטית לזיכרון (ראו lib/attendance-store.ts).

'use client';

import { AttendanceEntry } from '@/types';

export async function fetchEntries(): Promise<AttendanceEntry[]> {
  const res = await fetch('/api/attendance', { cache: 'no-store' });
  if (!res.ok) throw new Error('fetch failed');
  const data = await res.json();
  return data.entries as AttendanceEntry[];
}

export async function clockIn(note: string): Promise<AttendanceEntry> {
  const res = await fetch('/api/attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'clock-in failed');
  }
  const data = await res.json();
  return data.entry as AttendanceEntry;
}

export async function closeOwnEntry(
  id: string,
  clockOut: number,
  note?: string,
): Promise<AttendanceEntry> {
  const res = await fetch(`/api/attendance/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clockOut, note }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'clock-out failed');
  }
  const data = await res.json();
  return data.entry as AttendanceEntry;
}

export async function verifyAdminPasscode(passcode: string): Promise<boolean> {
  const res = await fetch('/api/attendance/admin/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passcode }),
  });
  if (!res.ok) return false;
  const data = await res.json();
  return Boolean(data.ok);
}

export async function adminCreateEntry(
  passcode: string,
  input: { clockIn: number; clockOut: number | null; note?: string },
): Promise<AttendanceEntry> {
  const res = await fetch('/api/attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-attendance-admin-passcode': passcode },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'create failed');
  }
  const data = await res.json();
  return data.entry as AttendanceEntry;
}

export async function adminUpdateEntry(
  passcode: string,
  id: string,
  changes: { clockIn?: number; clockOut?: number | null; note?: string },
): Promise<AttendanceEntry> {
  const res = await fetch(`/api/attendance/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'x-attendance-admin-passcode': passcode },
    body: JSON.stringify(changes),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'update failed');
  }
  const data = await res.json();
  return data.entry as AttendanceEntry;
}

export async function adminDeleteEntry(passcode: string, id: string): Promise<void> {
  const res = await fetch(`/api/attendance/${id}`, {
    method: 'DELETE',
    headers: { 'x-attendance-admin-passcode': passcode },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'delete failed');
  }
}
