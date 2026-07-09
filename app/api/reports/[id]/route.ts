import { NextRequest, NextResponse } from 'next/server';
import { ReportStatus } from '@/types';
import { getReport, updateReport } from '@/lib/store';
import { notifyResident, notifyCommitteeReply } from '@/lib/mailer';
import { isCommittee } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface PatchBody {
  status?: ReportStatus;
  message?: { author: 'committee' | 'resident'; authorName: string; text: string };
}

// PATCH /api/reports/:id – עדכון סטטוס ו/או הוספת הודעה לשרשור
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  const existing = await getReport(id);
  if (!existing) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const committee = isCommittee(req);
  const fromCommittee = body.message?.author === 'committee';
  const statusChange = Boolean(body.status);

  // פעולות ועד (שינוי סטטוס או הודעה בשם הוועד) דורשות קוד גישה.
  // דייר רשאי להוסיף הודעה משלו לשרשור (author=resident).
  if ((statusChange || fromCommittee) && !committee) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const statusChanged = statusChange && body.status !== existing.status;
  const report = await updateReport(id, { status: body.status, message: body.message });
  if (!report) return NextResponse.json({ error: 'not found' }, { status: 404 });

  // אם הוועד הגיב או שינה סטטוס – שלח מייל לדייר (לכתובת שהזין בעת הדיווח)
  if (committee && (fromCommittee || statusChanged)) {
    notifyResident(report, {
      replyText: fromCommittee ? body.message?.text : undefined,
      statusChanged,
    }).catch(() => {});
  }

  // אם דייר הגיב בשרשור – שלח מייל לוועד
  if (!committee && body.message?.author === 'resident' && body.message.text) {
    notifyCommitteeReply(report, body.message.text).catch(() => {});
  }

  return NextResponse.json({ configured: true, report });
}
