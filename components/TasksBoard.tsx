'use client';

import { useEffect, useMemo, useState } from 'react';
import { Member, Priority, Task, TaskStatus, TASK_STATUS_LABELS } from '@/types';
import { verifyPasscode } from '@/lib/client';
import {
  addMember,
  addTask,
  editMember,
  editTask,
  fetchMembers,
  fetchTasks,
  removeMember,
  removeTask,
} from '@/lib/tasksClient';

// אותו מפתח כמו בדשבורד הוועד – כניסה אחת פותחת את שניהם
const STORAGE = 'building.committee.v1';

const STATUS_STYLE: Record<TaskStatus, string> = {
  todo: 'bg-red-50 text-open',
  in_progress: 'bg-amber-50 text-progress',
  done: 'bg-green-50 text-closed',
};

function formatDue(d: string): string {
  return d ? new Date(d + 'T00:00:00').toLocaleDateString('he-IL') : '';
}

function isOverdue(t: Task): boolean {
  if (!t.dueDate || t.status === 'done') return false;
  const today = new Date().toISOString().slice(0, 10);
  return t.dueDate < today;
}

export default function TasksBoard() {
  const [unlocked, setUnlocked] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  const [view, setView] = useState<'tasks' | 'team'>('tasks');
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');

  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'open' | 'all'>('open');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE);
    if (saved) {
      verifyPasscode(saved).then((ok) => {
        if (ok) {
          setPasscode(saved);
          setUnlocked(true);
        }
      });
    }
  }, []);

  async function load(code = passcode) {
    setLoading(true);
    try {
      const [m, t] = await Promise.all([fetchMembers(code), fetchTasks(code)]);
      setMembers(m);
      setTasks(t);
    } catch (e) {
      flash((e as Error).message);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (unlocked) load(passcode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked]);

  function flash(msg: string) {
    setNotice(msg);
    setTimeout(() => setNotice((n) => (n === msg ? '' : n)), 5000);
  }

  async function unlock() {
    setChecking(true);
    setError('');
    const ok = await verifyPasscode(codeInput);
    setChecking(false);
    if (ok) {
      setPasscode(codeInput);
      setUnlocked(true);
      localStorage.setItem(STORAGE, codeInput);
    } else {
      setError('קוד שגוי. נסו שוב.');
    }
  }

  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  // הודעה למשתמש לאחר שיוך – האם המייל נשלח
  function assignedNotice(task: Task, emailed: boolean, prefix: string) {
    const m = task.assigneeId ? memberById.get(task.assigneeId) : undefined;
    if (!m) return flash(prefix);
    flash(
      emailed
        ? `${prefix} · נשלח מייל ל${m.name} (${m.email}) ✉️`
        : `${prefix} · ⚠️ המייל ל${m.name} לא נשלח (שליחת מיילים לא מוגדרת בשרת)`,
    );
  }

  function replaceTask(t: Task) {
    setTasks((ts) => ts.map((x) => (x.id === t.id ? t : x)));
  }

  const filtered = useMemo(
    () =>
      tasks.filter((t) => {
        if (assigneeFilter === 'none' && t.assigneeId) return false;
        if (assigneeFilter !== 'all' && assigneeFilter !== 'none' && t.assigneeId !== assigneeFilter)
          return false;
        if (statusFilter === 'open' && t.status === 'done') return false;
        if (statusFilter !== 'all' && statusFilter !== 'open' && t.status !== statusFilter) return false;
        return true;
      }),
    [tasks, assigneeFilter, statusFilter],
  );

  if (!unlocked) {
    return (
      <div className="card mx-auto max-w-sm p-6 text-center">
        <div className="mb-2 text-4xl">🔐</div>
        <h2 className="text-lg font-bold">ניהול משימות</h2>
        <p className="mt-1 text-sm text-muted">הזינו את קוד הוועד כדי לנהל ולחלק משימות.</p>
        <input
          className="field mt-4 text-center tracking-widest"
          type="password"
          placeholder="קוד גישה"
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && unlock()}
        />
        {error && <p className="mt-2 text-sm text-open">{error}</p>}
        <button className="btn-primary mt-3 w-full" disabled={checking || !codeInput} onClick={unlock}>
          {checking ? 'בודק…' : 'כניסה'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* תת-לשוניות */}
      <div className="flex gap-2">
        {(
          [
            ['tasks', `📝 משימות (${tasks.filter((t) => t.status !== 'done').length})`],
            ['team', `👥 צוות (${members.length})`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={`btn flex-1 py-2 text-sm ${view === id ? 'bg-ink text-white' : 'btn-ghost'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {notice && (
        <div className="card border-brand-light bg-teal-50 p-3 text-sm font-medium">{notice}</div>
      )}

      {view === 'team' ? (
        <TeamPanel
          passcode={passcode}
          members={members}
          tasks={tasks}
          onChange={setMembers}
          onRemoved={(id) => {
            setMembers((ms) => ms.filter((m) => m.id !== id));
            setTasks((ts) => ts.map((t) => (t.assigneeId === id ? { ...t, assigneeId: null } : t)));
          }}
          flash={flash}
        />
      ) : (
        <>
          <NewTaskForm
            members={members}
            onGoTeam={() => setView('team')}
            onSubmit={async (input) => {
              const { task, emailed } = await addTask(passcode, input);
              setTasks((ts) => [task, ...ts]);
              assignedNotice(task, emailed, `משימה #${task.ref} נוצרה`);
            }}
          />

          <div className="card flex flex-wrap gap-2 p-3">
            <select
              className="field w-auto py-2"
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
            >
              <option value="all">כל האחראים</option>
              <option value="none">ללא שיוך</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <select
              className="field w-auto py-2"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'open' | 'all')}
            >
              <option value="open">פתוחות</option>
              <option value="all">הכול</option>
              {(Object.keys(TASK_STATUS_LABELS) as TaskStatus[]).map((s) => (
                <option key={s} value={s}>
                  {TASK_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <button className="btn-ghost mr-auto px-3 py-2 text-sm" onClick={() => load()}>
              🔄 רענון
            </button>
          </div>

          {loading ? (
            <div className="card p-8 text-center text-muted">טוען…</div>
          ) : filtered.length === 0 ? (
            <div className="card p-8 text-center text-muted">אין משימות להצגה.</div>
          ) : (
            <div className="space-y-3">
              {filtered.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  members={members}
                  onEdit={async (changes) => {
                    try {
                      const { task, emailed } = await editTask(passcode, t.id, changes);
                      replaceTask(task);
                      if (changes.assigneeId !== undefined || changes.resend) {
                        assignedNotice(task, emailed, changes.resend ? 'שליחה חוזרת' : 'האחראי עודכן');
                      }
                    } catch (e) {
                      flash((e as Error).message);
                    }
                  }}
                  onDelete={async () => {
                    if (!confirm(`למחוק את משימה #${t.ref}?`)) return;
                    await removeTask(passcode, t.id);
                    setTasks((ts) => ts.filter((x) => x.id !== t.id));
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------- טופס משימה חדשה ----------
function NewTaskForm({
  members,
  onSubmit,
  onGoTeam,
}: {
  members: Member[];
  onSubmit: (input: {
    title: string;
    description: string;
    assigneeId: string | null;
    priority: Priority;
    dueDate: string;
  }) => Promise<void>;
  onGoTeam: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [priority, setPriority] = useState<Priority>('normal');
  const [dueDate, setDueDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  if (!open) {
    return (
      <button className="btn-primary w-full" onClick={() => setOpen(true)}>
        ➕ משימה חדשה
      </button>
    );
  }

  async function submit() {
    setBusy(true);
    setErr('');
    try {
      await onSubmit({ title, description, assigneeId: assigneeId || null, priority, dueDate });
      setTitle('');
      setDescription('');
      setAssigneeId('');
      setPriority('normal');
      setDueDate('');
      setOpen(false);
    } catch (e) {
      setErr((e as Error).message);
    }
    setBusy(false);
  }

  return (
    <div className="card space-y-3 p-4">
      <div>
        <label className="label">מה צריך לעשות?</label>
        <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="למשל: להזמין טכנאי למעלית" />
      </div>
      <div>
        <label className="label">פרטים (אופציונלי)</label>
        <textarea className="field min-h-[80px]" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="label">אחראי/ת</label>
          <select className="field" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
            <option value="">ללא שיוך</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          {members.length === 0 && (
            <button className="mt-1 text-xs text-brand underline" onClick={onGoTeam}>
              הוסיפו אנשי צוות קודם
            </button>
          )}
        </div>
        <div>
          <label className="label">תאריך יעד</label>
          <input className="field" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        <div>
          <label className="label">דחיפות</label>
          <select className="field" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            <option value="normal">רגיל</option>
            <option value="urgent">🔴 דחוף</option>
          </select>
        </div>
      </div>
      {assigneeId && (
        <p className="text-xs text-muted">✉️ יישלח מייל עם פרטי המשימה ל{members.find((m) => m.id === assigneeId)?.name}.</p>
      )}
      {err && <p className="text-sm text-open">{err}</p>}
      <div className="flex gap-2">
        <button className="btn-primary flex-1" disabled={busy || !title.trim()} onClick={submit}>
          {busy ? 'שומר…' : 'יצירת משימה'}
        </button>
        <button className="btn-ghost" onClick={() => setOpen(false)}>
          ביטול
        </button>
      </div>
    </div>
  );
}

// ---------- כרטיס משימה ----------
function TaskCard({
  task,
  members,
  onEdit,
  onDelete,
}: {
  task: Task;
  members: Member[];
  onEdit: (changes: {
    assigneeId?: string | null;
    status?: TaskStatus;
    resend?: boolean;
  }) => Promise<void>;
  onDelete: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const overdue = isOverdue(task);

  async function run(changes: Parameters<typeof onEdit>[0]) {
    setBusy(true);
    await onEdit(changes);
    setBusy(false);
  }

  return (
    <div className={`card p-4 ${task.status === 'done' ? 'opacity-70' : ''}`}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span>#{task.ref}</span>
            <span className={`rounded-full px-2.5 py-0.5 font-semibold ${STATUS_STYLE[task.status]}`}>
              {TASK_STATUS_LABELS[task.status]}
            </span>
            {task.priority === 'urgent' && <span className="font-semibold text-open">🔴 דחוף</span>}
            {task.dueDate && (
              <span className={overdue ? 'font-semibold text-open' : ''}>
                📅 {formatDue(task.dueDate)}
                {overdue && ' · באיחור'}
              </span>
            )}
          </div>
          <h3 className={`mt-1 font-bold ${task.status === 'done' ? 'line-through' : ''}`}>{task.title}</h3>
          {task.description && (
            <p className="mt-1 whitespace-pre-wrap text-sm text-muted">{task.description}</p>
          )}
        </div>
        <button className="text-muted hover:text-open" title="מחיקה" onClick={onDelete}>
          🗑️
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select
          className="field w-auto flex-1 py-2 text-sm"
          disabled={busy}
          value={task.assigneeId || ''}
          onChange={(e) => run({ assigneeId: e.target.value || null })}
        >
          <option value="">👤 ללא שיוך</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              👤 {m.name}
            </option>
          ))}
        </select>
        <select
          className="field w-auto py-2 text-sm"
          disabled={busy}
          value={task.status}
          onChange={(e) => run({ status: e.target.value as TaskStatus })}
        >
          {(Object.keys(TASK_STATUS_LABELS) as TaskStatus[]).map((s) => (
            <option key={s} value={s}>
              {TASK_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        {task.assigneeId && (
          <button
            className="btn-ghost px-3 py-2 text-sm"
            disabled={busy}
            title="שליחה חוזרת של המייל לאחראי"
            onClick={() => run({ resend: true })}
          >
            ✉️
          </button>
        )}
      </div>
    </div>
  );
}

// ---------- ניהול צוות ----------
function TeamPanel({
  passcode,
  members,
  tasks,
  onChange,
  onRemoved,
  flash,
}: {
  passcode: string;
  members: Member[];
  tasks: Task[];
  onChange: (m: Member[]) => void;
  onRemoved: (id: string) => void;
  flash: (msg: string) => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');

  async function add() {
    setBusy(true);
    try {
      const m = await addMember(passcode, name.trim(), email.trim());
      onChange([...members, m].sort((a, b) => a.name.localeCompare(b.name, 'he')));
      setName('');
      setEmail('');
    } catch (e) {
      flash((e as Error).message);
    }
    setBusy(false);
  }

  async function saveEdit(id: string) {
    try {
      const m = await editMember(passcode, id, { name: editName, email: editEmail });
      onChange(members.map((x) => (x.id === id ? m : x)));
      setEditingId(null);
    } catch (e) {
      flash((e as Error).message);
    }
  }

  return (
    <div className="space-y-3">
      <div className="card space-y-3 p-4">
        <h3 className="font-bold">הוספת איש/אשת צוות</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <input className="field" placeholder="שם" value={name} onChange={(e) => setName(e.target.value)} />
          <input
            className="field"
            type="email"
            dir="ltr"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
        </div>
        <button className="btn-primary w-full" disabled={busy || !name.trim() || !email.trim()} onClick={add}>
          הוספה
        </button>
      </div>

      {members.length === 0 ? (
        <div className="card p-8 text-center text-muted">עדיין אין אנשי צוות.</div>
      ) : (
        members.map((m) => {
          const open = tasks.filter((t) => t.assigneeId === m.id && t.status !== 'done').length;
          if (editingId === m.id) {
            return (
              <div key={m.id} className="card space-y-2 p-4">
                <input className="field" value={editName} onChange={(e) => setEditName(e.target.value)} />
                <input className="field" dir="ltr" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                <div className="flex gap-2">
                  <button className="btn-primary flex-1 py-2" onClick={() => saveEdit(m.id)}>
                    שמירה
                  </button>
                  <button className="btn-ghost py-2" onClick={() => setEditingId(null)}>
                    ביטול
                  </button>
                </div>
              </div>
            );
          }
          return (
            <div key={m.id} className="card flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-lg font-bold text-white">
                {m.name.trim().charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{m.name}</div>
                <div className="truncate text-sm text-muted" dir="ltr">
                  {m.email}
                </div>
              </div>
              <span className="text-xs text-muted">{open} פתוחות</span>
              <button
                className="text-muted hover:text-ink"
                title="עריכה"
                onClick={() => {
                  setEditingId(m.id);
                  setEditName(m.name);
                  setEditEmail(m.email);
                }}
              >
                ✏️
              </button>
              <button
                className="text-muted hover:text-open"
                title="הסרה"
                onClick={async () => {
                  if (!confirm(`להסיר את ${m.name}? המשימות שלו/ה יישארו ללא שיוך.`)) return;
                  await removeMember(passcode, m.id);
                  onRemoved(m.id);
                }}
              >
                🗑️
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}
