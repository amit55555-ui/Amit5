// ===== שכבת נתונים בצד הלקוח =====
// מנסה קודם את ה-API (Google Calendar). אם השרת אינו מחובר ליומן –
// נופל בחזרה ל-localStorage כדי שהדמו ימשיך לעבוד.

import { Booking } from '@/types';
import { Slot } from '@/lib/slots';
import {
  addBooking,
  getSlotsForDay,
  loadBookings,
  removeBooking,
} from '@/lib/bookings';
import { BARBER } from '@/data/services';

export async function getAvailability(date: string, durationMin: number): Promise<Slot[]> {
  try {
    const res = await fetch(`/api/availability?date=${date}&duration=${durationMin}`);
    if (res.ok) {
      const data = await res.json();
      if (data.configured) return data.slots as Slot[];
    }
  } catch {
    /* נפילה למצב דמו */
  }
  return getSlotsForDay(date, BARBER.id, durationMin, loadBookings());
}

export async function listBookings(): Promise<Booking[]> {
  try {
    const res = await fetch('/api/bookings');
    if (res.ok) {
      const data = await res.json();
      if (data.configured) return data.bookings as Booking[];
    }
  } catch {
    /* נפילה למצב דמו */
  }
  return loadBookings();
}

export type CreateResult = { ok: true; booking: Booking } | { ok: false; reason: 'taken' | 'error' };

export async function createBooking(booking: Booking): Promise<CreateResult> {
  try {
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking),
    });
    if (res.status === 409) return { ok: false, reason: 'taken' };
    if (res.ok) {
      const data = await res.json();
      if (data.configured) return { ok: true, booking: data.booking as Booking };
    } else {
      return { ok: false, reason: 'error' };
    }
  } catch {
    /* נפילה למצב דמו */
  }
  addBooking(booking);
  return { ok: true, booking };
}

export async function cancelBooking(id: string): Promise<void> {
  try {
    const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
    if (res.ok) {
      const data = await res.json();
      if (data.configured) return;
    }
  } catch {
    /* נפילה למצב דמו */
  }
  removeBooking(id);
}
