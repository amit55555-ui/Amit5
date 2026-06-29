import { Booking } from '@/types';
import { SERVICES } from '@/data/services';
import { buildSlots, BusyInterval, Slot, timeToMinutes, toISODate } from '@/lib/slots';
import { WEEK_HOURS } from '@/types';

export type { Slot } from '@/lib/slots';
export { toISODate } from '@/lib/slots';

const STORAGE_KEY = 'barber-bookings';

// ===== שמירה וטעינה מ-localStorage (מצב דמו, ללא שרת) =====

export function loadBookings(): Booking[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Booking[]) : [];
  } catch {
    return [];
  }
}

export function saveBookings(bookings: Booking[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

export function addBooking(booking: Booking): Booking[] {
  const all = [...loadBookings(), booking];
  saveBookings(all);
  return all;
}

export function removeBooking(id: string): Booking[] {
  const all = loadBookings().filter((b) => b.id !== id);
  saveBookings(all);
  return all;
}

// ===== עזרי תאריך לתצוגה =====

const HE_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const HE_MONTHS = ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני', 'יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'];

export interface DayOption {
  iso: string;
  dayName: string;
  dayNum: number;
  monthName: string;
  isClosed: boolean;
}

// מחזיר את N הימים הקרובים החל מהיום
export function getUpcomingDays(count = 14): DayOption[] {
  const days: DayOption[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dow = d.getDay();
    days.push({
      iso: toISODate(d),
      dayName: i === 0 ? 'היום' : i === 1 ? 'מחר' : HE_DAYS[dow],
      dayNum: d.getDate(),
      monthName: HE_MONTHS[d.getMonth()],
      isClosed: WEEK_HOURS[dow].open === null,
    });
  }
  return days;
}

// פורמט תאריך קריא: "יום שלישי, 14 ביולי"
export function formatDateHe(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return `יום ${HE_DAYS[d.getDay()]}, ${d.getDate()} ב${HE_MONTHS[d.getMonth()].replace('׳', '')}`;
}

// ===== חישוב חלונות זמן במצב דמו (לפי תורים ב-localStorage) =====

function durationOf(serviceId: string): number {
  return SERVICES.find((s) => s.id === serviceId)?.duration ?? 30;
}

export function getSlotsForDay(
  iso: string,
  _barberId: string,
  serviceDuration: number,
  bookings: Booking[],
): Slot[] {
  // כל תור קיים תופס את הקטע [שעה, שעה + משך השירות שלו]
  const busy: BusyInterval[] = bookings
    .filter((b) => b.date === iso)
    .map((b) => {
      const start = timeToMinutes(b.time);
      return { start, end: start + durationOf(b.serviceId) };
    });
  return buildSlots(iso, serviceDuration, busy);
}
