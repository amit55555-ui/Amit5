// ניהול עובדים: GET רשימה, POST הוספה
import crypto from 'crypto';
import { hashPassword, isAdmin } from '@/lib/auth';
import { store } from '@/lib/store';
import { body, fail, num, ok, str } from '@/lib/http';
import { publicUser } from '@/lib/types';

export const dynamic = 'force-dynamic';

const USERNAME_RE = /^[^\s|]{2,32}$/;

export async function GET() {
  if (!(await isAdmin())) return fail('נדרשת כניסת מנהל', 401);
  return ok({ users: (await store().users()).map(publicUser) });
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return fail('נדרשת כניסת מנהל', 401);
  const b = await body(req);
  const name = str(b.name, 60), username = str(b.username, 32);
  const password = typeof b.password === 'string' ? b.password : '';
  if (!name) return fail('יש להזין שם עובד');
  if (!USERNAME_RE.test(username)) return fail('שם משתמש: 2–32 תווים, בלי רווחים');
  if (password.length < 4) return fail('סיסמה: לפחות 4 תווים');
  if (await store().userByUsername(username)) return fail('שם המשתמש כבר תפוס');
  const travel = b.travel === '' || b.travel == null ? null : Math.max(0, num(b.travel));
  const u = { id: crypto.randomUUID(), username, name, passHash: hashPassword(password), wage: Math.max(0, num(b.wage)), travel, active: true, createdAt: Date.now() };
  await store().saveUser(u);
  return ok({ user: publicUser(u) });
}
