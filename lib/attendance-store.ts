// ===== מחסן רשומות הנוכחות בצד השרת =====
// כשמוגדר מסד נתונים (DATABASE_URL) – שומר ב-Postgres (Neon), כך שכל
// המכשירים רואים את אותן רשומות. אם אין מסד – נופל לזיכרון בלבד (פיתוח מקומי).

import { AttendanceEntry } from '@/types';
import { hasDatabase, ensureAttendanceSchema, sql } from '@/lib/db';

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---- נפילה לזיכרון (אם אין מסד נתונים, למשל בפיתוח מקומי) ----
const mem: { entries: AttendanceEntry[] } = { entries: [] };

function rowToEntry(r: Record<string, unknown>): AttendanceEntry {
  return {
    id: String(r.id),
    clockIn: Number(r.clock_in),
    clockOut: r.clock_out == null ? null : Number(r.clock_out),
    note: r.note == null ? '' : String(r.note),
    editedByAdmin: Boolean(r.edited_by_admin),
    createdAt: Number(r.created_at),
    updatedAt: Number(r.updated_at),
  };
}

export async function listEntries(): Promise<AttendanceEntry[]> {
  if (!hasDatabase()) {
    return [...mem.entries].sort((a, b) => a.clockIn - b.clockIn);
  }
  await ensureAttendanceSchema();
  const rows = (await sql()`SELECT * FROM attendance_entries ORDER BY clock_in ASC`) as Record<
    string,
    unknown
  >[];
  return rows.map(rowToEntry);
}

export async function getEntry(id: string): Promise<AttendanceEntry | undefined> {
  if (!hasDatabase()) return mem.entries.find((e) => e.id === id);
  await ensureAttendanceSchema();
  const rows = (await sql()`SELECT * FROM attendance_entries WHERE id = ${id} LIMIT 1`) as Record<
    string,
    unknown
  >[];
  return rows[0] ? rowToEntry(rows[0]) : undefined;
}

export async function findOpenEntry(): Promise<AttendanceEntry | undefined> {
  const entries = await listEntries();
  return entries.find((e) => e.clockOut == null);
}

export async function createEntry(input: {
  clockIn: number;
  clockOut: number | null;
  note?: string;
  editedByAdmin: boolean;
}): Promise<AttendanceEntry> {
  const now = Date.now();
  const entry: AttendanceEntry = {
    id: uid(),
    clockIn: input.clockIn,
    clockOut: input.clockOut,
    note: input.note?.trim() || '',
    editedByAdmin: input.editedByAdmin,
    createdAt: now,
    updatedAt: now,
  };

  if (!hasDatabase()) {
    mem.entries.push(entry);
    return entry;
  }

  await ensureAttendanceSchema();
  await sql()`
    INSERT INTO attendance_entries (
      id, clock_in, clock_out, note, edited_by_admin, created_at, updated_at
    ) VALUES (
      ${entry.id}, ${entry.clockIn}, ${entry.clockOut}, ${entry.note}, ${entry.editedByAdmin}, ${entry.createdAt}, ${entry.updatedAt}
    )
  `;
  return entry;
}

export async function updateEntry(
  id: string,
  changes: {
    clockIn?: number;
    clockOut?: number | null;
    note?: string;
    editedByAdmin?: boolean;
  },
): Promise<AttendanceEntry | undefined> {
  const now = Date.now();

  if (!hasDatabase()) {
    const entry = mem.entries.find((e) => e.id === id);
    if (!entry) return undefined;
    if (changes.clockIn !== undefined) entry.clockIn = changes.clockIn;
    if (changes.clockOut !== undefined) entry.clockOut = changes.clockOut;
    if (changes.note !== undefined) entry.note = changes.note.trim();
    if (changes.editedByAdmin) entry.editedByAdmin = true;
    entry.updatedAt = now;
    return entry;
  }

  await ensureAttendanceSchema();
  const existing = await getEntry(id);
  if (!existing) return undefined;

  const updated: AttendanceEntry = {
    ...existing,
    clockIn: changes.clockIn !== undefined ? changes.clockIn : existing.clockIn,
    clockOut: changes.clockOut !== undefined ? changes.clockOut : existing.clockOut,
    note: changes.note !== undefined ? changes.note.trim() : existing.note,
    editedByAdmin: changes.editedByAdmin ? true : existing.editedByAdmin,
    updatedAt: now,
  };

  await sql()`
    UPDATE attendance_entries
    SET clock_in = ${updated.clockIn},
        clock_out = ${updated.clockOut},
        note = ${updated.note},
        edited_by_admin = ${updated.editedByAdmin},
        updated_at = ${updated.updatedAt}
    WHERE id = ${id}
  `;
  return updated;
}

export async function deleteEntry(id: string): Promise<boolean> {
  if (!hasDatabase()) {
    const before = mem.entries.length;
    mem.entries = mem.entries.filter((e) => e.id !== id);
    return mem.entries.length < before;
  }
  await ensureAttendanceSchema();
  await sql()`DELETE FROM attendance_entries WHERE id = ${id}`;
  return true;
}
