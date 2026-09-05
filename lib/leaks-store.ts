// ===== מחסן דיווחי הנזילות =====
// כשמוגדר מסד נתונים (DATABASE_URL) – שומר ב-Postgres (Neon), כך שכל
// הדיווחים גלויים לכל המשתמשים. אם אין מסד – נופל לזיכרון (פיתוח מקומי).

import { Leak, NewLeakInput } from '@/types';
import { hasDatabase, ensureSchema, sql } from '@/lib/db';
import { uploadPhotos } from '@/lib/photos';

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---- נפילה לזיכרון (אם אין מסד נתונים, למשל בפיתוח מקומי) ----
const mem: { leaks: Leak[] } = { leaks: [] };

function rowToLeak(r: Record<string, unknown>): Leak {
  return {
    id: String(r.id),
    lat: Number(r.lat),
    lng: Number(r.lng),
    description: String(r.description ?? ''),
    photoUrl: String(r.photo_url),
    createdAt: Number(r.created_at),
  };
}

export async function listLeaks(): Promise<Leak[]> {
  if (!hasDatabase()) {
    return [...mem.leaks].sort((a, b) => b.createdAt - a.createdAt);
  }
  await ensureSchema();
  const rows = (await sql()`SELECT * FROM leaks ORDER BY created_at DESC`) as Record<
    string,
    unknown
  >[];
  return rows.map(rowToLeak);
}

export async function createLeak(input: NewLeakInput): Promise<Leak> {
  const now = Date.now();
  const id = uid();

  if (!hasDatabase()) {
    const leak: Leak = {
      id,
      lat: input.lat,
      lng: input.lng,
      description: input.description,
      photoUrl: input.photo,
      createdAt: now,
    };
    mem.leaks.push(leak);
    return leak;
  }

  await ensureSchema();
  const [photoUrl] = await uploadPhotos([input.photo], id);

  await sql()`
    INSERT INTO leaks (id, lat, lng, description, photo_url, created_at)
    VALUES (${id}, ${input.lat}, ${input.lng}, ${input.description}, ${photoUrl}, ${now})
  `;

  return { id, lat: input.lat, lng: input.lng, description: input.description, photoUrl, createdAt: now };
}
