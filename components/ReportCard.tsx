'use client';

import { useState } from 'react';
import { Report, ReportStatus, STATUS_LABELS } from '@/types';
import { categoryById } from '@/data/building';
import { timeAgo } from '@/lib/format';
import { updateReport } from '@/lib/client';
import StatusBadge from './StatusBadge';
import Thread from './Thread';

const STATUS_ORDER: ReportStatus[] = ['open', 'in_progress', 'closed'];

export default function ReportCard({
  report,
  role,
  authorName,
  passcode,
  onUpdated,
  defaultOpen = false,
}: {
  report: Report;
  role: 'resident' | 'committee';
  authorName: string;
  passcode?: string;
  onUpdated: (r: Report) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const cat = categoryById(report.categoryId);

  async function changeStatus(status: ReportStatus) {
    if (status === report.status) return;
    const updated = await updateReport(report.id, { status, passcode });
    if (updated) onUpdated(updated);
  }

  return (
    <div className="card overflow-hidden">
      <button
        className="flex w-full items-start gap-3 p-4 text-right"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="text-2xl leading-none">{cat.emoji}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">#{report.ref}</span>
            {report.priority === 'urgent' && (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-open">
                🔴 דחוף
              </span>
            )}
            <StatusBadge status={report.status} />
          </div>
          <div className="mt-1 truncate font-semibold">{report.title}</div>
          <div className="mt-0.5 text-[13px] text-muted">
            {cat.label} · כניסה {report.entrance}
            {report.apartment ? ` · דירה ${report.apartment}` : ''} · {timeAgo(report.createdAt)}
          </div>
        </div>
        <div className={`mt-1 text-muted transition ${open ? 'rotate-180' : ''}`}>▾</div>
      </button>

      {open && (
        <div className="border-t border-line px-4 pb-4 pt-3">
          {role === 'committee' && (
            <div className="mb-3 rounded-xl bg-cloud p-3">
              <div className="mb-2 text-xs font-semibold text-muted">שינוי סטטוס</div>
              <div className="flex gap-2">
                {STATUS_ORDER.map((s) => (
                  <button
                    key={s}
                    onClick={() => changeStatus(s)}
                    className={`flex-1 rounded-lg border px-2 py-2 text-sm font-semibold transition ${
                      report.status === s
                        ? 'border-brand bg-brand text-white'
                        : 'border-line bg-white text-ink hover:bg-cloud'
                    }`}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
              {report.reporterPhone && (
                <div className="mt-3 text-[13px] text-muted">
                  ☎️ ליצירת קשר: {report.reporterName} ·{' '}
                  <a className="text-brand underline" href={`tel:${report.reporterPhone}`}>
                    {report.reporterPhone}
                  </a>
                  {report.reporterEmail ? ` · ${report.reporterEmail}` : ''}
                </div>
              )}
            </div>
          )}

          <Thread
            report={report}
            role={role}
            authorName={authorName}
            passcode={passcode}
            onUpdated={onUpdated}
          />
        </div>
      )}
    </div>
  );
}
