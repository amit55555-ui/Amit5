import { NextRequest, NextResponse } from 'next/server';
import { deleteTask, getMember, getTask, TaskChanges, updateTask } from '@/lib/tasks';
import { notifyTaskAssigned } from '@/lib/mailer';
import { isCommittee } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// PATCH /api/tasks/:id – עדכון משימה.
// שינוי האחראי (או resend=true) שולח מייל לאחראי.
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!isCommittee(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  let body: TaskChanges & { resend?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  const existing = await getTask(id);
  if (!existing) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const changes: TaskChanges = {};
  if (body.title !== undefined) {
    if (!body.title.trim()) return NextResponse.json({ error: 'כותרת חסרה' }, { status: 400 });
    changes.title = body.title.trim();
  }
  if (body.description !== undefined) changes.description = body.description.trim();
  if (body.priority !== undefined) changes.priority = body.priority === 'urgent' ? 'urgent' : 'normal';
  if (body.status && ['todo', 'in_progress', 'done'].includes(body.status)) changes.status = body.status;
  if (body.dueDate !== undefined) changes.dueDate = body.dueDate;
  if (body.assigneeId !== undefined) {
    if (body.assigneeId && !(await getMember(body.assigneeId))) {
      return NextResponse.json({ error: 'איש הצוות לא נמצא' }, { status: 400 });
    }
    changes.assigneeId = body.assigneeId || null;
  }

  const task = await updateTask(id, changes);
  if (!task) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const reassigned = changes.assigneeId !== undefined && changes.assigneeId !== existing.assigneeId;
  let emailed = false;
  if (task.assigneeId && (reassigned || body.resend)) {
    const member = await getMember(task.assigneeId);
    if (member) {
      emailed = await notifyTaskAssigned(task, member, {
        appUrl: new URL(req.url).origin,
        reassigned: reassigned && Boolean(existing.assigneeId),
      });
    }
  }

  return NextResponse.json({ task, emailed });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!isCommittee(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  await deleteTask(id);
  return NextResponse.json({ ok: true });
}
