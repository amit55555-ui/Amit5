// ===== שכבת נתונים בצד הלקוח =====
// שני מצבים:
//  1) מצב רגיל – מדבר עם ה-API (מחסן השרת + שליחת מיילים).
//  2) מצב דמו (NEXT_PUBLIC_DEMO_MODE=1) – הכול נשמר ב-localStorage בדפדפן,
//     בלי שרת. מתאים למשחק ובדיקה: אותו דפדפן משמש גם כדייר וגם כוועד.
// גם במצב רגיל, אם ה-API אינו זמין – נופלים ל-localStorage.

'use client';

import { NewReportInput, Report, ReportStatus } from '@/types';

const DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === '1';
const LS_REPORTS = 'building.reports.v1';
const LS_TOKEN = 'building.token.v1';

// ----- מזהה דייר אנונימי (מאפשר "הפניות שלי" בלי התחברות) -----
export function getResidentToken(): string {
  if (typeof window === 'undefined') return '';
  let t = localStorage.getItem(LS_TOKEN);
  if (!t) {
    t = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(LS_TOKEN, t);
  }
  return t;
}

// ----- לוגיקת localStorage (מצב דמו / נפילה) -----
function lsLoad(): Report[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(LS_REPORTS) || '[]') as Report[];
  } catch {
    return [];
  }
}
function lsSave(reports: Report[]) {
  localStorage.setItem(LS_REPORTS, JSON.stringify(reports));
}

function lsList(params?: { status?: ReportStatus; entrance?: string; token?: string }): Report[] {
  let items = lsLoad();
  if (params?.status) items = items.filter((r) => r.status === params.status);
  if (params?.entrance) items = items.filter((r) => r.entrance === params.entrance);
  if (params?.token) items = items.filter((r) => r.reporterToken === params.token);
  return items.sort((a, b) => b.createdAt - a.createdAt);
}

function lsCreate(input: NewReportInput): Report {
  const now = Date.now();
  const reports = lsLoad();
  const nextRef = Math.max(100, ...reports.map((r) => r.ref)) + 1;
  const report: Report = {
    id: now.toString(36) + Math.random().toString(36).slice(2, 8),
    ref: nextRef,
    ...input,
    status: 'open',
    messages: [
      {
        id: 'm' + now.toString(36),
        author: 'resident',
        authorName: input.reporterName,
        text: input.description,
        createdAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
  reports.push(report);
  lsSave(reports);
  return report;
}

function lsUpdate(
  id: string,
  changes: {
    status?: ReportStatus;
    message?: { author: 'committee' | 'resident'; authorName: string; text: string };
  },
): Report | null {
  const reports = lsLoad();
  const report = reports.find((r) => r.id === id);
  if (!report) return null;
  if (changes.status) report.status = changes.status;
  if (changes.message && changes.message.text.trim()) {
    report.messages.push({
      id: 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      author: changes.message.author,
      authorName: changes.message.authorName,
      text: changes.message.text.trim(),
      createdAt: Date.now(),
    });
  }
  report.updatedAt = Date.now();
  lsSave(reports);
  return report;
}

// ----- API -----
export async function fetchReports(params?: {
  status?: ReportStatus;
  entrance?: string;
  token?: string;
  passcode?: string;
}): Promise<Report[]> {
  if (DEMO) return lsList(params);
  try {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.entrance) qs.set('entrance', params.entrance);
    if (params?.token) qs.set('token', params.token);
    const headers: Record<string, string> = {};
    if (params?.passcode) headers['x-committee-passcode'] = params.passcode;
    const res = await fetch(`/api/reports?${qs.toString()}`, { headers });
    if (res.ok) {
      const data = await res.json();
      if (data.configured) return data.reports as Report[];
    }
  } catch {
    /* נפילה לדמו */
  }
  return lsList(params);
}

export async function createReport(input: NewReportInput): Promise<Report> {
  if (DEMO) return lsCreate(input);
  try {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.configured) return data.report as Report;
    }
  } catch {
    /* נפילה לדמו */
  }
  return lsCreate(input);
}

export async function updateReport(
  id: string,
  changes: {
    status?: ReportStatus;
    message?: { author: 'committee' | 'resident'; authorName: string; text: string };
    passcode?: string;
  },
): Promise<Report | null> {
  if (DEMO) return lsUpdate(id, changes);
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (changes.passcode) headers['x-committee-passcode'] = changes.passcode;
    const res = await fetch(`/api/reports/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: changes.status, message: changes.message }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.configured) return data.report as Report;
    }
  } catch {
    /* נפילה לדמו */
  }
  return lsUpdate(id, changes);
}

// בדיקת קוד גישה של הוועד
export async function verifyPasscode(passcode: string): Promise<boolean> {
  const demoCode = process.env.NEXT_PUBLIC_DEMO_PASSCODE || '1234';
  if (DEMO) return passcode === demoCode;
  try {
    const res = await fetch('/api/committee/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.configured) return Boolean(data.ok);
    }
  } catch {
    /* נפילה לדמו */
  }
  return passcode === demoCode;
}
