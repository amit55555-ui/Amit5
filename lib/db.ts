// ===== חיבור למסד הנתונים (Neon / Vercel Postgres) =====
// קורא את מחרוזת החיבור ממשתני הסביבה שנוצרים אוטומטית ע"י אינטגרציית
// Neon/Postgres ב-Vercel. אם אין חיבור – מחזיר null, והמערכת נופלת
// חזרה לאחסון בקובץ (lib/store) כדי שהפיתוח המקומי לא יישבר.

import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

function connectionString(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_PRISMA_URL ||
    undefined
  );
}

export function hasDatabase(): boolean {
  return Boolean(connectionString());
}

let cached: NeonQueryFunction<false, false> | null = null;

export function sql(): NeonQueryFunction<false, false> {
  if (cached) return cached;
  const cs = connectionString();
  if (!cs) throw new Error('DATABASE_URL is not configured');
  cached = neon(cs);
  return cached;
}

// יוצר את הטבלה בפעם הראשונה (בטוח להריץ שוב ושוב)
let schemaReady: Promise<void> | null = null;
export function ensureSchema(): Promise<void> {
  if (schemaReady) return schemaReady;
  const db = sql();
  schemaReady = (async () => {
    await db`
      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        ref INTEGER NOT NULL,
        category_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        entrance TEXT NOT NULL,
        floor TEXT,
        reporter_name TEXT NOT NULL,
        reporter_phone TEXT NOT NULL,
        reporter_email TEXT,
        reporter_token TEXT NOT NULL,
        priority TEXT NOT NULL,
        status TEXT NOT NULL,
        photos JSONB NOT NULL DEFAULT '[]'::jsonb,
        messages JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL
      )
    `;
    await db`CREATE INDEX IF NOT EXISTS reports_created_at_idx ON reports (created_at DESC)`;
    await db`CREATE INDEX IF NOT EXISTS reports_token_idx ON reports (reporter_token)`;
  })().catch((e) => {
    schemaReady = null; // אפשר לנסות שוב בבקשה הבאה
    throw e;
  });
  return schemaReady;
}
