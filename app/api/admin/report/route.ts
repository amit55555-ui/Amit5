// דוח מנהלים: כל העובדים וכל המשמרות של החודש + מי במשמרת עכשיו
import { isAdmin } from '@/lib/auth';
import { store } from '@/lib/store';
import { fail, ok } from '@/lib/http';
import { monthKey, monthRange } from '@/lib/calc';
import { publicSettings, publicUser } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const st = await store().settings();
  if (!(await isAdmin(st))) return fail('נדרשת כניסת מנהל', 401);
  const month = new URL(req.url).searchParams.get('month') || monthKey(Date.now());
  if (!/^\d{4}-\d{2}$/.test(month)) return fail('חודש לא תקין');
  const { from, to } = monthRange(month);
  const [users, shifts, active] = await Promise.all([store().users(), store().shifts({ from, to }), store().activeShifts()]);
  return ok({ month, settings: publicSettings(st), users: users.map(publicUser), shifts, active });
}
