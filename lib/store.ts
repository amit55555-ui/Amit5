// ===== מחסן הפניות בצד השרת =====
// כשמוגדר מסד נתונים (DATABASE_URL) – שומר ב-Postgres (Neon), כך שכל
// הפניות במקום אחד משותף. אם אין מסד – נופל לזיכרון בלבד (פיתוח מקומי).

import { NewReportInput, Report, ReportMessage, ReportStatus } from '@/types';
import { hasDatabase, ensureSchema, sql } from '@/lib/db';
import { uploadPhotos } from '@/lib/photos';

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---- נפילה לזיכרון (אם אין מסד נתונים, למשל בפיתוח מקומי) ----
const mem: { reports: Report[]; lastRef: number } = { reports: [], lastRef: 100 };

// ---- המרת שורת DB לאובייקט Report ----
function parseJson<T>(v: unknown, fallback: T): T {
  if (v == null) return fallback;
  if (typeof v === 'string') {
    try {
      return JSON.parse(v) as T;
    } catch {
      return fallback;
    }
  }
  return v as T;
}

function rowToReport(r: Record<string, unknown>): Report {
  return {
    id: String(r.id),
    ref: Number(r.ref),
    categoryId: String(r.category_id),
    title: String(r.title),
    description: String(r.description),
    entrance: String(r.entrance),
    floor: r.floor == null ? '' : String(r.floor),
    reporterName: String(r.reporter_name),
    reporterPhone: String(r.reporter_phone),
    reporterEmail: r.reporter_email == null ? undefined : String(r.reporter_email),
    reporterToken: String(r.reporter_token),
    priority: r.priority as Report['priority'],
    status: r.status as ReportStatus,
    photos: parseJson<string[]>(r.photos, []),
    messages: parseJson<ReportMessage[]>(r.messages, []),
    createdAt: Number(r.created_at),
    updatedAt: Number(r.updated_at),
  };
}

export async function listReports(filter?: {
  status?: ReportStatus;
  entrance?: string;
  reporterToken?: string;
}): Promise<Report[]> {
  let items: Report[];
  if (!hasDatabase()) {
    items = [...mem.reports].sort((a, b) => b.createdAt - a.createdAt);
  } else {
    await ensureSchema();
    const rows = (await sql()`SELECT * FROM reports ORDER BY created_at DESC`) as Record<
      string,
      unknown
    >[];
    items = rows.map(rowToReport);
  }
  if (filter?.status) items = items.filter((r) => r.status === filter.status);
  if (filter?.entrance) items = items.filter((r) => r.entrance === filter.entrance);
  if (filter?.reporterToken) items = items.filter((r) => r.reporterToken === filter.reporterToken);
  return items;
}

export async function getReport(id: string): Promise<Report | undefined> {
  if (!hasDatabase()) return mem.reports.find((r) => r.id === id);
  await ensureSchema();
  const rows = (await sql()`SELECT * FROM reports WHERE id = ${id} LIMIT 1`) as Record<
    string,
    unknown
  >[];
  return rows[0] ? rowToReport(rows[0]) : undefined;
}

export async function createReport(input: NewReportInput): Promise<Report> {
  const now = Date.now();
  const id = uid();

  if (!hasDatabase()) {
    mem.lastRef += 1;
    const report: Report = {
      id,
      ref: mem.lastRef,
      categoryId: input.categoryId,
      title: input.title,
      description: input.description,
      entrance: input.entrance,
      floor: input.floor,
      reporterName: input.reporterName,
      reporterPhone: input.reporterPhone,
      reporterEmail: input.reporterEmail,
      reporterToken: input.reporterToken,
      priority: input.priority,
      photos: input.photos || [],
      status: 'open',
      messages: [
        { id: uid(), author: 'resident', authorName: input.reporterName, text: input.description, createdAt: now },
      ],
      createdAt: now,
      updatedAt: now,
    };
    mem.reports.push(report);
    return report;
  }

  await ensureSchema();
  const db = sql();
  const refRows = (await db`SELECT COALESCE(MAX(ref), 100) + 1 AS next FROM reports`) as {
    next: number | string;
  }[];
  const ref = Number(refRows[0].next);

  const photos = await uploadPhotos(input.photos || [], String(ref));
  const messages: ReportMessage[] = [
    { id: uid(), author: 'resident', authorName: input.reporterName, text: input.description, createdAt: now },
  ];

  await db`
    INSERT INTO reports (
      id, ref, category_id, title, description, entrance, floor,
      reporter_name, reporter_phone, reporter_email, reporter_token,
      priority, status, photos, messages, created_at, updated_at
    ) VALUES (
      ${id}, ${ref}, ${input.categoryId}, ${input.title}, ${input.description}, ${input.entrance}, ${input.floor || null},
      ${input.reporterName}, ${input.reporterPhone}, ${input.reporterEmail || null}, ${input.reporterToken},
      ${input.priority}, 'open', ${JSON.stringify(photos)}::jsonb, ${JSON.stringify(messages)}::jsonb, ${now}, ${now}
    )
  `;

  return {
    id,
    ref,
    categoryId: input.categoryId,
    title: input.title,
    description: input.description,
    entrance: input.entrance,
    floor: input.floor,
    reporterName: input.reporterName,
    reporterPhone: input.reporterPhone,
    reporterEmail: input.reporterEmail,
    reporterToken: input.reporterToken,
    priority: input.priority,
    photos,
    status: 'open',
    messages,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateReport(
  id: string,
  changes: {
    status?: ReportStatus;
    message?: { author: 'committee' | 'resident'; authorName: string; text: string };
  },
): Promise<Report | undefined> {
  const now = Date.now();

  if (!hasDatabase()) {
    const report = mem.reports.find((r) => r.id === id);
    if (!report) return undefined;
    if (changes.status) report.status = changes.status;
    if (changes.message && changes.message.text.trim()) {
      report.messages.push({
        id: uid(),
        author: changes.message.author,
        authorName: changes.message.authorName,
        text: changes.message.text.trim(),
        createdAt: now,
      });
    }
    report.updatedAt = now;
    return report;
  }

  await ensureSchema();
  const db = sql();
  const rows = (await db`SELECT * FROM reports WHERE id = ${id} LIMIT 1`) as Record<
    string,
    unknown
  >[];
  if (!rows[0]) return undefined;
  const report = rowToReport(rows[0]);

  if (changes.status) report.status = changes.status;
  if (changes.message && changes.message.text.trim()) {
    report.messages.push({
      id: uid(),
      author: changes.message.author,
      authorName: changes.message.authorName,
      text: changes.message.text.trim(),
      createdAt: now,
    });
  }
  report.updatedAt = now;

  await db`
    UPDATE reports
    SET status = ${report.status},
        messages = ${JSON.stringify(report.messages)}::jsonb,
        updated_at = ${report.updatedAt}
    WHERE id = ${id}
  `;
  return report;
}
