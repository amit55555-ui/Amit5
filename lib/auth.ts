// סיסמאות (scrypt) ועוגיות התחברות חתומות (HMAC) — צד שרת בלבד.
import 'server-only';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { store } from './store';
import type { Settings, User } from './types';

const USER_COOKIE = 'att_user';
const ADMIN_COOKIE = 'att_admin';
const USER_DAYS = 60;
const ADMIN_HOURS = 12;

// מפתח החתימה: SESSION_SECRET אם הוגדר; אחרת נגזר מכתובת מסד הנתונים (שהיא סודית ממילא),
// כך שבפריסה עם Neon אין צורך להגדיר משתנה נוסף.
let cachedSecret: string | null = null;
function secret() {
  if (cachedSecret) return cachedSecret;
  const db = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  cachedSecret = process.env.SESSION_SECRET
    || (db ? crypto.createHash('sha256').update('attendance-session|' + db).digest('hex') : 'dev-only-secret-change-me');
  return cachedSecret;
}

export function hashPassword(pw: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(pw, salt, 32).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(pw: string, stored: string) {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const a = Buffer.from(hash, 'hex');
  const b = crypto.scryptSync(pw, salt, 32);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const sign = (v: string) => crypto.createHmac('sha256', secret()).update(v).digest('base64url');

function makeToken(subject: string, version: string, ms: number) {
  const body = `${subject}|${Date.now() + ms}|${version}`;
  return `${Buffer.from(body).toString('base64url')}.${sign(body)}`;
}

function readToken(tok: string | undefined) {
  if (!tok) return null;
  const [b64, sig] = tok.split('.');
  if (!b64 || !sig) return null;
  const body = Buffer.from(b64, 'base64url').toString();
  const good = sign(body);
  if (good.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(good), Buffer.from(sig))) return null;
  const [subject, exp, version] = body.split('|');
  if (Number(exp) < Date.now()) return null;
  return { subject, version };
}

// גרסה = קטע מה-hash: החלפת סיסמה מנתקת אוטומטית את כל החיבורים הקודמים
const ver = (hash: string) => hash.slice(-10);

const cookieOpts = (maxAge: number) => ({
  httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/', maxAge,
});

/* ---------- עובדים ---------- */
export async function loginUser(u: User) {
  (await cookies()).set(USER_COOKIE, makeToken(u.id, ver(u.passHash), USER_DAYS * 86400000), cookieOpts(USER_DAYS * 86400));
}
export async function logoutUser() {
  (await cookies()).delete(USER_COOKIE);
}
export async function currentUser(): Promise<User | null> {
  const t = readToken((await cookies()).get(USER_COOKIE)?.value);
  if (!t) return null;
  const u = await store().userById(t.subject);
  if (!u || !u.active || ver(u.passHash) !== t.version) return null;
  return u;
}

/* ---------- מנהל ---------- */
const DEMO_ADMIN = '1234';
const H1 = 3600000;

export function adminPasswordOk(pw: string, s: Settings) {
  if (s.adminPassHash) return verifyPassword(pw, s.adminPassHash);
  const env = process.env.ADMIN_PASSWORD || DEMO_ADMIN;
  const a = Buffer.from(pw), b = Buffer.from(env);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
export function adminUsesDefault(s: Settings) {
  return !s.adminPassHash && !process.env.ADMIN_PASSWORD;
}
const adminVer = (s: Settings) => (s.adminPassHash ? ver(s.adminPassHash) : 'env');

export async function loginAdmin(s: Settings) {
  (await cookies()).set(ADMIN_COOKIE, makeToken('admin', adminVer(s), ADMIN_HOURS * H1), cookieOpts(ADMIN_HOURS * 3600));
}
export async function logoutAdmin() {
  (await cookies()).delete(ADMIN_COOKIE);
}
export async function isAdmin(s?: Settings): Promise<boolean> {
  const t = readToken((await cookies()).get(ADMIN_COOKIE)?.value);
  if (!t || t.subject !== 'admin') return false;
  const st = s || (await store().settings());
  return t.version === adminVer(st);
}
