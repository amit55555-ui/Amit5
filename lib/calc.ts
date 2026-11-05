// חישובי זמן ושכר — משותף לשרת ולדפדפן. כל התאריכים לפי שעון ישראל.
import type { PublicSettings, Shift } from './types';

export const TZ = 'Asia/Jerusalem';
export const H = 3600000;
export const DAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
export const DAYNAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
export const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const fmt = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23', weekday: 'short',
});

export const pad = (n: number) => String(n).padStart(2, '0');

export function zparts(t: number) {
  const p: Record<string, string> = {};
  for (const x of fmt.formatToParts(new Date(t))) p[x.type] = x.value;
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour % 24, mi: +p.minute, s: +p.second, wd: WD.indexOf(p.weekday) };
}

export const dayKey = (t: number) => { const p = zparts(t); return `${p.y}-${pad(p.m)}-${pad(p.d)}`; };
export const monthKey = (t: number) => { const p = zparts(t); return `${p.y}-${pad(p.m)}`; };
export const clockT = (t: number) => { const p = zparts(t); return `${pad(p.h)}:${pad(p.mi)}`; };

function offset(t: number) {
  const p = zparts(t);
  return Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - Math.floor(t / 1000) * 1000;
}

/** "2026-11-01" + "08:30" בשעון ישראל → חותמת זמן */
export function zonedTime(date: string, time: string): number {
  const [y, m, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, h, mi);
  const o1 = offset(guess);
  let t = guess - o1;
  const o2 = offset(t);
  if (o2 !== o1) t = guess - o2;
  return t;
}

export function monthRange(month: string) {
  const [y, m] = month.split('-').map(Number);
  const next = m === 12 ? `${y + 1}-01` : `${y}-${pad(m + 1)}`;
  return { from: zonedTime(`${month}-01`, '00:00'), to: zonedTime(`${next}-01`, '00:00') };
}

export function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
}

