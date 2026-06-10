import { NextRequest, NextResponse } from 'next/server';

// In-memory rate limit — replace with Redis/Upstash for multi-instance production
const counts = new Map<string, { n: number; resetAt: number }>();
const LIMIT   = 5;
const WINDOW  = 60_000; // 1 minute

export function middleware(req: NextRequest) {
  if (!req.nextUrl.pathname.startsWith('/api/report')) {
    return NextResponse.next();
  }

  const ip  = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const now = Date.now();
  const entry = counts.get(ip);

  if (!entry || entry.resetAt < now) {
    counts.set(ip, { n: 1, resetAt: now + WINDOW });
    return NextResponse.next();
  }

  if (entry.n >= LIMIT) {
    return NextResponse.json(
      { error: 'יותר מדי דיווחים. אנא המתן דקה ונסה שוב.' },
      { status: 429 }
    );
  }

  entry.n++;
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
