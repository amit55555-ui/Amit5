import { NextRequest, NextResponse } from 'next/server';
import { isCalendarConfigured } from '@/lib/google';
import { getBusyIntervals } from '@/lib/calendar';
import { buildSlots } from '@/lib/slots';

export const dynamic = 'force-dynamic';

// GET /api/availability?date=YYYY-MM-DD&duration=60
// מחזיר חלונות זמן פנויים לפי שעות הפעילות והיומן של הספר
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date');
  const duration = Number(req.nextUrl.searchParams.get('duration') ?? '30');

  if (!date) {
    return NextResponse.json({ error: 'missing date' }, { status: 400 });
  }

  // לא מוגדר – הלקוח יחשב מקומית (מצב דמו)
  if (!isCalendarConfigured()) {
    return NextResponse.json({ configured: false });
  }

  try {
    const busy = await getBusyIntervals(date);
    const slots = buildSlots(date, duration, busy);
    return NextResponse.json({ configured: true, slots });
  } catch (err) {
    console.error('availability error', err);
    return NextResponse.json({ error: 'calendar error' }, { status: 502 });
  }
}
