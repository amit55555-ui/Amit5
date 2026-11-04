'use client';
// סידור משמרות שבועי למנהל
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, downloadCsv } from '@/lib/client';
import {
  addDays, coverageGaps, dayKey, DAYNAMES, fromMin, hmLong, hmShort, planMs, shortDate, toMin, weekdayOf, weekStartKey, weekTitle,
} from '@/lib/calc';
import type { DayHours, Plan, PublicUser } from '@/lib/types';
import { Sheet } from './ui';

type Data = { plans: Plan[]; users: PublicUser[]; businessHours: DayHours[] };
type Toast = (m: string) => void;

export function AdminSchedule({ toast }: { toast: Toast }) {
  const [week, setWeek] = useState(() => weekStartKey(dayKey(Date.now())));
  const [data, setData] = useState<Data | null>(null);
  const [edit, setEdit] = useState<{ plan: Plan | null; day: string } | null>(null);
  const [confirmCopy, setConfirmCopy] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { setData(await api<Data>(`/api/schedule?from=${week}&to=${addDays(week, 6)}`)); }
    catch (e) { toast((e as Error).message); }
  }, [week, toast]);
  useEffect(() => { setData(null); load(); }, [load]);

  const names = useMemo(() => new Map((data?.users || []).map((u) => [u.id, u.name])), [data]);
  const days = Array.from({ length: 7 }, (_, i) => addDays(week, i));
  const today = dayKey(Date.now());

  async function copyPrev() {
    setBusy(true); setConfirmCopy(false);
    try {
      const r = await api<{ added: number; skipped: number }>('/api/admin/schedule/copy', 'POST', { from: addDays(week, -7), to: week });
      toast(r.added ? `הועתקו ${r.added} משמרות${r.skipped ? ` (${r.skipped} דולגו)` : ''}` : 'לא היה מה להעתיק מהשבוע הקודם');
      await load();
    } catch (e) { toast((e as Error).message); }
    setBusy(false);
  }

  function exportWeek() {
    if (!data) return;
    const rows: (string | number)[][] = [[`סידור משמרות ${weekTitle(week)}`], [], ['תאריך', 'יום', 'עובד', 'התחלה', 'סיום', 'שעות', 'הערה']];
    for (const p of data.plans) rows.push([p.day, DAYNAMES[weekdayOf(p.day)], names.get(p.userId) || '', p.start, p.end, hmLong(planMs(p)), p.note]);
    downloadCsv(`schedule-${week}.csv`, rows);
  }

  // סיכום שעות מתוכננות לכל עובד בשבוע
  const perUser = useMemo(() => {
    const m = new Map<string, { ms: number; n: number }>();
    for (const p of data?.plans || []) { const x = m.get(p.userId) || { ms: 0, n: 0 }; x.ms += planMs(p); x.n++; m.set(p.userId, x); }
    return [...m.entries()].map(([id, v]) => ({ name: names.get(id) || '—', ...v })).sort((a, b) => b.ms - a.ms);
  }, [data, names]);

  return (
    <>
      <div className="bar" style={{ flexWrap: 'nowrap' }}>
        <button className="iconbtn" type="button" onClick={() => setWeek(addDays(week, -7))} aria-label="שבוע קודם">›</button>
        <div style={{ textAlign: 'center' }}>
          <h2>{weekTitle(week)}</h2>
          {week !== weekStartKey(today) ? <button className="btn link" type="button" onClick={() => setWeek(weekStartKey(today))}>חזרה לשבוע הנוכחי</button> : null}
        </div>
        <button className="iconbtn" type="button" onClick={() => setWeek(addDays(week, 7))} aria-label="שבוע הבא">‹</button>
      </div>

      <div className="bar">
        {confirmCopy ? (
          <div className="confirm" style={{ background: 'var(--sunk)', color: 'var(--ink)', flex: 1 }}>
            <span>להעתיק את כל המשמרות מהשבוע הקודם לשבוע הזה?</span>
            <span style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn sm ghost" onClick={() => setConfirmCopy(false)}>ביטול</button>
              <button type="button" className="btn sm primary" onClick={copyPrev} disabled={busy}>העתקה</button>
            </span>
          </div>
        ) : (
          <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn ghost sm" type="button" onClick={() => setConfirmCopy(true)} disabled={busy}>העתקת השבוע הקודם</button>
            <button className="btn ghost sm" type="button" onClick={exportWeek} disabled={!data}>ייצוא לאקסל</button>
          </span>
        )}
      </div>

      {!data ? <p className="muted">טוען…</p> : (
        <>
          {data.users.filter((u) => u.active).length === 0 ? (
            <div className="banner">אין עובדים פעילים. הוסיפו עובדים בלשונית &quot;עובדים&quot; כדי לשבץ אותם.</div>
          ) : null}
          <div className="days">
            {days.map((d) => {
              const hours = data.businessHours?.[weekdayOf(d)] || null;
              const dp = data.plans.filter((p) => p.day === d);
              const gaps = coverageGaps(hours, dp);
              return (
                <section key={d} className={`card daycard${d === today ? ' today' : ''}${!hours ? ' closed' : ''}`}>
                  <div className="bar">
                    <div>
                      <h3>יום {DAYNAMES[weekdayOf(d)]} <span className="num muted" style={{ fontWeight: 500 }}>{shortDate(d)}</span></h3>
                      <span className="hint">{hours ? <>שעות פעילות <span className="num">{hours.open}–{hours.close}</span></> : 'סגור'}</span>
                    </div>
                    {hours ? <button className="btn ghost sm" type="button" onClick={() => setEdit({ plan: null, day: d })}>+ שיבוץ</button> : null}
                  </div>
                  {hours ? (
                    <>
                      <Timeline hours={hours} plans={dp} names={names} />
                      <div className="list">
                        {dp.map((p) => (
                          <button key={p.id} type="button" className="rowbtn" onClick={() => setEdit({ plan: p, day: d })}>
                            <div className="row" style={{ gridTemplateColumns: '1fr auto' }}>
                              <div className="mid"><strong>{names.get(p.userId) || '—'}</strong>{p.note ? <span className="note">{p.note}</span> : null}</div>
                              <div className="tot"><span className="num">{p.start}–{p.end}</span><span className="hint">{hmShort(planMs(p))}</span></div>
                            </div>
                          </button>
                        ))}
                      </div>
                      {gaps.length === 0
                        ? <span className="tag live" style={{ alignSelf: 'flex-start' }}>✓ כל שעות הפעילות מאוישות</span>
                        : <span className="tag ot" style={{ alignSelf: 'flex-start', whiteSpace: 'normal' }}>לא מאויש: {gaps.map((g, i) => <span key={g.start}>{i ? ', ' : ''}<span className="num">{g.start}–{g.end}</span></span>)}</span>}
                    </>
                  ) : null}
                </section>
              );
            })}
          </div>

          <div className="card">
            <h2 style={{ marginBottom: 6 }}>שעות מתוכננות השבוע</h2>
            {perUser.length === 0 ? <p className="muted" style={{ margin: 0 }}>עדיין לא שובצו משמרות לשבוע הזה.</p> : (
              <div className="pay">
                {perUser.map((r) => (
                  <div className="payline" key={r.name}><span>{r.name} <span className="hint">· {r.n} משמרות</span></span><span>{hmLong(r.ms)}</span></div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {edit && data ? (
        <PlanEditor plan={edit.plan} day={edit.day} users={data.users} hoursOf={(d) => data.businessHours?.[weekdayOf(d)] || null}
          onClose={() => setEdit(null)} onDone={async (m) => { setEdit(null); toast(m); await load(); }} />
      ) : null}
    </>
  );
}

/** פס זמן: מי עובד באיזה חלק של היום */
function Timeline({ hours, plans, names }: { hours: { open: string; close: string }; plans: Plan[]; names: Map<string, string> }) {
  const open = toMin(hours.open), close = toMin(hours.close), span = close - open;
  if (span <= 0) return null;
  const pos = (t: string) => ((Math.min(close, Math.max(open, toMin(t))) - open) / span) * 100;
  const ticks: number[] = [];
  for (let m = Math.ceil(open / 180) * 180; m < close; m += 180) if (m - open >= 90 && close - m >= 90) ticks.push(m);
  return (
    <div className="timeline" aria-hidden="true">
      <div className="tl-track">
        {plans.map((p, i) => (
          <div key={p.id} className="tl-bar" style={{ right: `${pos(p.start)}%`, width: `${pos(p.end) - pos(p.start)}%`, top: `${(i % 4) * 9 + 2}px` }}
            title={`${names.get(p.userId) || ''} ${p.start}–${p.end}`} />
        ))}
      </div>
      <div className="tl-ticks">
        {/* הזמן זורם מימין לשמאל */}
        <span style={{ right: 0 }}>{hours.open}</span>
        {ticks.map((m) => <span key={m} className="mid" style={{ right: `${((m - open) / span) * 100}%` }}>{fromMin(m)}</span>)}
        <span style={{ left: 0 }}>{hours.close}</span>
      </div>
    </div>
  );
}

function PlanEditor({ plan, day, users, hoursOf, onClose, onDone }: {
  plan: Plan | null; day: string; users: PublicUser[]; hoursOf: (d: string) => DayHours;
  onClose: () => void; onDone: (msg: string) => Promise<void>;
}) {
  const [d, setD] = useState(plan?.day || day);
  const hours = hoursOf(d);
  const [userId, setUserId] = useState(plan?.userId || '');
  const [start, setStart] = useState(plan?.start || hours?.open || '09:00');
  const [end, setEnd] = useState(plan?.end || hours?.close || '17:00');
  const [note, setNote] = useState(plan?.note || '');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const active = users.filter((u) => u.active || u.id === plan?.userId);

  // קיצורי זמן לפי שעות הפעילות של היום
  const presets = useMemo(() => {
    if (!hours) return [];
    const o = toMin(hours.open), c = toMin(hours.close);
    const mid = Math.round((o + c) / 2 / 30) * 30;
    const list = [{ label: 'יום מלא', s: o, e: c }];
    if (c - o >= 7 * 60) list.push({ label: 'בוקר', s: o, e: mid }, { label: 'ערב', s: mid, e: c });
    return list.map((p) => ({ label: p.label, start: fromMin(p.s), end: fromMin(p.e) }));
  }, [hours]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      const data = { userId, day: d, start, end, note };
      if (plan) await api(`/api/admin/schedule/${plan.id}`, 'PATCH', data);
      else await api('/api/admin/schedule', 'POST', data);
      await onDone(plan ? 'המשמרת עודכנה' : 'המשמרת שובצה');
    } catch (x) { setErr((x as Error).message); }
    setBusy(false);
  }
  async function del() {
    if (!plan) return;
    setBusy(true);
    try { await api(`/api/admin/schedule/${plan.id}`, 'DELETE'); await onDone('המשמרת הוסרה מהסידור'); } catch (x) { setErr((x as Error).message); }
    setBusy(false);
  }

  return (
    <Sheet title={plan ? 'עריכת משמרת בסידור' : 'שיבוץ משמרת'} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <div className="field"><label className="label" htmlFor="pUser">עובד</label>
          <select id="pUser" value={userId} onChange={(e) => setUserId(e.target.value)} required>
            <option value="" disabled>בחרו עובד</option>
            {active.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select></div>
        <div className="field"><label className="label" htmlFor="pDay">תאריך</label>
          <input id="pDay" type="date" value={d} onChange={(e) => setD(e.target.value)} required />
          <span className="hint">{hours ? <>יום {DAYNAMES[weekdayOf(d)]} · שעות פעילות <span className="num">{hours.open}–{hours.close}</span></> : 'העסק סגור ביום הזה'}</span></div>
        {presets.length ? (
          <div className="chips">
            {presets.map((p) => (
              <button key={p.label} type="button" className={`btn sm ${start === p.start && end === p.end ? 'primary' : 'ghost'}`}
                onClick={() => { setStart(p.start); setEnd(p.end); }}>
                {p.label} <span className="num">{p.start}–{p.end}</span>
              </button>
            ))}
          </div>
        ) : null}
        <div className="grid2">
          <div className="field"><label className="label" htmlFor="pStart">התחלה</label>
            <input id="pStart" type="time" step={900} value={start} onChange={(e) => setStart(e.target.value)} required /></div>
          <div className="field"><label className="label" htmlFor="pEnd">סיום</label>
            <input id="pEnd" type="time" step={900} value={end} onChange={(e) => setEnd(e.target.value)} required /></div>
        </div>
        {toMin(end) > toMin(start) ? <p className="hint">אורך המשמרת: {hmLong((toMin(end) - toMin(start)) * 60000)}</p> : null}
        <div className="field"><label className="label" htmlFor="pNote">הערה</label>
          <input id="pNote" type="text" maxLength={120} value={note} onChange={(e) => setNote(e.target.value)} placeholder="לדוגמה: אחראי משמרת" /></div>
        {err ? <p className="err" role="alert">{err}</p> : null}
        <button className="btn primary" type="submit" disabled={busy || !hours}>{busy ? 'שומר…' : plan ? 'שמירה' : 'שיבוץ'}</button>
        {plan ? (confirmDel ? (
          <div className="confirm">
            <span>להסיר את המשמרת מהסידור?</span>
            <span style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn sm ghost" onClick={() => setConfirmDel(false)}>ביטול</button>
              <button type="button" className="btn sm out" onClick={del} disabled={busy}>הסרה</button>
            </span>
          </div>
        ) : <button type="button" className="btn danger-text" onClick={() => setConfirmDel(true)}>הסרה מהסידור</button>) : null}
      </form>
    </Sheet>
  );
}
