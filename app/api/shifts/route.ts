// משמרות: GET ?month=YYYY-MM (עובד — שלו; מנהל — &userId=), POST הוספה ידנית
import crypto from 'crypto';
import { currentUser, isAdmin } from '@/lib/auth';
import { store } from '@/lib/store';
import { body, fail, ok, parseShiftInput, str } from '@/lib/http';
import { monthKey, monthRange } from '@/lib/calc';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const month = url.searchParams.get('month') || monthKey(Date.now());
  if (!/^\d{4}-\d{2}$/.test(month)) return fail('חודש לא תקין');
  const admin = await isAdmin();
  let userId = url.searchParams.get('userId') || '';
  if (!admin) {
    const u = await currentUser();
    if (!u) return fail('יש להתחבר מחדש', 401);
    userId = u.id;
  }
  if (!userId) return fail('חסר עובד');
  const { from, to } = monthRange(month);
  return ok({ shifts: await store().shifts({ userId, from, to }) });
}

export async function POST(req: Request) {
  const b = await body(req);
  const st = await store().settings();
  const admin = await isAdmin(st);
  let userId = str(b.userId, 80);
  if (!admin) {
    const u = await currentUser();
    if (!u) return fail('יש להתחבר מחדש', 401);
    if (!st.allowEmployeeEdit) return fail('המנהל לא אישר הוספה ידנית של משמרות', 403);
    userId = u.id;
  }
  if (!userId || !(await store().userById(userId))) return fail('עובד לא נמצא', 404);
  const p = parseShiftInput(b);
  if ('error' in p) return fail(p.error);
  if (p.end == null && (await store().activeShifts(userId)).length) return fail('כבר יש משמרת פעילה. הזינו שעת יציאה.');
  const s = { id: crypto.randomUUID(), userId, start: p.start, end: p.end, breaks: [], breakMin: p.breakMin, note: p.note,
    editedBy: admin ? ('admin' as const) : ('user' as const), updatedAt: Date.now() };
  await store().saveShift(s);
  return ok({ shift: s });
}
