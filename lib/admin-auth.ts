// ===== התחברות מנהל =====
// סיסמת המנהל נקבעת במשתנה הסביבה LEAKMAP_ADMIN_PASSWORD (ב-Vercel).
// אחרי התחברות נשמרת עוגייה חתומה (HMAC של הסיסמה) – שינוי הסיסמה מנתק את כולם.
// אין הרשמה או משתמשים: רק מי שיודע את הסיסמה נכנס לממשק הניהול.

import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export const ADMIN_COOKIE = 'leakmap_admin';
const SESSION_DAYS = 30;

function adminPassword(): string | undefined {
  return process.env.LEAKMAP_ADMIN_PASSWORD || undefined;
}

export function adminConfigured(): boolean {
  return Boolean(adminPassword());
}

function sessionToken(password: string): string {
  return createHmac('sha256', password).update('leakmap-admin-session-v1').digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function checkPassword(input: string): boolean {
  const pw = adminPassword();
  if (!pw) return false;
  // משווים את ה-HMAC ולא את הסיסמה עצמה – אורך קבוע ובלי דליפת תזמון
  return safeEqual(sessionToken(input), sessionToken(pw));
}

export function isAdmin(req: NextRequest): boolean {
  const pw = adminPassword();
  const cookie = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!pw || !cookie) return false;
  return safeEqual(cookie, sessionToken(pw));
}

export function setAdminCookie(res: NextResponse): void {
  res.cookies.set(ADMIN_COOKIE, sessionToken(adminPassword()!), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export function clearAdminCookie(res: NextResponse): void {
  res.cookies.set(ADMIN_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: 'נדרשת התחברות מנהל' }, { status: 401 });
}
