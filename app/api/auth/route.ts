// התחברות עובד: GET = מי מחובר, POST = כניסה, DELETE = יציאה
import { currentUser, loginUser, logoutUser, verifyPassword } from '@/lib/auth';
import { store } from '@/lib/store';
import { body, fail, ok, str } from '@/lib/http';
import { publicSettings, publicUser } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const st = await store().settings();
  const u = await currentUser();
  if (!u) return ok({ user: null, companyName: st.companyName });
  const since = Date.now() - 40 * 86400000;
  const [active, recent] = await Promise.all([store().activeShifts(u.id), store().shifts({ userId: u.id, from: since })]);
  return ok({ user: publicUser(u), settings: publicSettings(st), active: active[0] || null, recent });
}

export async function POST(req: Request) {
  const b = await body(req);
  const username = str(b.username, 40), password = typeof b.password === 'string' ? b.password : '';
  if (!username || !password) return fail('יש להזין שם משתמש וסיסמה');
  const u = await store().userByUsername(username);
  if (!u || !verifyPassword(password, u.passHash)) {
    await new Promise((r) => setTimeout(r, 500));
    return fail('שם משתמש או סיסמה שגויים', 401);
  }
  if (!u.active) return fail('המשתמש מושבת. פנו למנהל.', 403);
  await loginUser(u);
  return ok();
}

export async function DELETE() {
  await logoutUser();
  return ok();
}
