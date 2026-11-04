// העתקת סידור של שבוע שלם לשבוע אחר (בלי כפילויות)
import crypto from 'crypto';
import { isAdmin } from '@/lib/auth';
import { store } from '@/lib/store';
import { body, fail, ok, str } from '@/lib/http';
import { addDays, toMin, weekdayOf } from '@/lib/calc';

export const dynamic = 'force-dynamic';
const DAY = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(req: Request) {
  const st = await store().settings();
  if (!(await isAdmin(st))) return fail('נדרשת כניסת מנהל', 401);
  const b = await body(req);
  const from = str(b.from), to = str(b.to);
  if (!DAY.test(from) || !DAY.test(to)) return fail('שבוע לא תקין');
  const [src, existing, users] = await Promise.all([
    store().plans({ from, to: addDays(from, 6) }),
    store().plans({ from: to, to: addDays(to, 6) }),
    store().users(),
  ]);
  const activeIds = new Set(users.filter((u) => u.active).map((u) => u.id));
  const diffDays = Math.round((Date.UTC(+to.slice(0, 4), +to.slice(5, 7) - 1, +to.slice(8)) - Date.UTC(+from.slice(0, 4), +from.slice(5, 7) - 1, +from.slice(8))) / 86400000);
  let added = 0, skipped = 0;
  for (const p of src) {
    const day = addDays(p.day, diffDays);
    const hours = st.businessHours?.[weekdayOf(day)];
    const clash = existing.some((e) => e.userId === p.userId && e.day === day && toMin(p.start) < toMin(e.end) && toMin(e.start) < toMin(p.end));
    if (!activeIds.has(p.userId) || !hours || clash) { skipped++; continue; }
    const n = { id: crypto.randomUUID(), userId: p.userId, day, start: p.start, end: p.end, note: p.note, updatedAt: Date.now() };
    await store().savePlan(n);
    existing.push(n);
    added++;
  }
  return ok({ added, skipped });
}
