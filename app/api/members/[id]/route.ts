import { NextRequest, NextResponse } from 'next/server';
import { deleteMember, updateMember } from '@/lib/tasks';
import { isCommittee } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// PATCH /api/members/:id – עדכון שם / מייל
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!isCommittee(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  let body: { name?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }
  const changes: { name?: string; email?: string } = {};
  if (body.name !== undefined) {
    if (!body.name.trim()) return NextResponse.json({ error: 'שם חסר' }, { status: 400 });
    changes.name = body.name.trim();
  }
  if (body.email !== undefined) {
    if (!EMAIL_RE.test(body.email.trim())) {
      return NextResponse.json({ error: 'כתובת מייל לא תקינה' }, { status: 400 });
    }
    changes.email = body.email.trim();
  }
  const member = await updateMember(id, changes);
  if (!member) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ member });
}

// DELETE /api/members/:id – המשימות שלו נשארות ללא שיוך
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!isCommittee(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  await deleteMember(id);
  return NextResponse.json({ ok: true });
}
