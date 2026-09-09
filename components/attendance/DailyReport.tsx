'use client';

import { useState } from 'react';
import { AttendanceEntry } from '@/types';
import {
  dateKey, dateKeyFromTs, fmtDayLabel, fmtDuration,
  fromDateTimeInputs, toTimeInputValue,
} from '@/lib/attendance-format';

export default function DailyReport({
  entries,
  currentDay,
  onPrevDay,
  onNextDay,
  isAdmin,
  busy,
  onAdminSave,
  onAdminDelete,
  onAdminAdd,
}: {
  entries: AttendanceEntry[];
  currentDay: Date;
  onPrevDay: () => void;
  onNextDay: () => void;
  isAdmin: boolean;
  busy: boolean;
  onAdminSave: (id: string, changes: { clockIn?: number; clockOut?: number | null; note?: string }) => Promise<void>;
  onAdminDelete: (id: string) => Promise<void>;
  onAdminAdd: (input: { clockIn: number; clockOut: number | null; note?: string }) => Promise<void>;
}) {
  const key = dateKey(currentDay);
  const dayEntries = entries
    .filter((e) => dateKeyFromTs(e.clockIn) === key)
    .sort((a, b) => a.clockIn - b.clockIn);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editIn, setEditIn] = useState('');
  const [editOut, setEditOut] = useState('');
  const [editNote, setEditNote] = useState('');

  const [addingOpen, setAddingOpen] = useState(false);
  const [addIn, setAddIn] = useState('09:00');
  const [addOut, setAddOut] = useState('17:00');
  const [addNote, setAddNote] = useState('');
  const [formError, setFormError] = useState('');

  function startEdit(e: AttendanceEntry) {
    setEditingId(e.id);
    setEditIn(toTimeInputValue(e.clockIn));
    setEditOut(e.clockOut != null ? toTimeInputValue(e.clockOut) : '');
    setEditNote(e.note);
    setFormError('');
  }

  async function saveEdit(e: AttendanceEntry) {
    const newIn = fromDateTimeInputs(key, editIn);
    const newOut = editOut ? fromDateTimeInputs(key, editOut) : null;
    if (newIn == null) {
      setFormError('נא לבחור שעת כניסה תקינה');
      return;
    }
    if (newOut != null && newOut <= newIn) {
      setFormError('שעת היציאה חייבת להיות אחרי שעת הכניסה');
      return;
    }
    setFormError('');
    await onAdminSave(e.id, { clockIn: newIn, clockOut: newOut, note: editNote.trim() });
    setEditingId(null);
  }

  async function submitAdd() {
    const clockIn = fromDateTimeInputs(key, addIn);
    const clockOut = addOut ? fromDateTimeInputs(key, addOut) : null;
    if (clockIn == null) {
      setFormError('נא לבחור שעת כניסה תקינה');
      return;
    }
    if (clockOut != null && clockOut <= clockIn) {
      setFormError('שעת היציאה חייבת להיות אחרי שעת הכניסה');
      return;
    }
    setFormError('');
    await onAdminAdd({ clockIn, clockOut, note: addNote.trim() });
    setAddingOpen(false);
    setAddNote('');
  }

  const totalMs = dayEntries.reduce((sum, e) => (e.clockOut != null ? sum + (e.clockOut - e.clockIn) : sum), 0);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <button className="btn-ghost px-3 py-2 text-sm" onClick={onPrevDay}>‹ יום קודם</button>
        <span className="flex-1 text-center text-sm font-bold">{fmtDayLabel(currentDay)}</span>
        <button className="btn-ghost px-3 py-2 text-sm" onClick={onNextDay}>יום הבא ›</button>
      </div>

      {isAdmin && (
        <div className="mb-4">
          {!addingOpen ? (
            <button
              className="w-full rounded-xl border border-dashed border-admin/50 px-4 py-2.5 text-center text-sm text-admin hover:bg-admin-light"
              onClick={() => { setAddingOpen(true); setFormError(''); }}
            >
              + הוספת רשומה ידנית ליום זה
            </button>
          ) : (
            <div className="rounded-xl border border-admin/50 bg-admin-light/40 p-3 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-xs text-muted">כניסה</label>
                <input type="time" className="field w-auto py-2 font-mono" value={addIn} onChange={(e) => setAddIn(e.target.value)} />
                <label className="text-xs text-muted">יציאה (אופציונלי)</label>
                <input type="time" className="field w-auto py-2 font-mono" value={addOut} onChange={(e) => setAddOut(e.target.value)} />
              </div>
              <input
                className="field"
                placeholder="הערה (אופציונלי)"
                value={addNote}
                onChange={(e) => setAddNote(e.target.value)}
              />
              <div className="flex gap-2">
                <button className="btn bg-admin text-white hover:bg-violet-800 px-4 py-2 text-sm" disabled={busy} onClick={submitAdd}>
                  שמירה
                </button>
                <button className="btn-ghost px-4 py-2 text-sm" onClick={() => { setAddingOpen(false); setFormError(''); }}>
                  ביטול
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {formError && !editingId && <p className="mb-3 text-sm text-open">{formError}</p>}

      {dayEntries.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted">אין רשומות ליום זה</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-right text-xs uppercase tracking-wide text-muted">
                <th className="pb-2 font-semibold">כניסה</th>
                <th className="pb-2 font-semibold">יציאה</th>
                <th className="pb-2 font-semibold">משך</th>
                {isAdmin && <th className="pb-2 font-semibold"></th>}
              </tr>
            </thead>
            <tbody>
              {dayEntries.map((e) => {
                const isEditing = editingId === e.id;
                const dur = e.clockOut != null ? e.clockOut - e.clockIn : 0;
                return (
                  <tr
                    key={e.id}
                    className={`border-t border-line ${e.editedByAdmin ? 'bg-admin-light/50 border-r-4 border-r-admin' : ''}`}
                  >
                    {isEditing ? (
                      <>
                        <td className="py-2">
                          <input type="time" className="field w-24 py-1.5 font-mono" value={editIn} onChange={(ev) => setEditIn(ev.target.value)} />
                        </td>
                        <td className="py-2">
                          <input type="time" className="field w-24 py-1.5 font-mono" value={editOut} onChange={(ev) => setEditOut(ev.target.value)} />
                        </td>
                        <td className="py-2 font-mono text-center">{fmtDuration(dur)}</td>
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            <input
                              className="field py-1.5 text-xs"
                              placeholder="הערה"
                              value={editNote}
                              onChange={(ev) => setEditNote(ev.target.value)}
                            />
                            <button className="text-admin text-xs font-semibold" disabled={busy} onClick={() => saveEdit(e)}>שמירה</button>
                            <button className="text-muted text-xs" onClick={() => setEditingId(null)}>ביטול</button>
                          </div>
                          {formError && <p className="mt-1 text-xs text-open">{formError}</p>}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2.5 font-mono">
                          {toTimeInputValue(e.clockIn)}
                          {e.note && <span className="block font-sans text-xs text-muted">{e.note}</span>}
                          {e.editedByAdmin && (
                            <span className="mt-0.5 inline-block rounded-full bg-admin px-2 py-0.5 font-sans text-[10px] font-bold text-white">
                              נערך ע&quot;י מנהל
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 font-mono text-center">
                          {e.clockOut != null ? toTimeInputValue(e.clockOut) : 'פתוח'}
                        </td>
                        <td className="py-2.5 font-mono text-center">
                          {e.clockOut != null ? fmtDuration(dur) : '—'}
                        </td>
                        {isAdmin && (
                          <td className="py-2.5 text-left">
                            <div className="flex justify-end gap-2 text-xs">
                              <button className="font-semibold text-admin hover:underline" onClick={() => startEdit(e)}>ערוך</button>
                              <button
                                className="font-semibold text-open hover:underline"
                                onClick={() => confirm('למחוק רשומה זו?') && onAdminDelete(e.id)}
                              >
                                מחק
                              </button>
                            </div>
                          </td>
                        )}
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="mt-4 flex items-baseline justify-between border-t border-dashed border-line pt-4 font-bold">
            <span>סה&quot;כ שעות ליום</span>
            <span className="font-mono text-brand-dark">{fmtDuration(totalMs)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
