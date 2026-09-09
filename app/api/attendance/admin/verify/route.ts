import { NextRequest, NextResponse } from 'next/server';
import { attendanceAdminPasscode } from '@/lib/attendance-auth';

export const dynamic = 'force-dynamic';

// POST /api/attendance/admin/verify – בדיקת קוד גישת מנהל הנוכחות
export async function POST(req: NextRequest) {
  let body: { passcode?: string };
  try {
    body = (await req.json()) as { passcode?: string };
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }
  const ok = (body.passcode || '') === attendanceAdminPasscode();
  return NextResponse.json({ configured: true, ok });
}
