import { NextRequest, NextResponse } from 'next/server';
import { listLeaks, createLeak } from '@/lib/leaks-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const leaks = await listLeaks();
  return NextResponse.json({ leaks });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  const lat = Number(body?.lat);
  const lng = Number(body?.lng);
  const description = typeof body?.description === 'string' ? body.description.trim().slice(0, 500) : '';
  const photo = typeof body?.photo === 'string' ? body.photo : '';

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'מיקום לא תקין' }, { status: 400 });
  }
  if (!photo.startsWith('data:image/')) {
    return NextResponse.json({ error: 'יש לצרף תמונה' }, { status: 400 });
  }
  // הגבלת גודל גס (עד ~8MB בקידוד base64) כדי למנוע בקשות ענקיות
  if (photo.length > 11_000_000) {
    return NextResponse.json({ error: 'התמונה גדולה מדי' }, { status: 400 });
  }

  const leak = await createLeak({ lat, lng, description, photo });
  return NextResponse.json({ leak }, { status: 201 });
}
