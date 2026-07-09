// ===== שליחת מיילים על פניות (צד שרת) =====
// - בעת פנייה חדשה: מייל לוועד (עם Reply-To של הדייר, כך שאפשר להשיב ישירות).
// - בעת תגובת הוועד / שינוי סטטוס: מייל לדייר.

import { Report, STATUS_LABELS } from '@/types';
import { categoryById, BUILDING_NAME } from '@/data/building';
import { COMMITTEE_EMAIL, getGmail, isMailConfigured } from '@/lib/google';

export { isMailConfigured };

// בונה הודעת RFC822 מקודדת ב-base64url (מה ש-Gmail API מצפה לו)
function encodeMessage(opts: {
  to: string;
  from?: string;
  replyTo?: string;
  subject: string;
  html: string;
}): string {
  const headers = [
    `To: ${opts.to}`,
    opts.replyTo ? `Reply-To: ${opts.replyTo}` : '',
    `Subject: =?UTF-8?B?${Buffer.from(opts.subject).toString('base64')}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
  ].filter(Boolean);

  const body = Buffer.from(opts.html).toString('base64');
  const raw = headers.join('\r\n') + '\r\n\r\n' + body;
  return Buffer.from(raw)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function send(opts: { to: string; replyTo?: string; subject: string; html: string }): Promise<void> {
  const gmail = getGmail();
  if (!gmail) return;
  try {
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodeMessage(opts) },
    });
  } catch (err) {
    console.error('gmail send error', err);
  }
}

function shell(title: string, inner: string): string {
  return `
  <div dir="rtl" style="font-family:Arial,Helvetica,sans-serif;background:#f1f5f9;padding:24px">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
      <div style="background:#0f766e;color:#fff;padding:18px 24px;font-size:18px;font-weight:bold">
        🏢 ${BUILDING_NAME}
      </div>
      <div style="padding:24px;color:#0f172a;font-size:15px;line-height:1.7">
        <h2 style="margin:0 0 12px;font-size:17px">${title}</h2>
        ${inner}
      </div>
      <div style="padding:14px 24px;background:#f8fafc;color:#64748b;font-size:12px">
        הודעה זו נשלחה ממערכת ניהול הבניין.
      </div>
    </div>
  </div>`;
}

function detailRows(report: Report): string {
  const cat = categoryById(report.categoryId);
  const rows: [string, string][] = [
    ['מספר פנייה', `#${report.ref}`],
    ['נושא', `${cat.emoji} ${cat.label} — ${report.title}`],
    ['כניסה', report.entrance],
    ['דירה', report.apartment || '—'],
    ['דחיפות', report.priority === 'urgent' ? '🔴 דחוף' : 'רגיל'],
    ['סטטוס', STATUS_LABELS[report.status]],
    ['מדווח/ת', report.reporterName],
    ['טלפון', report.reporterPhone || '—'],
  ];
  return rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 0;color:#64748b;width:110px">${k}</td><td style="padding:6px 0;font-weight:600">${v}</td></tr>`,
    )
    .join('');
}

// מייל לוועד בעת פנייה חדשה
export async function notifyCommitteeNewReport(report: Report): Promise<void> {
  if (!isMailConfigured()) return;
  const cat = categoryById(report.categoryId);
  const urgent = report.priority === 'urgent' ? ' 🔴 דחוף' : '';
  const html = shell(
    `פנייה חדשה #${report.ref}${urgent}`,
    `<table style="width:100%;border-collapse:collapse;font-size:14px">${detailRows(report)}</table>
     <div style="margin-top:16px;padding:14px;background:#f0fdfa;border-radius:10px;white-space:pre-wrap">${report.description}</div>
     <p style="margin-top:16px;color:#64748b;font-size:13px">אפשר להשיב ישירות למייל הזה — התשובה תגיע אל הדייר.</p>`,
  );
  await send({
    to: COMMITTEE_EMAIL,
    replyTo: report.reporterEmail || undefined,
    subject: `[פנייה #${report.ref}] ${cat.emoji} ${cat.label} — כניסה ${report.entrance}${urgent}`,
    html,
  });
}

// מייל לוועד בעת תגובת דייר בשרשור פנייה קיימת
export async function notifyCommitteeReply(report: Report, text: string): Promise<void> {
  if (!isMailConfigured() || !text.trim()) return;
  const cat = categoryById(report.categoryId);
  const html = shell(
    `תגובת דייר בפנייה #${report.ref} — ${cat.emoji} ${cat.label}`,
    `<table style="width:100%;border-collapse:collapse;font-size:14px">${detailRows(report)}</table>
     <div style="margin-top:16px;padding:14px;background:#f0fdfa;border-radius:10px;white-space:pre-wrap">${text}</div>
     <p style="margin-top:16px;color:#64748b;font-size:13px">אפשר להשיב ישירות למייל הזה — התשובה תגיע אל הדייר.</p>`,
  );
  await send({
    to: COMMITTEE_EMAIL,
    replyTo: report.reporterEmail || undefined,
    subject: `[פנייה #${report.ref}] תגובת דייר — ${cat.label} · כניסה ${report.entrance}`,
    html,
  });
}

// מייל לדייר בעת תגובת הוועד / שינוי סטטוס
export async function notifyResident(
  report: Report,
  opts: { replyText?: string; statusChanged?: boolean },
): Promise<void> {
  if (!isMailConfigured() || !report.reporterEmail) return;
  const cat = categoryById(report.categoryId);
  const parts: string[] = [];
  if (opts.statusChanged) {
    parts.push(
      `<p>סטטוס הפנייה עודכן ל־<b>${STATUS_LABELS[report.status]}</b>.</p>`,
    );
  }
  if (opts.replyText) {
    parts.push(
      `<div style="margin-top:8px;padding:14px;background:#f0fdfa;border-radius:10px;white-space:pre-wrap">${opts.replyText}</div>`,
    );
  }
  const html = shell(
    `עדכון בפנייה #${report.ref} — ${cat.emoji} ${cat.label}`,
    parts.join('') +
      `<p style="margin-top:16px;color:#64748b;font-size:13px">אפשר להשיב למייל הזה כדי להמשיך את ההתכתבות עם הוועד.</p>`,
  );
  await send({
    to: report.reporterEmail,
    replyTo: COMMITTEE_EMAIL,
    subject: `עדכון בפנייה #${report.ref} — ${cat.label}`,
    html,
  });
}
