// פרסום / ביטול פרסום של סידור שבועי
import { isAdmin } from '@/lib/auth';
import { store } from '@/lib/store';
import { body, fail, ok, str } from '@/lib/http';
import { weekStartKey } from '@/lib/calc';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!(await isAdmin())) return fail('נדרשת כניסת מנהל', 401);
  const b = await body(req);
  const week = str(b.week);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(week) || weekStartKey(week) !== week) return fail('שבוע לא תקין');
  const at = b.publish ? Date.now() : null;
  await store().setPublished(week, at);
  return ok({ week, publishedAt: at });
}
