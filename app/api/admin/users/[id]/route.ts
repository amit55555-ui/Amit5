// עריכת עובד (כולל איפוס סיסמה והשבתה) ומחיקה
import { hashPassword, isAdmin } from '@/lib/auth';
import { store } from '@/lib/store';
import { body, fail, num, ok, str } from '@/lib/http';
import { publicUser } from '@/lib/types';

export const dynamic = 'force-dynamic';
type Ctx = { params: Promise<{ id: string }> };
const USERNAME_RE = /^[^\s|]{2,32}$/;

export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await isAdmin())) return fail('נדרשת כניסת מנהל', 401);
  const { id } = await params;
  const u = await store().userById(id);
  if (!u) return fail('העובד לא נמצא', 404);
  const b = await body(req);
  const next = { ...u };
  if (b.name !== undefined) { next.name = str(b.name, 60); if (!next.name) return fail('יש להזין שם עובד'); }
  if (b.username !== undefined) {
    const un = str(b.username, 32);
    if (!USERNAME_RE.test(un)) return fail('שם משתמש: 2–32 תווים, בלי רווחים');
    const other = await store().userByUsername(un);
    if (other && other.id !== id) return fail('שם המשתמש כבר תפוס');
    next.username = un;
  }
  if (b.wage !== undefined) next.wage = Math.max(0, num(b.wage));
  if (b.travel !== undefined) next.travel = b.travel === '' || b.travel == null ? null : Math.max(0, num(b.travel));
  if (b.active !== undefined) next.active = Boolean(b.active);
  if (typeof b.password === 'string' && b.password) {
    if (b.password.length < 4) return fail('סיסמה: לפחות 4 תווים');
    next.passHash = hashPassword(b.password);
  }
  await store().saveUser(next);
  return ok({ user: publicUser(next) });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await isAdmin())) return fail('נדרשת כניסת מנהל', 401);
  const { id } = await params;
  await store().deleteUser(id);
  return ok();
}
