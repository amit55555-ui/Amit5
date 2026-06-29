// ===== שכבת נתונים בצד הלקוח =====
// מדברת עם ה-API (מחסן השרת). אם השרת אינו זמין – נופלת ל-localStorage
// כדי שמצב הדמו ימשיך לעבוד גם בלי שרת.

'use client';

import { NewReportInput, Report, ReportStatus } from '@/types';

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

// ----- נפילה ל-localStorage -----
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
let lsRef = 100;

// ----- API -----
export async function fetchReports(params?: {
  status?: ReportStatus;
  entrance?: string;
  token?: string;
  passcode?: string;
}): Promise<Report[]> {
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
  // דמו: סינון מקומי
  let items = lsLoad();
  if (params?.status) items = items.filter((r) => r.status === params.status);
  if (params?.entrance) items = items.filter((r) => r.entrance === params.entrance);
  if (params?.token) items = items.filter((r) => r.reporterToken === params.token);
  return items.sort((a, b) => b.createdAt - a.createdAt);
}

export async function createReport(input: NewReportInput): Promise<Report> {
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
  // דמו
  const now = Date.now();
  const reports = lsLoad();
  lsRef = Math.max(lsRef, ...reports.map((r) => r.ref), 100) + 1;
  const report: Report = {
    id: now.toString(36) + Math.random().toString(36).slice(2, 8),
    ref: lsRef,
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

export async function updateReport(
  id: string,
  changes: {
    status?: ReportStatus;
    message?: { author: 'committee' | 'resident'; authorName: string; text: string };
    passcode?: string;
  },
): Promise<Report | null> {
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
  // דמו
  const reports = lsLoad();
  const report = reports.find((r) => r.id === id);
  if (!report) return null;
  if (changes.status) report.status = changes.status;
  if (changes.message && changes.message.text.trim()) {
    report.messages.push({
      id: 'm' + Date.now().toString(36),
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

// בדיקת קוד גישה של הוועד מול השרת (אם מוגדר)
export async function verifyPasscode(passcode: string): Promise<boolean> {
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
  // דמו: קוד ברירת מחדל
  return passcode === (process.env.NEXT_PUBLIC_DEMO_PASSCODE || '1234');
}
