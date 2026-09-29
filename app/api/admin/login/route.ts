import { NextRequest, NextResponse } from 'next/server';
import { adminConfigured, checkPassword, isAdmin, setAdminCookie } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

// מצב ההתחברות הנוכחי (לטעינת עמוד הניהול)
export async function GET(req: NextRequest) {
  return NextResponse.json({ configured: adminConfigured(), loggedIn: isAdmin(req) });
}

export async function POST(req: NextRequest) {
  if (!adminConfigured()) {
    return NextResponse.json(
      { error: 'ממשק הניהול לא הוגדר – יש להגדיר LEAKMAP_ADMIN_PASSWORD ב-Vercel' },
      { status: 503 },
    );
  }
  const body = await req.json().catch(() => null);
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!checkPassword(password)) {
    // השהיה קצרה כדי להאט ניחושי סיסמה
    await new Promise((r) => setTimeout(r, 800));
    return NextResponse.json({ error: 'סיסמה שגויה' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  setAdminCookie(res);
  return res;
}
