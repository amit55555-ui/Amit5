import { NextRequest, NextResponse } from 'next/server';
import { Booking } from '@/types';
import { isCalendarConfigured } from '@/lib/google';
import { createEvent, isSlotFree, listUpcoming } from '@/lib/calendar';

export const dynamic = 'force-dynamic';

// GET /api/bookings – רשימת תורים עתידיים (לפאנל הניהול)
export async function GET() {
  if (!isCalendarConfigured()) {
    return NextResponse.json({ configured: false });
  }
  try {
    const bookings = await listUpcoming();
    return NextResponse.json({ configured: true, bookings });
  } catch (err) {
    console.error('list bookings error', err);
    return NextResponse.json({ error: 'calendar error' }, { status: 502 });
  }
}

// POST /api/bookings – קביעת תור חדש (יצירת אירוע ביומן)
export async function POST(req: NextRequest) {
  if (!isCalendarConfigured()) {
    return NextResponse.json({ configured: false });
  }

  let booking: Booking;
  try {
    booking = (await req.json()) as Booking;
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  if (!booking.serviceId || !booking.date || !booking.time || !booking.customerName) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 });
  }

  try {
    // הגנה מפני שני לקוחות שתפסו אותו חלון
    if (!(await isSlotFree(booking))) {
      return NextResponse.json({ error: 'slot-taken' }, { status: 409 });
    }
    const eventId = await createEvent(booking);
    return NextResponse.json({ configured: true, booking: { ...booking, id: eventId } });
  } catch (err) {
    console.error('create booking error', err);
    return NextResponse.json({ error: 'calendar error' }, { status: 502 });
  }
}
