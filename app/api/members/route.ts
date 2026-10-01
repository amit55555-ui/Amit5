import { NextRequest, NextResponse } from 'next/server';
import { createMember, listMembers } from '@/lib/tasks';
import { isCommittee } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GET /api/members – רשימת אנשי הצוות (דורש קוד ועד)
export async function GET(req: NextRequest) {
  if (!isCommittee(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return NextResponse.json({ members: await listMembers() });
}

// POST /api/members – הוספת איש צוות { name, email }
export async function POST(req: NextRequest) {
  if (!isCommittee(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  let body: { name?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }
  const name = (body.name || '').trim();
  const email = (body.email || '').trim();
  if (!name || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'נדרשים שם וכתובת מייל תקינה' }, { status: 400 });
  }
  const member = await createMember(name, email);
  return NextResponse.json({ member });
}
