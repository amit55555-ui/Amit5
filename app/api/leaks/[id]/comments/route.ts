// הוספת הערה אנונימית לדיווח (לכל מבקר)
import { NextRequest, NextResponse } from 'next/server';
import { addComment, toPublic } from '@/lib/leaks-store';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const text = typeof body?.text === 'string' ? body.text.trim().slice(0, 500) : '';
  if (!text) {
    return NextResponse.json({ error: 'יש לכתוב הערה' }, { status: 400 });
  }

  const leak = await addComment(id, text, 'public');
  if (!leak) return NextResponse.json({ error: 'הדיווח לא נמצא' }, { status: 404 });
  return NextResponse.json({ leak: toPublic(leak) });
}
