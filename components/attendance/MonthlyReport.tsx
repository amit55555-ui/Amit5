'use client';

import { AttendanceEntry } from '@/types';
import { MONTHS, WEEKDAYS, dateKeyFromTs, fmtDuration, fmtHoursDecimal } from '@/lib/attendance-format';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function monthTotals(entries: AttendanceEntry[], currentMonth: Date) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totals: Record<number, number> = {};
  for (let d = 1; d <= daysInMonth; d++) totals[d] = 0;

  entries.forEach((e) => {
    if (e.clockOut == null) return;
    const d = new Date(e.clockIn);
    if (d.getFullYear() === year && d.getMonth() === month) {
      totals[d.getDate()] += e.clockOut - e.clockIn;
    }
  });

  return { totals, daysInMonth, year, month };
}

export default function MonthlyReport({
  entries,
  currentMonth,
  onPrevMonth,
  onNextMonth,
  onSelectDay,
}: {
  entries: AttendanceEntry[];
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDay: (d: Date) => void;
}) {
  const info = monthTotals(entries, currentMonth);
  const hasData = Object.values(info.totals).some((ms) => ms > 0);
  const todayKey = dateKeyFromTs(Date.now());
  const totalMonthMs = Object.values(info.totals).reduce((a, b) => a + b, 0);

  function exportCsv() {
    const rows: string[][] = [['תאריך', 'יום בשבוע', 'סה"כ שעות (עשרוני)', 'סה"כ שעות']];
    for (let d = 1; d <= info.daysInMonth; d++) {
      const ms = info.totals[d];
      if (ms === 0) continue;
      const dateObj = new Date(info.year, info.month, d);
      rows.push([
        `${info.year}-${pad2(info.month + 1)}-${pad2(d)}`,
        WEEKDAYS[dateObj.getDay()],
        fmtHoursDecimal(ms),
        fmtDuration(ms),
      ]);
    }
    rows.push(['', 'סה"כ חודשי', fmtHoursDecimal(totalMonthMs), fmtDuration(totalMonthMs)]);

    const csv = '﻿' + rows
      .map((r) => r.map((cell) => (/[,"]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell)).join(','))
      .join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `דוח-נוכחות-${info.year}-${pad2(info.month + 1)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <button className="btn-ghost px-3 py-2 text-sm" onClick={onPrevMonth}>‹ חודש קודם</button>
        <span className="flex-1 text-center text-sm font-bold">
          {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </span>
        <button className="btn-ghost px-3 py-2 text-sm" onClick={onNextMonth}>חודש הבא ›</button>
      </div>

      <div className="mb-4 flex justify-end">
        <button className="btn-primary px-4 py-2 text-sm" onClick={exportCsv}>ייצוא CSV</button>
      </div>

      {!hasData ? (
        <div className="py-8 text-center text-sm text-muted">אין נתונים לחודש זה</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-right text-xs uppercase tracking-wide text-muted">
                <th className="pb-2 font-semibold">תאריך</th>
                <th className="pb-2 font-semibold">יום</th>
                <th className="pb-2 font-semibold">סה&quot;כ שעות</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: info.daysInMonth }, (_, i) => i + 1)
                .filter((d) => info.totals[d] > 0)
                .map((d) => {
                  const dateObj = new Date(info.year, info.month, d);
                  const key = dateKeyFromTs(dateObj.getTime());
                  return (
                    <tr
                      key={d}
                      className={`cursor-pointer border-t border-line hover:bg-cloud ${key === todayKey ? 'bg-brand-light/20' : ''}`}
                      onClick={() => onSelectDay(dateObj)}
                    >
                      <td className="py-2 font-mono">{d}/{info.month + 1}</td>
                      <td className="py-2">{WEEKDAYS[dateObj.getDay()]}</td>
                      <td className="py-2 font-mono">{fmtDuration(info.totals[d])}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
          <div className="mt-4 flex items-baseline justify-between border-t border-dashed border-line pt-4 font-bold">
            <span>סה&quot;כ שעות לחודש</span>
            <span className="font-mono text-brand-dark">{fmtDuration(totalMonthMs)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
