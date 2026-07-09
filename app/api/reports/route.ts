import { NextRequest, NextResponse } from 'next/server';
import { NewReportInput, ReportStatus } from '@/types';
import { createReport, listReports } from '@/lib/store';
import { notifyCommitteeNewReport } from '@/lib/mailer';
import { isCommittee } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/reports
//  - עם ?token=...  → הפניות של אותו דייר (ללא צורך בקוד ועד)
//  - אחרת           → כל הפניות (דורש קוד ועד)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token') || undefined;
  const status = (searchParams.get('status') as ReportStatus) || undefined;
  const entrance = searchParams.get('entrance') || undefined;

  if (token) {
    const reports = await listReports({ reporterToken: token });
    return NextResponse.json({ configured: true, reports });
  }

  // היקף ועד – דורש קוד גישה
  if (!isCommittee(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const reports = await listReports({ status, entrance });
  return NextResponse.json({ configured: true, reports });
}

// POST /api/reports – פנייה חדשה (כל דייר)
export async function POST(req: NextRequest) {
  let input: NewReportInput;
  try {
    input = (await req.json()) as NewReportInput;
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  if (
    !input.categoryId ||
    !input.title ||
    !input.description ||
    !input.entrance ||
    !input.reporterName ||
    !input.reporterPhone
  ) {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 });
  }

  const report = await createReport(input);
  // מייל לוועד (לא חוסם את התגובה ללקוח)
  notifyCommitteeNewReport(report).catch(() => {});

  return NextResponse.json({ configured: true, report });
}
