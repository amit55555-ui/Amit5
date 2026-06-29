import { NextResponse } from 'next/server';
import { isCalendarConfigured } from '@/lib/google';
import { deleteEvent } from '@/lib/calendar';

export const dynamic = 'force-dynamic';

// DELETE /api/bookings/:id – ביטול תור (מחיקת האירוע + מייל ביטול ללקוח)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!isCalendarConfigured()) {
    return NextResponse.json({ configured: false });
  }

  try {
    await deleteEvent(id);
    return NextResponse.json({ configured: true, ok: true });
  } catch (err) {
    console.error('cancel booking error', err);
    return NextResponse.json({ error: 'calendar error' }, { status: 502 });
  }
}
