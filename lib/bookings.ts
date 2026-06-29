import { Booking, WEEK_HOURS, SLOT_MINUTES } from '@/types';

const STORAGE_KEY = 'barber-bookings';

// ===== שמירה וטעינה מ-localStorage (דמו ללא שרת) =====

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

// ===== עזרי תאריך ושעה =====

const HE_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const HE_MONTHS = ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני', 'יולי', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'];

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

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

// פורמט תאריך קריא לתצוגה: "יום שלישי, 14 ביולי"
export function formatDateHe(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return `יום ${HE_DAYS[d.getDay()]}, ${d.getDate()} ב${HE_MONTHS[d.getMonth()].replace('׳', '')}`;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

export interface Slot {
  time: string;
  available: boolean;
}

// מייצר את כל חלונות הזמן ליום מסוים, ומסמן אילו תפוסים
export function getSlotsForDay(
  iso: string,
  barberId: string,
  serviceDuration: number,
  bookings: Booking[],
): Slot[] {
  const date = new Date(iso + 'T00:00:00');
  const hours = WEEK_HOURS[date.getDay()];
  if (!hours.open || !hours.close) return [];

  const openMin = timeToMinutes(hours.open);
  const closeMin = timeToMinutes(hours.close);

  // התורים התפוסים של אותו ספר באותו יום
  const taken = bookings
    .filter((b) => b.date === iso && b.barberId === barberId)
    .map((b) => timeToMinutes(b.time));

  const now = new Date();
  const isToday = iso === toISODate(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const slots: Slot[] = [];
  for (let t = openMin; t + serviceDuration <= closeMin; t += SLOT_MINUTES) {
    const isPast = isToday && t <= nowMin;
    const isTaken = taken.includes(t);
    slots.push({ time: minutesToTime(t), available: !isPast && !isTaken });
  }
  return slots;
}
