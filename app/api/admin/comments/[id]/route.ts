// מחיקת הערה לא ראויה (מנהל בלבד)
import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, unauthorized } from '@/lib/admin-auth';
import { deleteComment } from '@/lib/leaks-store';

export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return unauthorized();
  const { id } = await params;
  const ok = await deleteComment(id);
  if (!ok) return NextResponse.json({ error: 'ההערה לא נמצאה' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
