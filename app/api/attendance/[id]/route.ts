import { NextRequest, NextResponse } from 'next/server';
import { deleteEntry, getEntry, updateEntry } from '@/lib/attendance-store';
import { isAttendanceAdmin } from '@/lib/attendance-auth';

export const dynamic = 'force-dynamic';

interface PatchBody {
  clockIn?: number;
  clockOut?: number;
  note?: string;
}

// PATCH /api/attendance/:id
//  - בלי קוד מנהל: סגירת יציאה עצמית לרשומה פתוחה בלבד (clockOut בלבד)
//  - עם קוד מנהל: עריכה חופשית של כל שדה, גם ברשומות סגורות (editedByAdmin=true)
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  const existing = await getEntry(id);
  if (!existing) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const admin = isAttendanceAdmin(req);

  if (!admin) {
    if (existing.clockOut != null) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    if (body.clockIn !== undefined) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    if (typeof body.clockOut !== 'number') {
      return NextResponse.json({ error: 'missing clockOut' }, { status: 400 });
    }
    if (body.clockOut <= existing.clockIn) {
      return NextResponse.json({ error: 'clockOut must be after clockIn' }, { status: 400 });
    }
    const entry = await updateEntry(id, { clockOut: body.clockOut, note: body.note });
    return NextResponse.json({ configured: true, entry });
  }

  const nextClockIn = body.clockIn !== undefined ? body.clockIn : existing.clockIn;
  const nextClockOut = body.clockOut !== undefined ? body.clockOut : existing.clockOut;
  if (nextClockOut != null && nextClockOut <= nextClockIn) {
    return NextResponse.json({ error: 'clockOut must be after clockIn' }, { status: 400 });
  }

  const entry = await updateEntry(id, {
    clockIn: body.clockIn,
    clockOut: body.clockOut,
    note: body.note,
    editedByAdmin: true,
  });
  return NextResponse.json({ configured: true, entry });
}

// DELETE /api/attendance/:id – מנהל בלבד
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  if (!isAttendanceAdmin(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const existing = await getEntry(id);
  if (!existing) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  await deleteEntry(id);
  return NextResponse.json({ configured: true, ok: true });
}