export function monthTitle(month: string) {
  const [y, m] = month.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

export function weekStart(now: number) {
  const p = zparts(now);
  const d = new Date(Date.UTC(p.y, p.m - 1, p.d - p.wd));
  return zonedTime(`${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`, '00:00');
}

export const hm = (ms: number) => { const m = Math.max(0, Math.round(ms / 60000)); return `${Math.floor(m / 60)}:${pad(m % 60)}`; };
export const hms = (ms: number) => { const s = Math.max(0, Math.floor(ms / 1000)); return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`; };
export const money = (v: number) => '₪' + (Math.round(v * 100) / 100).toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const hours = (ms: number) => (ms / H).toFixed(2);
const mins = (ms: number) => Math.max(0, Math.round(ms / 60000));
/** "10 שעות ו-30 דקות" */
export function hmLong(ms: number) {
  const m = mins(ms), h = Math.floor(m / 60), mm = m % 60;
  const hs = h === 0 ? '' : h === 1 ? 'שעה אחת' : `${h} שעות`;
  const ms2 = mm === 0 ? '' : mm === 1 ? 'דקה אחת' : `${mm} דקות`;
  if (hs && ms2) return `${hs} ו-${ms2}`;
  return hs || ms2 || '0 דקות';
}
/** "10 ש׳ 30 ד׳" — לטבלאות */
export function hmShort(ms: number) {
  const m = mins(ms);
  return `${Math.floor(m / 60)} ש׳ ${m % 60} ד׳`;
}

export function breakMs(s: Shift, now: number) {
  let b = (s.breakMin || 0) * 60000;
  for (const x of s.breaks || []) b += (x.e ?? now) - x.s;
  return b;
}
export const workMs = (s: Shift, now: number) => Math.max(0, ((s.end ?? now) - s.start) - breakMs(s, now));
export const onBreak = (s: Shift) => { const b = s.breaks || []; return b.length > 0 && b[b.length - 1].e == null; };

export type DaySum = { key: string; ms: number; reg: number; ot1: number; ot2: number; shifts: Shift[] };
export type Summary = {
  days: DaySum[]; tot: number; reg: number; ot1: number; ot2: number; nDays: number;
  pay: { reg: number; ot1: number; ot2: number; travel: number; total: number };
};

/** סיכום משמרות לפי ימים, עם שעות נוספות לכל יום */
export function summarize(shifts: Shift[], st: PublicSettings, wage: number, travel: number | null, now: number): Summary {
  const map = new Map<string, DaySum>();
  for (const s of shifts) {
    const k = dayKey(s.start);
    let d = map.get(k);
    if (!d) { d = { key: k, ms: 0, reg: 0, ot1: 0, ot2: 0, shifts: [] }; map.set(k, d); }
    d.ms += Math.round(workMs(s, now) / 60000) * 60000; // דקות שלמות — כך התצוגה והשכר תואמים בדיוק
    d.shifts.push(s);
  }
  const std = (st.stdHours || 8.4) * H;
  let tot = 0, reg = 0, ot1 = 0, ot2 = 0;
  for (const d of map.values()) {
    const over = st.otEnabled ? Math.max(0, d.ms - std) : 0;
    d.reg = d.ms - over;
    d.ot1 = Math.min(over, (st.ot1Hours || 0) * H);
    d.ot2 = over - d.ot1;
    tot += d.ms; reg += d.reg; ot1 += d.ot1; ot2 += d.ot2;
    d.shifts.sort((a, b) => a.start - b.start);
  }
  const days = [...map.values()].sort((a, b) => (a.key < b.key ? 1 : -1));
  const nDays = days.length;
  const w = wage || 0;
  const pay = {
    reg: (reg / H) * w,
    ot1: (ot1 / H) * w * (st.ot1Rate || 1),
    ot2: (ot2 / H) * w * (st.ot2Rate || 1),
    travel: nDays * (travel ?? st.travelPerDay ?? 0),
    total: 0,
  };
  pay.total = pay.reg + pay.ot1 + pay.ot2 + pay.travel;
  return { days, tot, reg, ot1, ot2, nDays, pay };
}

export function dayLabel(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return { d, wd: DAYS[wd], name: DAYNAMES[wd] };
}

/* ---------- סידור משמרות: עבודה עם תאריך כמחרוזת YYYY-MM-DD ---------- */
const keyToUTC = (key: string) => { const [y, m, d] = key.split('-').map(Number); return Date.UTC(y, m - 1, d); };
const utcToKey = (t: number) => { const d = new Date(t); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`; };
export const addDays = (key: string, n: number) => utcToKey(keyToUTC(key) + n * 86400000);
export const weekdayOf = (key: string) => new Date(keyToUTC(key)).getUTCDay();
/** יום ראשון של השבוע שבו נמצא התאריך */
export const weekStartKey = (key: string) => addDays(key, -weekdayOf(key));
export const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
export const fromMin = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
export const planMs = (p: { start: string; end: string }) => Math.max(0, toMin(p.end) - toMin(p.start)) * 60000;
export const shortDate = (key: string) => { const [, m, d] = key.split('-').map(Number); return `${d}.${m}`; };

export function weekTitle(startKey: string) {
  const end = addDays(startKey, 6);
  const [y1, m1, d1] = startKey.split('-').map(Number);
  const [y2, m2, d2] = end.split('-').map(Number);
  if (m1 === m2) return `${d1}–${d2} ב${MONTHS[m1 - 1]} ${y1}`;
  if (y1 === y2) return `${d1} ב${MONTHS[m1 - 1]} – ${d2} ב${MONTHS[m2 - 1]} ${y1}`;
  return `${d1}.${m1}.${y1} – ${d2}.${m2}.${y2}`;
}

/** שעות פעילות שלא שובץ בהן אף עובד */
export function coverageGaps(hours: { open: string; close: string } | null, plans: { start: string; end: string }[]) {
  if (!hours) return [];
  const open = toMin(hours.open), close = toMin(hours.close);
  const iv = plans.map((p) => [Math.max(open, toMin(p.start)), Math.min(close, toMin(p.end))] as const)
    .filter(([a, b]) => b > a).sort((a, b) => a[0] - b[0]);
  const gaps: { start: string; end: string }[] = [];
  let cur = open;
  for (const [a, b] of iv) {
    if (a > cur) gaps.push({ start: fromMin(cur), end: fromMin(a) });
    cur = Math.max(cur, b);
  }
  if (cur < close) gaps.push({ start: fromMin(cur), end: fromMin(close) });
  return gaps;
}

/* ---------- הגשת משמרות ---------- */
import type { Slot } from './types';

/** מועד סגירת ההגשה לשבוע (יום ושעה בשבוע שלפניו, שעון ישראל) */
export function deadlineFor(week: string, st: { submitDay: number; submitTime: string }) {
  return zonedTime(addDays(week, -7 + (st.submitDay ?? 4)), st.submitTime || '12:00');
}
/** השבוע הקרוב שעדיין פתוח להגשה */
export function submitWeek(now: number, st: { submitDay: number; submitTime: string }) {
  let w = addDays(weekStartKey(dayKey(now)), 7);
  while (deadlineFor(w, st) <= now) w = addDays(w, 7);
  return w;
}
/** סוגי המשמרות של יום מסוים (רק בימים שהעסק פתוח) */
export function slotsForDay(day: string, st: { slots: Slot[]; businessHours: ({ open: string; close: string } | null)[] }) {
  const wd = weekdayOf(day);
  if (!st.businessHours?.[wd]) return [];
  return (st.slots || []).filter((s) => s.days.includes(wd)).sort((a, b) => toMin(a.start) - toMin(b.start));
}
export const markKey = (day: string, slotId: string) => `${day}|${slotId}`;
export function deadlineText(t: number) {
  const p = zparts(t);
  return `יום ${DAYNAMES[p.wd]} ${p.d}.${p.m} בשעה ${pad(p.h)}:${pad(p.mi)}`;
}
