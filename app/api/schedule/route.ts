// סידור משמרות לצפייה.
// מנהל: הכול, כולל טיוטות. עובד: רק שבועות שפורסמו — הסידור של כל הצוות.
import { currentUser, isAdmin } from '@/lib/auth';
import { store } from '@/lib/store';
import { fail, ok } from '@/lib/http';
import { addDays, weekStartKey } from '@/lib/calc';
import { publicUser } from '@/lib/types';

export const dynamic = 'force-dynamic';
const DAY = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const from = url.searchParams.get('from') || '';
  const to = url.searchParams.get('to') || (DAY.test(from) ? addDays(from, 6) : '');
  if (!DAY.test(from) || !DAY.test(to) || to < from) return fail('טווח תאריכים לא תקין');
  if (addDays(from, 62) < to) return fail('טווח ארוך מדי');
  const weeks: string[] = [];
  for (let w = weekStartKey(from); w <= to; w = addDays(w, 7)) weeks.push(w);
  const st = await store().settings();
  const [plans, users, published] = await Promise.all([store().plans({ from, to }), store().users(), store().published(weeks)]);
  if (await isAdmin(st)) {
    return ok({ plans, users: users.map(publicUser), businessHours: st.businessHours, slots: st.slots, published });
  }
  const u = await currentUser();
  if (!u) return fail('יש להתחבר מחדש', 401);
  const visible = plans.filter((p) => published[weekStartKey(p.day)]);
  // לעובדים: רק שמות, בלי שכר או פרטים אחרים
  const names: Record<string, string> = {};
  for (const x of users) if (visible.some((p) => p.userId === x.id)) names[x.id] = x.name;
  return ok({ plans: visible, names, me: u.id, businessHours: st.businessHours, slots: st.slots, published });
}
