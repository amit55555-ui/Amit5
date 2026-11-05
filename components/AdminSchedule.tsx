'use client';
// סידור משמרות שבועי למנהל
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, downloadCsv } from '@/lib/client';
import {
  addDays, coverageGaps, dayKey, DAYNAMES, deadlineText, fromMin, hmLong, markKey, planMs, shortDate, slotsForDay, toMin, weekdayOf, weekStartKey, weekTitle,
} from '@/lib/calc';
import type { Avail, DayHours, Plan, PublicUser, Slot } from '@/lib/types';
import { Sheet } from './ui';

type Data = { plans: Plan[]; users: PublicUser[]; businessHours: DayHours[]; slots: Slot[]; published: Record<string, number> };
type AvailData = { week: string; deadline: number; open: boolean; avail: Avail[] };
type Toast = (m: string) => void;

export function AdminSchedule({ toast }: { toast: Toast }) {
  const [week, setWeek] = useState(() => weekStartKey(dayKey(Date.now())));
  const [data, setData] = useState<Data | null>(null);
  const [av, setAv] = useState<AvailData | null>(null);
  const [edit, setEdit] = useState<{ plan: Plan | null; day: string; slot?: Slot } | null>(null);
  const [confirmCopy, setConfirmCopy] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [d, a] = await Promise.all([
        api<Data>(`/api/schedule?from=${week}&to=${addDays(week, 6)}`),
        api<AvailData>(`/api/avail?week=${week}`),
      ]);
      setData(d); setAv(a);
    } catch (e) { toast((e as Error).message); }
  }, [week, toast]);
  useEffect(() => { setData(null); setAv(null); load(); }, [load]);

  const names = useMemo(() => new Map((data?.users || []).map((u) => [u.id, u.name])), [data]);
  const activeUsers = (data?.users || []).filter((u) => u.active);
  const days = Array.from({ length: 7 }, (_, i) => addDays(week, i));
  const today = dayKey(Date.now());
  const published = !!data?.published[week];
  const stLike = { slots: data?.slots || [], businessHours: data?.businessHours || [] };
  const availBy = useMemo(() => new Map((av?.avail || []).map((a) => [a.userId, a])), [av]);
  const submitted = activeUsers.filter((u) => availBy.has(u.id));
  const missing = activeUsers.filter((u) => !availBy.has(u.id));

  async function copyPrev() {
    setBusy(true); setConfirmCopy(false);
    try {
      const r = await api<{ added: number; skipped: number }>('/api/admin/schedule/copy', 'POST', { from: addDays(week, -7), to: week });
      toast(r.added ? `הועתקו ${r.added} משמרות${r.skipped ? ` (${r.skipped} דולגו)` : ''}` : 'לא היה מה להעתיק מהשבוע הקודם');
      await load();
    } catch (e) { toast((e as Error).message); }
    setBusy(false);
  }
  async function publish(on: boolean) {
    setBusy(true);
    try { await api('/api/admin/schedule/publish', 'POST', { week, publish: on }); toast(on ? 'הסידור פורסם לכל העובדים' : 'הפרסום בוטל. העובדים לא רואים את הסידור.'); await load(); }
    catch (e) { toast((e as Error).message); }
    setBusy(false);
  }
  async function assign(userId: string, day: string, slot: Slot) {
    setBusy(true);
    try { await api('/api/admin/schedule', 'POST', { userId, day, start: slot.start, end: slot.end }); toast(`${names.get(userId)} שובץ/ה ל${slot.name}`); await load(); }
    catch (e) { toast((e as Error).message); }
    setBusy(false);
  }

  function exportWeek() {
    if (!data) return;
    const rows: (string | number)[][] = [[`סידור משמרות ${weekTitle(week)}`], [], ['תאריך', 'יום', 'עובד', 'התחלה', 'סיום', 'שעות', 'הערה']];
    for (const p of data.plans) rows.push([p.day, DAYNAMES[weekdayOf(p.day)], names.get(p.userId) || '', p.start, p.end, hmLong(planMs(p)), p.note]);
    downloadCsv(`schedule-${week}.csv`, rows);
  }
  function exportSubmissions() {
    if (!data || !av) return;
    const keys = days.flatMap((d) => slotsForDay(d, stLike).map((s) => ({ d, s })));
    const head = ['עובד', 'הוגש', ...keys.map(({ d, s }) => `${DAYNAMES[weekdayOf(d)]} ${shortDate(d)} ${s.name}`), 'הערות'];
    const label = { pref: 'מעדיף', can: 'יכול', cant: 'לא יכול' } as const;
    const rows: (string | number)[][] = [[`הגשות משמרות ${weekTitle(week)}`], [], head];
    for (const u of activeUsers) {
      const a = availBy.get(u.id);
      rows.push([u.name, a ? 'כן' : 'לא', ...keys.map(({ d, s }) => (a?.marks[markKey(d, s.id)] ? label[a.marks[markKey(d, s.id)]] : '')), a?.note || '']);
    }
    downloadCsv(`submissions-${week}.csv`, rows);
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

      {data ? (
        <div className={`card pubcard${published ? ' on' : ''}`}>
          <div className="mid">
            <strong>{published ? '✓ הסידור פורסם' : 'טיוטה'}</strong>
            <span className="hint">{published ? 'כל העובדים רואים את הסידור של השבוע הזה.' : 'העובדים עדיין לא רואים את הסידור. פרסמו כשהוא מוכן.'}</span>
          </div>
          <button className={`btn sm ${published ? 'ghost' : 'primary'}`} type="button" onClick={() => publish(!published)} disabled={busy}>
            {published ? 'ביטול פרסום' : 'פרסום הסידור'}
          </button>
        </div>
      ) : null}

      {av && data ? (
        <div className="card form">
          <div className="bar">
            <h2>הגשות העובדים</h2>
            <span className={`tag ${missing.length ? 'ot' : 'live'}`}>הגישו {submitted.length} מתוך {activeUsers.length}</span>
          </div>
          <span className="hint">{av.open ? `ההגשה פתוחה עד ${deadlineText(av.deadline)}` : `ההגשה נסגרה ב${deadlineText(av.deadline)}`}</span>
          {missing.length ? <span>עדיין לא הגישו: <b>{missing.map((u) => u.name).join(', ')}</b></span> : null}
          {submitted.filter((u) => availBy.get(u.id)?.note).map((u) => (
            <div key={u.id} className="notebox"><b>{u.name}:</b> {availBy.get(u.id)?.note}</div>
          ))}
          <span className="hint">בכל יום למטה מופיעים מי שסימנו שהם יכולים. לחיצה על שם משבצת אותו למשמרת.</span>
        </div>
      ) : null}

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
            <button className="btn ghost sm" type="button" onClick={exportWeek} disabled={!data}>ייצוא סידור</button>
            <button className="btn ghost sm" type="button" onClick={exportSubmissions} disabled={!av}>ייצוא הגשות</button>
          </span>
        )}
      </div>

      {!data ? <p className="muted">טוען…</p> : (
        <>
          {activeUsers.length === 0 ? (
            <div className="banner">אין עובדים פעילים. הוסיפו עובדים בלשונית &quot;עובדים&quot; כדי לשבץ אותם.</div>
          ) : null}
          <div className="days">
            {days.map((d) => {
              const hours = data.businessHours?.[weekdayOf(d)] || null;
              const dp = data.plans.filter((p) => p.day === d);
              const gaps = coverageGaps(hours, dp);
              const slots = slotsForDay(d, stLike);
              const inSlot = new Set<string>();
              return (
                <section key={d} className={`card daycard${d === today ? ' today' : ''}${!hours ? ' closed' : ''}`}>
                  <div className="bar">
                    <div>
                      <h3>יום {DAYNAMES[weekdayOf(d)]} <span className="num muted" style={{ fontWeight: 500 }}>{shortDate(d)}</span></h3>
                      <span className="hint">{hours ? <>שעות פעילות <span className="num">{hours.open}–{hours.close}</span></> : 'סגור'}</span>
                    </div>
                    {hours ? <button className="btn ghost sm" type="button" onClick={() => setEdit({ plan: null, day: d })}>+ שיבוץ חופשי</button> : null}
                  </div>
                  {hours ? (
                    <>
                      <Timeline hours={hours} plans={dp} names={names} />
                      {slots.map((s) => {
                        const assigned = dp.filter((p) => p.start === s.start && p.end === s.end);
                        assigned.forEach((p) => inSlot.add(p.id));
                        const busyIds = new Set(dp.filter((p) => toMin(p.start) < toMin(s.end) && toMin(s.start) < toMin(p.end)).map((p) => p.userId));
                        const k = markKey(d, s.id);
                        const pool = activeUsers
                          .map((u) => ({ u, m: availBy.get(u.id)?.marks[k] }))
                          .filter((x) => (x.m === 'can' || x.m === 'pref') && !busyIds.has(x.u.id))
                          .sort((a, b) => (a.m === 'pref' ? -1 : 0) - (b.m === 'pref' ? -1 : 0));
                        const cant = activeUsers.filter((u) => availBy.get(u.id) && availBy.get(u.id)?.marks[k] !== 'can' && availBy.get(u.id)?.marks[k] !== 'pref').length;
                        return (
                          <div className="slotbox" key={s.id}>
                            <div className="bar">
                              <strong>{s.name} <span className="num hint" style={{ fontWeight: 400 }}>{s.start}–{s.end}</span></strong>
                              <button className="btn link" type="button" onClick={() => setEdit({ plan: null, day: d, slot: s })}>+ שיבוץ</button>
                            </div>
                            <div className="chips">
                              {assigned.length === 0 ? <span className="hint">לא שובץ אף אחד</span> : assigned.map((p) => (
                                <button key={p.id} type="button" className="nm assigned" onClick={() => setEdit({ plan: p, day: d })}>{names.get(p.userId) || '—'}</button>
                              ))}
                            </div>
                            {pool.length ? (
                              <div className="chips">
                                <span className="hint">זמינים:</span>
                                {pool.map(({ u, m }) => (
                                  <button key={u.id} type="button" className={`nm avail${m === 'pref' ? ' pref' : ''}`} disabled={busy}
                                    onClick={() => assign(u.id, d, s)} title="לחצו לשיבוץ">{m === 'pref' ? '★ ' : '+ '}{u.name}</button>
                                ))}
                              </div>
                            ) : av && submitted.length ? <span className="hint">אין זמינים נוספים{cant ? ` · ${cant} סימנו שלא יכולים` : ''}</span> : null}
                          </div>
                        );
                      })}
                      {dp.filter((p) => !inSlot.has(p.id)).length ? (
                        <div className="slotbox">
                          <strong>משמרות נוספות</strong>
                          <div className="chips">
                            {dp.filter((p) => !inSlot.has(p.id)).map((p) => (
                              <button key={p.id} type="button" className="nm assigned" onClick={() => setEdit({ plan: p, day: d })}>
                                {names.get(p.userId) || '—'} <span className="num">{p.start}–{p.end}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
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
        <PlanEditor plan={edit.plan} day={edit.day} initialSlot={edit.slot} users={data.users}
          hoursOf={(d) => data.businessHours?.[weekdayOf(d)] || null} slotsOf={(d) => slotsForDay(d, stLike)}
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

function PlanEditor({ plan, day, initialSlot, users, hoursOf, slotsOf, onClose, onDone }: {
  plan: Plan | null; day: string; initialSlot?: Slot; users: PublicUser[]; hoursOf: (d: string) => DayHours; slotsOf: (d: string) => Slot[];
  onClose: () => void; onDone: (msg: string) => Promise<void>;
}) {
  const [d, setD] = useState(plan?.day || day);
  const hours = hoursOf(d);
  const [userId, setUserId] = useState(plan?.userId || '');
  const [start, setStart] = useState(plan?.start || initialSlot?.start || hours?.open || '09:00');
  const [end, setEnd] = useState(plan?.end || initialSlot?.end || hours?.close || '17:00');
  const [note, setNote] = useState(plan?.note || '');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const active = users.filter((u) => u.active || u.id === plan?.userId);

  // קיצורים: סוגי המשמרות של היום + יום מלא
  const presets = useMemo(() => {
    if (!hours) return [];
    const list = slotsOf(d).map((x) => ({ label: x.name, start: x.start, end: x.end }));
    if (!list.some((x) => x.start === hours.open && x.end === hours.close)) list.push({ label: 'יום מלא', start: hours.open, end: hours.close });
    return list;
  }, [hours, d, slotsOf]);

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
