'use client';

import { useState } from 'react';
import { Report } from '@/types';
import { updateReport } from '@/lib/client';
import { formatDateTime } from '@/lib/format';
import { BUILDING_NAME } from '@/data/building';

export default function Thread({
  report,
  role,
  authorName,
  passcode,
  onUpdated,
}: {
  report: Report;
  role: 'resident' | 'committee';
  authorName: string;
  passcode?: string;
  onUpdated: (r: Report) => void;
}) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  async function send() {
    const msg = text.trim();
    if (!msg) return;
    setSending(true);
    const updated = await updateReport(report.id, {
      message: { author: role, authorName: authorName || (role === 'committee' ? 'ועד הבית' : 'דייר'), text: msg },
      passcode,
    });
    setSending(false);
    if (updated) {
      setText('');
      onUpdated(updated);
      // התראה לדייר: פותח מייל מוכן עם התשובה, כדי שהדייר יידע שקיבל מענה
      if (role === 'committee' && report.reporterEmail) {
        const subject = `מענה לפנייה #${report.ref} · ${BUILDING_NAME}`;
        const body = `${msg}\n\n----------\nבמענה לפנייה #${report.ref}: ${report.title}\n${BUILDING_NAME}`;
        window.location.href = `mailto:${encodeURIComponent(report.reporterEmail)}?subject=${encodeURIComponent(
          subject,
        )}&body=${encodeURIComponent(body)}`;
      }
    }
  }

  return (
    <div className="mt-3">
      <div className="space-y-2">
        {report.messages.map((m) => {
          const mine = m.author === role;
          const isCommittee = m.author === 'committee';
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-start' : 'justify-end'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[14px] ${
                  isCommittee ? 'bg-brand text-white' : 'bg-cloud text-ink'
                }`}
              >
                <div className="mb-0.5 text-[11px] opacity-70">
                  {isCommittee ? '🛠️ ' : '👤 '}
                  {m.authorName} · {formatDateTime(m.createdAt)}
                </div>
                <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-end gap-2">
        <textarea
          className="field min-h-[44px] resize-y py-2.5"
          rows={1}
          placeholder={role === 'committee' ? 'תשובה לדייר…' : 'הוספת הודעה לוועד…'}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn-primary shrink-0 px-4 py-2.5" disabled={sending || !text.trim()} onClick={send}>
          {sending ? '...' : 'שליחה'}
        </button>
      </div>
      {role === 'committee' && report.reporterEmail && (
        <p className="mt-1.5 text-[11px] text-muted">
          📧 לאחר שליחה ייפתח מייל מוכן להתראת הדייר — שלחו אותו כדי שיֵדע שקיבל מענה.
        </p>
      )}
    </div>
  );
}
