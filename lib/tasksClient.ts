// ===== קריאות API למשימות ואנשי צוות (צד לקוח) =====
// כל הפעולות דורשות את קוד הוועד.

'use client';

import { Member, NewTaskInput, Task, TaskStatus, Priority } from '@/types';

async function call<T>(passcode: string, url: string, method = 'GET', body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', 'x-committee-passcode': passcode },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'שגיאה בשרת');
  return data as T;
}

export const fetchMembers = (passcode: string) =>
  call<{ members: Member[] }>(passcode, '/api/members').then((d) => d.members);

export const addMember = (passcode: string, name: string, email: string) =>
  call<{ member: Member }>(passcode, '/api/members', 'POST', { name, email }).then((d) => d.member);

export const editMember = (passcode: string, id: string, changes: { name?: string; email?: string }) =>
  call<{ member: Member }>(passcode, `/api/members/${id}`, 'PATCH', changes).then((d) => d.member);

export const removeMember = (passcode: string, id: string) =>
  call<{ ok: boolean }>(passcode, `/api/members/${id}`, 'DELETE');

export const fetchTasks = (passcode: string) =>
  call<{ tasks: Task[] }>(passcode, '/api/tasks').then((d) => d.tasks);

export const addTask = (passcode: string, input: NewTaskInput) =>
  call<{ task: Task; emailed: boolean }>(passcode, '/api/tasks', 'POST', input);

export const editTask = (
  passcode: string,
  id: string,
  changes: {
    title?: string;
    description?: string;
    assigneeId?: string | null;
    priority?: Priority;
    status?: TaskStatus;
    dueDate?: string;
    resend?: boolean;
  },
) => call<{ task: Task; emailed: boolean }>(passcode, `/api/tasks/${id}`, 'PATCH', changes);

export const removeTask = (passcode: string, id: string) =>
  call<{ ok: boolean }>(passcode, `/api/tasks/${id}`, 'DELETE');
