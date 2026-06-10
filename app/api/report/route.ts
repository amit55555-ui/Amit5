import { NextRequest, NextResponse } from 'next/server';
import type { VehicleReport } from '@/types';
import { VEHICLE_LABELS, DAMAGE_LABELS } from '@/types';
import { getMunicipalityById } from '@/data/municipalities';

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

function buildEmailHtml(report: VehicleReport, days: number): string {
  const scrappingNote = days >= 60
    ? `<p style="background:#fef3c7;border:1px solid #fcd34d;padding:10px 14px;border-radius:8px;margin:12px 0;font-size:14px;">
        ⚠️ <strong>הרכב דווח כנטוש לפני ${days} ימים</strong> — עשוי להיות זכאי להסרה כגרוטה על-פי נהלי הרשות המקומית.
       </p>`
    : '';

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head><meta charset="UTF-8"/></head>
<body style="font-family:Arial,sans-serif;direction:rtl;text-align:right;background:#f8fafc;padding:24px;">
<div style="max-width:580px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;border:1px solid #e2e8f0;">
  <h2 style="color:#1e40af;margin:0 0 4px;">דיווח רכב נטוש</h2>
  <p style="color:#64748b;font-size:14px;margin:0 0 20px;">${report.municipalityName}</p>

  ${scrappingNote}

  <table style="width:100%;border-collapse:collapse;font-size:14px;">
    <tr style="background:#f1f5f9;">
      <td style="padding:8px 12px;font-weight:bold;width:35%;">כתובת</td>
      <td style="padding:8px 12px;">${report.street} ${report.houseNumber}${report.neighborhood ? ` — ${report.neighborhood}` : ''}</td>
    </tr>
    <tr>
      <td style="padding:8px 12px;font-weight:bold;">סוג רכב</td>
      <td style="padding:8px 12px;">${VEHICLE_LABELS[report.vehicleType]}</td>
    </tr>
    ${report.vehicleColor ? `<tr style="background:#f1f5f9;">
      <td style="padding:8px 12px;font-weight:bold;">צבע</td>
      <td style="padding:8px 12px;">${report.vehicleColor}</td>
    </tr>` : ''}
    ${report.licensePlate ? `<tr>
      <td style="padding:8px 12px;font-weight:bold;">לוחית רישוי</td>
      <td style="padding:8px 12px;font-family:monospace;">${report.licensePlate}</td>
    </tr>` : ''}
    <tr style="background:#f1f5f9;">
      <td style="padding:8px 12px;font-weight:bold;">נראה לראשונה</td>
      <td style="padding:8px 12px;">${new Date(report.firstSeen).toLocaleDateString('he-IL')} (לפני ${days} ימים)</td>
    </tr>
    <tr>
      <td style="padding:8px 12px;font-weight:bold;">מצב</td>
      <td style="padding:8px 12px;">${DAMAGE_LABELS[report.damageLevel]}</td>
    </tr>
    <tr style="background:#f1f5f9;">
      <td style="padding:8px 12px;font-weight:bold;">חוסם מעבר</td>
      <td style="padding:8px 12px;">${report.isBlocking ? '✅ כן' : 'לא'}</td>
    </tr>
    ${report.description ? `<tr>
      <td style="padding:8px 12px;font-weight:bold;">הערות</td>
      <td style="padding:8px 12px;">${report.description}</td>
    </tr>` : ''}
  </table>

  ${report.reporterName || report.reporterPhone || report.reporterEmail ? `
  <div style="margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;">
    <p style="font-weight:bold;color:#374151;font-size:13px;margin:0 0 8px;">פרטי מדווח</p>
    <p style="font-size:13px;color:#64748b;margin:0;">
      ${[report.reporterName, report.reporterPhone, report.reporterEmail].filter(Boolean).join(' | ')}
    </p>
  </div>` : ''}

  <p style="margin-top:24px;font-size:11px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:12px;">
    נשלח דרך אפליקציית דיווח רכבים נטושים
  </p>
</div>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  let body: { report: VehicleReport };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'בקשה לא תקינה' }, { status: 400 });
  }

  const { report } = body;
  if (!report?.municipalityId || !report?.street || !report?.vehicleType) {
    return NextResponse.json({ error: 'חסרים שדות חובה' }, { status: 400 });
  }

  const municipality = getMunicipalityById(report.municipalityId);
  const emailChannel = municipality?.channels.find(c => c.type === 'email');

  if (!emailChannel) {
    return NextResponse.json(
      { error: 'עירייה זו אינה תומכת בדיווח במייל' },
      { status: 400 }
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'שרות המייל אינו מוגדר. אנא פנה למנהל המערכת.' },
      { status: 503 }
    );
  }

  const days    = daysSince(report.firstSeen);
  const subject = `דיווח רכב נטוש – ${report.municipalityName} – ${report.street} ${report.houseNumber}`.trim();

  const resendRes = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from:     process.env.RESEND_FROM_EMAIL ?? 'noreply@resend.dev',
      to:       [emailChannel.value],
      reply_to: report.reporterEmail || undefined,
      subject,
      html:     buildEmailHtml(report, days),
    }),
  });

  if (!resendRes.ok) {
    const err = await resendRes.text();
    console.error('Resend error:', err);
    return NextResponse.json({ error: 'שגיאה בשליחת המייל. נסה שוב.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
