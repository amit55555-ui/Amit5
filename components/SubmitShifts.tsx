'use client';
// הגשת משמרות של העובד לשבוע הבא
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/client';
import { addDays, DAYNAMES, deadlineText, markKey, shortDate, slotsForDay, weekdayOf, weekTitle } from '@/lib/calc';
import type { Avail, Mark, PublicSettings } from '@/lib/types';

type Data = { week: string; deadline: number; open: boolean; settings: PublicSettings; mine: Avail | null };

const OPTS: { v: Mark; label: string; cls: string }[] = [
  { v: 'pref', label: '★ מעדיף/ה', cls: 'pref' },
  { v: 'can', label: '✓ יכול/ה', cls: 'can' },
  { v: 'cant', label: '✕ לא יכול/ה', cls: 'cant' },
];

export function SubmitShifts({ toast }: { toast: (m: string) => void }) {
  const [data, setData] = useState<Data | null>(null);
  const [marks, setMarks] = useState<Record<string, Mark>>({});
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await api<Data>('/api/avail');
      setData(d); setMarks(d.mine?.marks || {}); setNote(d.mine?.note || ''); setDirty(false);
    } catch (e) { toast((e as Error).message); }
  }, [toast]);
  useEffect(() => { load(); }, [load]);

  if (!data) return <p className="muted">טוען…</p>;
  const st = data.settings;
  const days = Array.from({ length: 7 }, (_, i) => addDays(data.week, i)).filter((d) => slotsForDay(d, st).length);
  const allKeys = days.flatMap((d) => slotsForDay(d, st).map((s) => markKey(d, s.id)));
  const marked = allKeys.filter((k) => marks[k] === 'can' || marks[k] === 'pref').length;

  function set(k: string, v: Mark) {
    if (!data?.open) return;
    setMarks((m) => { const n = { ...m }; if (n[k] === v) delete n[k]; else n[k] = v; return n; });
    setDirty(true);
  }
  function setAll(v: Mark | null) {
    setMarks(() => (v ? Object.fromEntries(allKeys.map((k) => [k, v])) : {}));
    setDirty(true);
  }
  async function submit() {
    if (!data) return;
    setBusy(true);
    try {
      await api('/api/avail', 'PUT', { week: data.week, marks, note });
      toast(data.mine ? 'ההגשה עודכנה' : 'ההגשה נשלחה למנהל');
      await load();
    } catch (e) { toast((e as Error).message); }
    setBusy(false);
  }

  return (
    <>
      <div className="card form">
        <div>
          <h2>הגשת משמרות</h2>
          <span className="muted">לשבוע {weekTitle(data.week)}</span>
        </div>
        {data.open
          ? <div className="banner" style={{ background: 'var(--sunk)', color: 'var(--ink)' }}>ההגשה נסגרת ב{deadlineText(data.deadline)}. אפשר לעדכן עד אז.</div>
          : <div className="banner">ההגשה לשבוע הזה נסגרה. לשינויים פנו למנהל.</div>}
        <div className="bar">
          {data.mine
            ? <span className="tag live">✓ הוגש · {new Date(data.mine.submittedAt).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem', weekday: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            : <span className="tag ot">עדיין לא הגשת</span>}
          <span className="hint">סימנת {marked} משמרות</span>
        </div>
        {data.open ? (
          <div className="chips">
            <button type="button" className="btn sm ghost" onClick={() => setAll('can')}>יכול/ה בכולן</button>
            <button type="button" className="btn sm ghost" onClick={() => setAll(null)}>ניקוי</button>
          </div>
        ) : null}
      </div>

      {days.map((d) => (
        <div className="card daycard" key={d}>
          <h3>יום {DAYNAMES[weekdayOf(d)]} <span className="num muted" style={{ fontWeight: 500 }}>{shortDate(d)}</span></h3>
          {slotsForDay(d, st).map((s) => {
            const k = markKey(d, s.id);
            return (
              <div className="slotrow" key={k}>
                <div className="mid"><strong>{s.name}</strong><span className="num hint" style={{ textAlign: 'right' }}>{s.start}–{s.end}</span></div>
                <div className="seg" role="group" aria-label={`${s.name} ביום ${DAYNAMES[weekdayOf(d)]}`}>
                  {OPTS.map((o) => (
                    <button key={o.v} type="button" className={`${o.cls}${marks[k] === o.v ? ' on' : ''}`} aria-pressed={marks[k] === o.v}
                      onClick={() => set(k, o.v)} disabled={!data.open}>{o.label}</button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      <div className="card form">
        <div className="field"><label className="label" htmlFor="aNote">הערות למנהל</label>
          <input id="aNote" type="text" maxLength={300} value={note} disabled={!data.open}
            onChange={(e) => { setNote(e.target.value); setDirty(true); }} placeholder="לדוגמה: ביום שלישי רק עד 18:00" /></div>
        <p className="hint">משמרת שלא סומנה נחשבת כ&quot;לא יכול/ה&quot;.</p>
        {data.open ? (
          <button className="btn primary lg" type="button" onClick={submit} disabled={busy || (!dirty && !!data.mine)}>
            {busy ? 'שולח…' : data.mine ? (dirty ? 'עדכון ההגשה' : 'ההגשה מעודכנת') : 'שליחת ההגשה'}
          </button>
        ) : null}
      </div>
    </>
  );
}
