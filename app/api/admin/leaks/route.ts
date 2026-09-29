// כל הדיווחים למנהל – כולל תמונות מוסתרות
import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, unauthorized } from '@/lib/admin-auth';
import { listLeaks } from '@/lib/leaks-store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return unauthorized();
  return NextResponse.json({ leaks: await listLeaks() });
}
