// סידור משמרות לצפייה: מנהל — כולם; עובד — המשמרות שלו
import { currentUser, isAdmin } from '@/lib/auth';
import { store } from '@/lib/store';
import { fail, ok } from '@/lib/http';
import { addDays } from '@/lib/calc';
import { publicUser } from '@/lib/types';

export const dynamic = 'force-dynamic';
const DAY = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const from = url.searchParams.get('from') || '';
  const to = url.searchParams.get('to') || (DAY.test(from) ? addDays(from, 6) : '');
  if (!DAY.test(from) || !DAY.test(to) || to < from) return fail('טווח תאריכים לא תקין');
  if (addDays(from, 62) < to) return fail('טווח ארוך מדי');
  const st = await store().settings();
  if (await isAdmin(st)) {
    const [plans, users] = await Promise.all([store().plans({ from, to }), store().users()]);
    return ok({ plans, users: users.map(publicUser), businessHours: st.businessHours });
  }
  const u = await currentUser();
  if (!u) return fail('יש להתחבר מחדש', 401);
  return ok({ plans: await store().plans({ from, to, userId: u.id }), businessHours: st.businessHours });
}
