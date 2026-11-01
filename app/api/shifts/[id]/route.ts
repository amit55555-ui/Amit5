// תיקון ומחיקה של משמרת
import { currentUser, isAdmin } from '@/lib/auth';
import { store } from '@/lib/store';
import { body, fail, ok, parseShiftInput } from '@/lib/http';
import { breakMs } from '@/lib/calc';
import type { Shift } from '@/lib/types';

export const dynamic = 'force-dynamic';
type Ctx = { params: Promise<{ id: string }> };

async function allowed(shift: Shift | null) {
  const st = await store().settings();
  if (await isAdmin(st)) return { admin: true };
  const u = await currentUser();
  if (!u) return { error: fail('יש להתחבר מחדש', 401) };
  if (!shift || shift.userId !== u.id) return { error: fail('המשמרת לא נמצאה', 404) };
  if (!st.allowEmployeeEdit) return { error: fail('המנהל לא אישר תיקון משמרות. פנו אליו לתיקון.', 403) };
  return { admin: false };
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  const cur = await store().shiftById(id);
  const a = await allowed(cur);
  if ('error' in a) return a.error;
  if (!cur) return fail('המשמרת לא נמצאה', 404);
  const p = parseShiftInput(await body(req));
  if ('error' in p) return fail(p.error);
  if (p.end == null && cur.end != null && (await store().activeShifts(cur.userId)).length) return fail('כבר יש משמרת פעילה. הזינו שעת יציאה.');
  // אם המשמרת עדיין פעילה ולא שונו ההפסקות — שומרים את ההפסקות מהשעון
  const now = Date.now();
  const keepBreaks = p.end == null && p.breakMin === Math.round(breakMs(cur, now) / 60000);
  const s: Shift = {
    ...cur, start: p.start, end: p.end, note: p.note,
    breaks: keepBreaks ? cur.breaks : [], breakMin: keepBreaks ? cur.breakMin : p.breakMin,
    editedBy: a.admin ? 'admin' : 'user', updatedAt: now,
  };
  await store().saveShift(s);
  return ok({ shift: s });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const cur = await store().shiftById(id);
  const a = await allowed(cur);
  if ('error' in a) return a.error;
  if (!cur) return fail('המשמרת לא נמצאה', 404);
  await store().deleteShift(id);
  return ok();
}
