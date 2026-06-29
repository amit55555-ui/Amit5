// ===== מחסן הנתונים בצד השרת =====
// שומר את הפניות בקובץ JSON (best-effort) עם נפילה לזיכרון בלבד.
// מתאים להרצה מקומית ולשרת יחיד. לפריסה רב-מופעית (Vercel וכד')
// מומלץ לחבר מסד נתונים — ראו SETUP.md.

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { NewReportInput, Report, ReportMessage, ReportStatus } from '@/types';

// מיקום קובץ הנתונים: ניתן לשנות עם DATA_DIR. בברירת מחדל – ספריית temp
// (זמינה לכתיבה גם בסביבות serverless, אם כי לא תמיד מתמידה בין מופעים).
const DATA_DIR = process.env.DATA_DIR || path.join(os.tmpdir(), 'building-app');
const DATA_FILE = path.join(DATA_DIR, 'reports.json');

interface DB {
  reports: Report[];
  lastRef: number;
}

// מטמון בזיכרון – מקור האמת בזמן ריצה
let cache: DB | null = null;

async function load(): Promise<DB> {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    cache = JSON.parse(raw) as DB;
  } catch {
    cache = { reports: [], lastRef: 100 };
  }
  return cache;
}

async function persist(db: DB): Promise<void> {
  cache = db;
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch {
    /* מערכת קבצים לקריאה בלבד – נשארים עם הזיכרון */
  }
}

function uid(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  );
}

export async function listReports(filter?: {
  status?: ReportStatus;
  entrance?: string;
  reporterToken?: string;
}): Promise<Report[]> {
  const db = await load();
  let items = [...db.reports];
  if (filter?.status) items = items.filter((r) => r.status === filter.status);
  if (filter?.entrance) items = items.filter((r) => r.entrance === filter.entrance);
  if (filter?.reporterToken)
    items = items.filter((r) => r.reporterToken === filter.reporterToken);
  // החדשות למעלה
  return items.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getReport(id: string): Promise<Report | undefined> {
  const db = await load();
  return db.reports.find((r) => r.id === id);
}

export async function createReport(input: NewReportInput): Promise<Report> {
  const db = await load();
  const now = Date.now();
  db.lastRef += 1;

  const firstMessage: ReportMessage = {
    id: uid(),
    author: 'resident',
    authorName: input.reporterName,
    text: input.description,
    createdAt: now,
  };

  const report: Report = {
    id: uid(),
    ref: db.lastRef,
    categoryId: input.categoryId,
    title: input.title,
    description: input.description,
    entrance: input.entrance,
    apartment: input.apartment,
    reporterName: input.reporterName,
    reporterPhone: input.reporterPhone,
    reporterEmail: input.reporterEmail,
    reporterToken: input.reporterToken,
    priority: input.priority,
    status: 'open',
    messages: [firstMessage],
    createdAt: now,
    updatedAt: now,
  };

  db.reports.push(report);
  await persist(db);
  return report;
}

export async function updateReport(
  id: string,
  changes: { status?: ReportStatus; message?: { author: 'committee' | 'resident'; authorName: string; text: string } },
): Promise<Report | undefined> {
  const db = await load();
  const report = db.reports.find((r) => r.id === id);
  if (!report) return undefined;

  if (changes.status) report.status = changes.status;
  if (changes.message && changes.message.text.trim()) {
    report.messages.push({
      id: uid(),
      author: changes.message.author,
      authorName: changes.message.authorName,
      text: changes.message.text.trim(),
      createdAt: Date.now(),
    });
  }
  report.updatedAt = Date.now();
  await persist(db);
  return report;
}
