// בדיקת שיבוץ משמרת (צד שרת)
import 'server-only';
import { toMin, weekdayOf } from './calc';
import { store } from './store';
import { str } from './http';
import type { Settings } from './types';

export async function validatePlan(b: Record<string, unknown>, st: Settings, ignoreId?: string):
  Promise<{ userId: string; day: string; start: string; end: string; note: string } | { error: string }> {
  const userId = str(b.userId, 80), day = str(b.day), start = str(b.start), end = str(b.end);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return { error: 'יש לבחור תאריך' };
  if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) return { error: 'יש להזין שעת התחלה וסיום' };
  if (toMin(end) <= toMin(start)) return { error: 'שעת הסיום חייבת להיות אחרי שעת ההתחלה' };
  const u = userId ? await store().userById(userId) : null;
  if (!u) return { error: 'יש לבחור עובד' };
  if (!u.active) return { error: 'העובד מושבת. הפעילו אותו בלשונית "עובדים" כדי לשבץ.' };
  const hours = st.businessHours?.[weekdayOf(day)];
  if (!hours) return { error: 'העסק סגור ביום הזה (אפשר לשנות בהגדרות ← שעות פעילות)' };
  if (toMin(start) < toMin(hours.open) || toMin(end) > toMin(hours.close)) {
    return { error: `המשמרת חייבת להיות בתוך שעות הפעילות: ${hours.open}–${hours.close}` };
  }
  const same = (await store().plans({ from: day, to: day, userId })).filter((p) => p.id !== ignoreId);
  const clash = same.find((p) => toMin(start) < toMin(p.end) && toMin(p.start) < toMin(end));
  if (clash) return { error: `${u.name} כבר משובץ/ת באותו יום ${clash.start}–${clash.end}` };
  return { userId, day, start, end, note: str(b.note, 120) };
}
