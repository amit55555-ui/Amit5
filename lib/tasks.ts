// ===== מחסן המשימות ואנשי הצוות בצד השרת =====
// כמו lib/store: Postgres כשמוגדר DATABASE_URL, אחרת זיכרון בלבד (פיתוח מקומי).

import { Member, NewTaskInput, Priority, Task, TaskStatus } from '@/types';
import { hasDatabase, ensureSchema, sql } from '@/lib/db';

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// נשמר על globalThis כדי שכל נתיבי ה-API יחלקו את אותו מחסן בזיכרון
type Mem = { members: Member[]; tasks: Task[]; lastRef: number };
const g = globalThis as unknown as { __tasksMem?: Mem };
const mem: Mem = (g.__tasksMem ??= { members: [], tasks: [], lastRef: 0 });

type Row = Record<string, unknown>;

function rowToMember(r: Row): Member {
  return {
    id: String(r.id),
    name: String(r.name),
    email: String(r.email),
    createdAt: Number(r.created_at),
  };
}

function rowToTask(r: Row): Task {
  return {
    id: String(r.id),
    ref: Number(r.ref),
    title: String(r.title),
    description: String(r.description ?? ''),
    assigneeId: r.assignee_id == null ? null : String(r.assignee_id),
    priority: r.priority as Priority,
    status: r.status as TaskStatus,
    dueDate: String(r.due_date ?? ''),
    createdAt: Number(r.created_at),
    updatedAt: Number(r.updated_at),
  };
}

// ---------- אנשי צוות ----------

export async function listMembers(): Promise<Member[]> {
  if (!hasDatabase()) return [...mem.members].sort((a, b) => a.name.localeCompare(b.name, 'he'));
  await ensureSchema();
  const rows = (await sql()`SELECT * FROM members ORDER BY name`) as Row[];
  return rows.map(rowToMember);
}

export async function getMember(id: string): Promise<Member | undefined> {
  if (!hasDatabase()) return mem.members.find((m) => m.id === id);
  await ensureSchema();
  const rows = (await sql()`SELECT * FROM members WHERE id = ${id} LIMIT 1`) as Row[];
  return rows[0] ? rowToMember(rows[0]) : undefined;
}

export async function createMember(name: string, email: string): Promise<Member> {
  const member: Member = { id: uid(), name, email, createdAt: Date.now() };
  if (!hasDatabase()) {
    mem.members.push(member);
    return member;
  }
  await ensureSchema();
  await sql()`
    INSERT INTO members (id, name, email, created_at)
    VALUES (${member.id}, ${member.name}, ${member.email}, ${member.createdAt})
  `;
  return member;
}

export async function updateMember(
  id: string,
  changes: { name?: string; email?: string },
): Promise<Member | undefined> {
  const existing = await getMember(id);
  if (!existing) return undefined;
  const member = { ...existing, ...changes };
  if (!hasDatabase()) {
    Object.assign(existing, changes);
    return existing;
  }
  await sql()`UPDATE members SET name = ${member.name}, email = ${member.email} WHERE id = ${id}`;
  return member;
}

// מחיקת איש צוות – המשימות שלו נשארות ללא שיוך
export async function deleteMember(id: string): Promise<void> {
  if (!hasDatabase()) {
    mem.members = mem.members.filter((m) => m.id !== id);
    mem.tasks.forEach((t) => {
      if (t.assigneeId === id) t.assigneeId = null;
    });
    return;
  }
  await ensureSchema();
  const db = sql();
  await db`UPDATE tasks SET assignee_id = NULL WHERE assignee_id = ${id}`;
  await db`DELETE FROM members WHERE id = ${id}`;
}

// ---------- משימות ----------

export async function listTasks(): Promise<Task[]> {
  if (!hasDatabase()) return [...mem.tasks].sort((a, b) => b.createdAt - a.createdAt);
  await ensureSchema();
  const rows = (await sql()`SELECT * FROM tasks ORDER BY created_at DESC`) as Row[];
  return rows.map(rowToTask);
}

export async function getTask(id: string): Promise<Task | undefined> {
  if (!hasDatabase()) return mem.tasks.find((t) => t.id === id);
  await ensureSchema();
  const rows = (await sql()`SELECT * FROM tasks WHERE id = ${id} LIMIT 1`) as Row[];
  return rows[0] ? rowToTask(rows[0]) : undefined;
}

export async function createTask(input: NewTaskInput): Promise<Task> {
  const now = Date.now();
  const base = {
    id: uid(),
    title: input.title,
    description: input.description || '',
    assigneeId: input.assigneeId || null,
    priority: input.priority,
    status: 'todo' as TaskStatus,
    dueDate: input.dueDate || '',
    createdAt: now,
    updatedAt: now,
  };

  if (!hasDatabase()) {
    mem.lastRef += 1;
    const task: Task = { ...base, ref: mem.lastRef };
    mem.tasks.push(task);
    return task;
  }

  await ensureSchema();
  const db = sql();
  const refRows = (await db`SELECT COALESCE(MAX(ref), 0) + 1 AS next FROM tasks`) as {
    next: number | string;
  }[];
  const task: Task = { ...base, ref: Number(refRows[0].next) };
  await db`
    INSERT INTO tasks (
      id, ref, title, description, assignee_id, priority, status, due_date, created_at, updated_at
    ) VALUES (
      ${task.id}, ${task.ref}, ${task.title}, ${task.description}, ${task.assigneeId},
      ${task.priority}, ${task.status}, ${task.dueDate}, ${task.createdAt}, ${task.updatedAt}
    )
  `;
  return task;
}

export type TaskChanges = Partial<
  Pick<Task, 'title' | 'description' | 'assigneeId' | 'priority' | 'status' | 'dueDate'>
>;

export async function updateTask(id: string, changes: TaskChanges): Promise<Task | undefined> {
  const existing = await getTask(id);
  if (!existing) return undefined;
  const task: Task = { ...existing, ...changes, updatedAt: Date.now() };

  if (!hasDatabase()) {
    Object.assign(existing, task);
    return existing;
  }
  await sql()`
    UPDATE tasks
    SET title = ${task.title},
        description = ${task.description},
        assignee_id = ${task.assigneeId},
        priority = ${task.priority},
        status = ${task.status},
        due_date = ${task.dueDate},
        updated_at = ${task.updatedAt}
    WHERE id = ${id}
  `;
  return task;
}

export async function deleteTask(id: string): Promise<void> {
  if (!hasDatabase()) {
    mem.tasks = mem.tasks.filter((t) => t.id !== id);
    return;
  }
  await ensureSchema();
  await sql()`DELETE FROM tasks WHERE id = ${id}`;
}
