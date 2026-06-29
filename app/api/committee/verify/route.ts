import { NextRequest, NextResponse } from 'next/server';
import { committeePasscode } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/committee/verify – בדיקת קוד גישת הוועד
export async function POST(req: NextRequest) {
  let body: { passcode?: string };
  try {
    body = (await req.json()) as { passcode?: string };
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }
  const ok = (body.passcode || '') === committeePasscode();
  return NextResponse.json({ configured: true, ok });
}
