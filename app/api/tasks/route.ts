import { NextRequest, NextResponse } from 'next/server';
import { NewTaskInput } from '@/types';
import { createTask, getMember, listTasks } from '@/lib/tasks';
import { notifyTaskAssigned } from '@/lib/mailer';
import { isCommittee } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/tasks – כל המשימות (דורש קוד ועד)
export async function GET(req: NextRequest) {
  if (!isCommittee(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return NextResponse.json({ tasks: await listTasks() });
}

// POST /api/tasks – משימה חדשה. אם שויכה לאיש צוות – נשלח אליו מייל.
export async function POST(req: NextRequest) {
  if (!isCommittee(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  let input: NewTaskInput;
  try {
    input = (await req.json()) as NewTaskInput;
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }
  if (!input.title?.trim()) {
    return NextResponse.json({ error: 'כותרת חסרה' }, { status: 400 });
  }

  const member = input.assigneeId ? await getMember(input.assigneeId) : undefined;
  if (input.assigneeId && !member) {
    return NextResponse.json({ error: 'איש הצוות לא נמצא' }, { status: 400 });
  }

  const task = await createTask({
    title: input.title.trim(),
    description: (input.description || '').trim(),
    assigneeId: member?.id || null,
    priority: input.priority === 'urgent' ? 'urgent' : 'normal',
    dueDate: input.dueDate || '',
  });

  const emailed = member
    ? await notifyTaskAssigned(task, member, { appUrl: new URL(req.url).origin })
    : false;

  return NextResponse.json({ task, emailed });
}
