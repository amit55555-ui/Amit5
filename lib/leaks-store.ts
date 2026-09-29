// ===== מחסן דיווחי הנזילות =====
// כשמוגדר מסד נתונים (DATABASE_URL) – שומר ב-Postgres (Neon), כך שכל
// הדיווחים גלויים לכל המשתמשים. אם אין מסד – נופל לזיכרון (פיתוח מקומי).

import { del } from '@vercel/blob';
import { Leak, LeakComment, LeakStatus, NewLeakInput, STATUS_LABELS } from '@/types';
import { hasDatabase, ensureSchema, sql } from '@/lib/db';
import { uploadPhotos, blobToken } from '@/lib/photos';
import { detectArea, roughArea } from '@/lib/area';

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---- נפילה לזיכרון (אם אין מסד נתונים, למשל בפיתוח מקומי) ----
const mem: { leaks: Leak[] } = { leaks: [] };

type Row = Record<string, unknown>;

function rowToComment(r: Row): LeakComment {
  return {
    id: String(r.id),
    leakId: String(r.leak_id),
    text: String(r.text ?? ''),
    author: r.author === 'admin' ? 'admin' : 'public',
    kind: r.kind === 'status' ? 'status' : 'comment',
    createdAt: Number(r.created_at),
  };
}

function rowToLeak(r: Row, comments: LeakComment[]): Leak {
  const lat = Number(r.lat);
  const lng = Number(r.lng);
  const status = String(r.status ?? 'open');
  return {
    id: String(r.id),
    lat,
    lng,
    description: String(r.description ?? ''),
    photoUrl: String(r.photo_url),
    photoHidden: Boolean(r.photo_hidden),
    status: status === 'in_progress' || status === 'resolved' ? status : 'open',
    resolvedAt: r.resolved_at == null ? null : Number(r.resolved_at),
    // דיווחים ישנים שנוצרו לפני זיהוי האזור – מקבלים אזור משוער
    area: String(r.area ?? '') || roughArea(lat, lng),
    createdAt: Number(r.created_at),
    comments,
  };
}

// גרסה ציבורית של דיווח – בלי כתובת התמונה אם היא הוסתרה ע"י מנהל
export function toPublic(leak: Leak): Leak {
  return leak.photoHidden ? { ...leak, photoUrl: '' } : leak;
}

export async function listLeaks(): Promise<Leak[]> {
  if (!hasDatabase()) {
    return [...mem.leaks].sort((a, b) => b.createdAt - a.createdAt);
  }
  await ensureSchema();
  const db = sql();
  const [rows, commentRows] = (await Promise.all([
    db`SELECT * FROM leaks ORDER BY created_at DESC`,
    db`SELECT * FROM leak_comments ORDER BY created_at ASC`,
  ])) as [Row[], Row[]];

  const byLeak = new Map<string, LeakComment[]>();
  for (const c of commentRows.map(rowToComment)) {
    const list = byLeak.get(c.leakId) ?? [];
    list.push(c);
    byLeak.set(c.leakId, list);
  }
  return rows.map((r) => rowToLeak(r, byLeak.get(String(r.id)) ?? []));
}

export async function getLeak(id: string): Promise<Leak | null> {
  if (!hasDatabase()) return mem.leaks.find((l) => l.id === id) ?? null;
  await ensureSchema();
  const db = sql();
  const [rows, commentRows] = (await Promise.all([
    db`SELECT * FROM leaks WHERE id = ${id}`,
    db`SELECT * FROM leak_comments WHERE leak_id = ${id} ORDER BY created_at ASC`,
  ])) as [Row[], Row[]];
  if (rows.length === 0) return null;
  return rowToLeak(rows[0], commentRows.map(rowToComment));
}

export async function createLeak(input: NewLeakInput): Promise<Leak> {
  const now = Date.now();
  const id = uid();
  const area = await detectArea(input.lat, input.lng);

  if (!hasDatabase()) {
    const leak: Leak = {
      id,
      lat: input.lat,
      lng: input.lng,
      description: input.description,
      photoUrl: input.photo,
      photoHidden: false,
      status: 'open',
      resolvedAt: null,
      area,
      createdAt: now,
      comments: [],
    };
    mem.leaks.push(leak);
    return leak;
  }

  await ensureSchema();
  const [photoUrl] = await uploadPhotos([input.photo], id);

  await sql()`
    INSERT INTO leaks (id, lat, lng, description, photo_url, created_at, area)
    VALUES (${id}, ${input.lat}, ${input.lng}, ${input.description}, ${photoUrl}, ${now}, ${area})
  `;

  return {
    id,
    lat: input.lat,
    lng: input.lng,
    description: input.description,
    photoUrl,
    photoHidden: false,
    status: 'open',
    resolvedAt: null,
    area,
    createdAt: now,
    comments: [],
  };
}

