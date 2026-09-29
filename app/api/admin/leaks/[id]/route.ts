// פעולות מנהל על דיווח: שינוי סטטוס, הסתרת/החזרת תמונה, הערת מנהל, מחיקה
import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, unauthorized } from '@/lib/admin-auth';
import { addComment, deleteLeak, getLeak, setPhotoHidden, setStatus } from '@/lib/leaks-store';
import { isLeakStatus } from '@/types';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!isAdmin(req)) return unauthorized();
  const { id } = await params;
  const body = await req.json().catch(() => null);

  if (!(await getLeak(id))) {
    return NextResponse.json({ error: 'הדיווח לא נמצא' }, { status: 404 });
  }
  if (body?.status !== undefined) {
    if (!isLeakStatus(body.status)) {
      return NextResponse.json({ error: 'סטטוס לא תקין' }, { status: 400 });
    }
    await setStatus(id, body.status, 'admin');
  }
  if (typeof body?.photoHidden === 'boolean') {
    await setPhotoHidden(id, body.photoHidden);
  }
  const comment = typeof body?.comment === 'string' ? body.comment.trim().slice(0, 500) : '';
  if (comment) {
    await addComment(id, comment, 'admin');
  }
  return NextResponse.json({ leak: await getLeak(id) });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  if (!isAdmin(req)) return unauthorized();
  const { id } = await params;
  const ok = await deleteLeak(id);
  if (!ok) return NextResponse.json({ error: 'הדיווח לא נמצא' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
