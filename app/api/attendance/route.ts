import { NextRequest, NextResponse } from 'next/server';
import { NewAdminAttendanceInput, NewAttendanceInput } from '@/types';
import { createEntry, findOpenEntry, listEntries } from '@/lib/attendance-store';
import { isAttendanceAdmin } from '@/lib/attendance-auth';

export const dynamic = 'force-dynamic';

// GET /api/attendance – כל רשומות הנוכחות (גלוי לכל בעלי הקישור)
export async function GET() {
  const entries = await listEntries();
  return NextResponse.json({ configured: true, entries });
}

// POST /api/attendance
//  - בלי קוד מנהל: כניסה רגילה (הזמן נקבע ע"י השרת, לא ניתן לזייף)
//  - עם קוד מנהל: הוספת רשומה ידנית לכל תאריך/שעה (מסומנת editedByAdmin)
export async function POST(req: NextRequest) {
  const admin = isAttendanceAdmin(req);

  if (admin) {
    let body: NewAdminAttendanceInput;
    try {
      body = (await req.json()) as NewAdminAttendanceInput;
    } catch {
      return NextResponse.json({ error: 'invalid body' }, { status: 400 });
    }
    if (!body.clockIn || typeof body.clockIn !== 'number') {
      return NextResponse.json({ error: 'missing clockIn' }, { status: 400 });
    }
    if (body.clockOut != null && body.clockOut <= body.clockIn) {
      return NextResponse.json({ error: 'clockOut must be after clockIn' }, { status: 400 });
    }
    const entry = await createEntry({
      clockIn: body.clockIn,
      clockOut: body.clockOut ?? null,
      note: body.note,
      editedByAdmin: true,
    });
    return NextResponse.json({ configured: true, entry });
  }

  let body: NewAttendanceInput = {};
  try {
    body = (await req.json()) as NewAttendanceInput;
  } catch {
    // גוף ריק תקין — הערה היא אופציונלית
  }

  const open = await findOpenEntry();
  if (open) {
    return NextResponse.json({ error: 'already clocked in' }, { status: 409 });
  }

  const entry = await createEntry({
    clockIn: Date.now(),
    clockOut: null,
    note: body.note,
    editedByAdmin: false,
  });
  return NextResponse.json({ configured: true, entry });
}
