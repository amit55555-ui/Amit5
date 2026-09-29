// סימון דיווח כ"טופל" ע"י מבקר (אנונימי), עם הערה אופציונלית.
// מנהל יכול להחזיר את הדיווח לסטטוס "פתוח" אם הסימון שגוי.
import { NextRequest, NextResponse } from 'next/server';
import { setStatus, toPublic } from '@/lib/leaks-store';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const note = typeof body?.note === 'string' ? body.note.trim().slice(0, 500) : '';

  const leak = await setStatus(id, 'resolved', 'public', note);
  if (!leak) return NextResponse.json({ error: 'הדיווח לא נמצא' }, { status: 404 });
  return NextResponse.json({ leak: toPublic(leak) });
}
