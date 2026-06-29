// ===== לוגיקת חלונות זמן – טהורה, רצה גם בלקוח וגם בשרת =====

import { WEEK_HOURS, SLOT_MINUTES } from '@/types';

export interface Slot {
  time: string;
  available: boolean;
}

// קטע זמן תפוס, בדקות מחצות (start כולל, end לא כולל)
export interface BusyInterval {
  start: number;
  end: number;
}

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// מייצר את כל חלונות הזמן ליום, ומסמן זמינות לפי שעות פעילות + זמנים תפוסים
export function buildSlots(
  iso: string,
  durationMin: number,
  busy: BusyInterval[],
  now: Date = new Date(),
): Slot[] {
  const date = new Date(iso + 'T00:00:00');
  const hours = WEEK_HOURS[date.getDay()];
  if (!hours.open || !hours.close) return [];

  const openMin = timeToMinutes(hours.open);
  const closeMin = timeToMinutes(hours.close);

  const isToday = iso === toISODate(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const slots: Slot[] = [];
  for (let t = openMin; t + durationMin <= closeMin; t += SLOT_MINUTES) {
    const isPast = isToday && t <= nowMin;
    // התור חופף לקטע תפוס אם יש חפיפה כלשהי בין [t, t+duration] ל-[start, end]
    const overlaps = busy.some((b) => t < b.end && t + durationMin > b.start);
    slots.push({ time: minutesToTime(t), available: !isPast && !overlaps });
  }
  return slots;
}
