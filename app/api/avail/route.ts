// הגשת משמרות: GET = ההגשה לשבוע (עובד: שלו; מנהל: של כולם), PUT = עובד שולח הגשה
import { currentUser, isAdmin } from '@/lib/auth';
import { store } from '@/lib/store';
import { body, fail, ok, str } from '@/lib/http';
import { addDays, dayKey, deadlineFor, markKey, slotsForDay, submitWeek, weekStartKey } from '@/lib/calc';
import { publicSettings, publicUser, type Mark } from '@/lib/types';

export const dynamic = 'force-dynamic';
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const MARKS: Mark[] = ['can', 'pref', 'cant'];

export async function GET(req: Request) {
  const st = await store().settings();
  const q = new URL(req.url).searchParams.get('week') || '';
  const week = DAY.test(q) ? weekStartKey(q) : submitWeek(Date.now(), st);
  const deadline = deadlineFor(week, st);
  const open = Date.now() < deadline;
  const base = { week, deadline, open, settings: publicSettings(st) };
  if (await isAdmin(st)) {
    const [avail, users] = await Promise.all([store().avail({ week }), store().users()]);
    return ok({ ...base, avail, users: users.map(publicUser) });
  }
  const u = await currentUser();
  if (!u) return fail('יש להתחבר מחדש', 401);
  const [mine] = await store().avail({ week, userId: u.id });
  return ok({ ...base, mine: mine || null });
}

export async function PUT(req: Request) {
  const u = await currentUser();
  if (!u) return fail('יש להתחבר מחדש', 401);
  const st = await store().settings();
  const b = await body(req);
  const week = str(b.week);
  if (!DAY.test(week) || weekStartKey(week) !== week) return fail('שבוע לא תקין');
  if (week <= weekStartKey(dayKey(Date.now()))) return fail('אפשר להגיש רק לשבועות הבאים');
  if (Date.now() >= deadlineFor(week, st)) return fail('ההגשה לשבוע הזה כבר נסגרה. לשינויים פנו למנהל.');
  // רק משבצות שקיימות באותו שבוע
  const valid = new Set<string>();
  for (let i = 0; i < 7; i++) { const d = addDays(week, i); for (const s of slotsForDay(d, st)) valid.add(markKey(d, s.id)); }
  const marks: Record<string, Mark> = {};
  const raw = (b.marks && typeof b.marks === 'object' ? b.marks : {}) as Record<string, unknown>;
  for (const [k, v] of Object.entries(raw)) if (valid.has(k) && MARKS.includes(v as Mark)) marks[k] = v as Mark;
  const a = { userId: u.id, week, marks, note: str(b.note, 300), submittedAt: Date.now() };
  await store().saveAvail(a);
  return ok({ mine: a });
}