async function insertComment(
  leakId: string,
  text: string,
  author: LeakComment['author'],
  kind: LeakComment['kind'],
): Promise<void> {
  const c: LeakComment = { id: uid(), leakId, text, author, kind, createdAt: Date.now() };
  if (!hasDatabase()) {
    mem.leaks.find((l) => l.id === leakId)?.comments.push(c);
    return;
  }
  await sql()`
    INSERT INTO leak_comments (id, leak_id, text, author, kind, created_at)
    VALUES (${c.id}, ${c.leakId}, ${c.text}, ${c.author}, ${c.kind}, ${c.createdAt})
  `;
}

// הוספת הערה לדיווח. מחזיר null אם הדיווח לא קיים.
export async function addComment(
  leakId: string,
  text: string,
  author: LeakComment['author'],
): Promise<Leak | null> {
  const leak = await getLeak(leakId);
  if (!leak) return null;
  await insertComment(leakId, text, author, 'comment');
  return getLeak(leakId);
}

// שינוי סטטוס טיפול + רישום השינוי בהיסטוריית ההערות
export async function setStatus(
  leakId: string,
  status: LeakStatus,
  author: LeakComment['author'],
  note = '',
): Promise<Leak | null> {
  const leak = await getLeak(leakId);
  if (!leak) return null;
  if (leak.status === status && !note) return leak;

  const resolvedAt = status === 'resolved' ? Date.now() : null;
  const who = author === 'admin' ? 'מנהל' : 'תושב';
  const text = `${who} סימן: ${STATUS_LABELS[status]}${note ? ` — ${note}` : ''}`;

  if (!hasDatabase()) {
    leak.status = status;
    leak.resolvedAt = resolvedAt;
  } else {
    await sql()`UPDATE leaks SET status = ${status}, resolved_at = ${resolvedAt} WHERE id = ${leakId}`;
  }
  await insertComment(leakId, text, author, 'status');
  return getLeak(leakId);
}

export async function setPhotoHidden(leakId: string, hidden: boolean): Promise<Leak | null> {
  if (!hasDatabase()) {
    const leak = mem.leaks.find((l) => l.id === leakId);
    if (!leak) return null;
    leak.photoHidden = hidden;
    return leak;
  }
  await ensureSchema();
  await sql()`UPDATE leaks SET photo_hidden = ${hidden} WHERE id = ${leakId}`;
  return getLeak(leakId);
}

// מחיקת דיווח לצמיתות (כולל ההערות, ותמונה ב-Blob אם יש)
export async function deleteLeak(leakId: string): Promise<boolean> {
  const leak = await getLeak(leakId);
  if (!leak) return false;

  if (!hasDatabase()) {
    mem.leaks = mem.leaks.filter((l) => l.id !== leakId);
  } else {
    await sql()`DELETE FROM leak_comments WHERE leak_id = ${leakId}`;
    await sql()`DELETE FROM leaks WHERE id = ${leakId}`;
  }

  if (leak.photoUrl.startsWith('https://')) {
    const token = blobToken();
    await del(leak.photoUrl, token ? { token } : undefined).catch(() => {
      // התמונה כבר לא קיימת / Blob לא זמין – לא חוסם את המחיקה
    });
  }
  return true;
}

export async function deleteComment(commentId: string): Promise<boolean> {
  if (!hasDatabase()) {
    for (const leak of mem.leaks) {
      const before = leak.comments.length;
      leak.comments = leak.comments.filter((c) => c.id !== commentId);
      if (leak.comments.length !== before) return true;
    }
    return false;
  }
  await ensureSchema();
  const rows = (await sql()`DELETE FROM leak_comments WHERE id = ${commentId} RETURNING id`) as Row[];
  return rows.length > 0;
}
