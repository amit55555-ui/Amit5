'use client';

import { useEffect, useState } from 'react';
import { AttendanceEntry } from '@/types';
import { MONTHS, WEEKDAYS, dateKeyFromTs, fmtTime, fromDateTimeInputs, toDateInputValue } from '@/lib/attendance-format';

function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const pad2 = (n: number) => String(n).padStart(2, '0');
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-line pb-4 mb-4">
      <span className="font-mono text-3xl font-semibold tracking-wide text-ink" dir="ltr">
        {pad2(now.getHours())}:{pad2(now.getMinutes())}:{pad2(now.getSeconds())}
      </span>
      <span className="text-sm text-muted">
        {WEEKDAYS[now.getDay()]}, {now.getDate()} ב{MONTHS[now.getMonth()]}
      </span>
    </div>
  );
}

export default function ClockCard({
  openEntry,
  busy,
  onClockIn,
  onClockOut,
  onManualClose,
}: {
  openEntry: AttendanceEntry | undefined;
  busy: boolean;
  onClockIn: (note: string) => Promise<void>;
  onClockOut: (note: string) => Promise<void>;
  onManualClose: (entry: AttendanceEntry, clockOutTs: number) => Promise<void>;
}) {
  const [note, setNote] = useState('');
  const [closeDate, setCloseDate] = useState('');
  const [closeTime, setCloseTime] = useState('18:00');
  const [closeError, setCloseError] = useState('');

  const todayKey = dateKeyFromTs(Date.now());
  const isStale = Boolean(openEntry) && dateKeyFromTs(openEntry!.clockIn) !== todayKey;

  useEffect(() => {
    if (openEntry) setCloseDate(toDateInputValue(openEntry.clockIn));
  }, [openEntry?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleManualClose() {
    if (!openEntry) return;
    const ts = fromDateTimeInputs(closeDate, closeTime);
    if (ts == null) {
      setCloseError('נא לבחור תאריך ושעה');
      return;
    }
    if (ts <= openEntry.clockIn) {
      setCloseError('שעת היציאה חייבת להיות אחרי שעת הכניסה');
      return;
    }
    setCloseError('');
    await onManualClose(openEntry, ts);
  }

  return (
    <div className="card p-5">
      <LiveClock />

      {isStale && openEntry && (
        <div className="mb-4 rounded-xl border border-progress/40 bg-amber-50 p-3 text-sm text-progress">
          <p className="mb-2">
            נראה שנשארת &quot;בעבודה&quot; מתאריך {dateKeyFromTs(openEntry.clockIn)} ולא נסגרה יציאה. אפשר לסגור ידנית:
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              className="field w-auto py-2 font-mono"
              value={closeDate}
              onChange={(e) => setCloseDate(e.target.value)}
            />
            <input
              type="time"
              className="field w-auto py-2 font-mono"
              value={closeTime}
              onChange={(e) => setCloseTime(e.target.value)}
            />
            <button className="btn-primary px-3 py-2 text-sm" disabled={busy} onClick={handleManualClose}>
              סגור יציאה ידנית
            </button>
          </div>
          {closeError && <p className="mt-2 text-open">{closeError}</p>}
        </div>
      )}

      <div className="mb-4 flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${
            openEntry ? 'border-brand bg-brand-light/30 text-brand-dark' : 'border-line bg-cloud text-muted'
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${openEntry ? 'bg-brand' : 'bg-muted'}`} />
          {openEntry ? (
            <span>
              בעבודה מ־<span className="font-mono" dir="ltr">{fmtTime(openEntry.clockIn)}</span>
            </span>
          ) : (
            'לא נוכח כרגע'
          )}
        </span>
      </div>

      <div className="flex gap-3">
        <button
          className="btn-primary flex-1 py-5 text-lg"
          disabled={busy || Boolean(openEntry)}
          onClick={async () => {
            await onClockIn(note.trim());
            setNote('');
          }}
        >
          כניסה
        </button>
        <button
          className="btn flex-1 bg-open py-5 text-lg text-white hover:bg-red-700 disabled:opacity-50"
          disabled={busy || !openEntry}
          onClick={async () => {
            await onClockOut(note.trim());
            setNote('');
          }}
        >
          יציאה
        </button>
      </div>

      <div className="mt-4">
        <label className="label" htmlFor="attendance-note">הערה (אופציונלי)</label>
        <input
          id="attendance-note"
          className="field"
          placeholder="לדוגמה: פגישה עם לקוח"
          maxLength={200}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
    </div>
  );
}
