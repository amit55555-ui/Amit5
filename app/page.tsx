'use client';
import { useCallback, useEffect, useState } from 'react';
import { api, getLocation } from '@/lib/client';
import {
  breakMs, clockT, DAYNAMES, dayKey, hm, hmLong, hms, MONTHS, money, monthKey, monthTitle, onBreak,
  shiftMonth, summarize, weekStart, workMs, zparts,
} from '@/lib/calc';
import type { PublicSettings, PublicUser, Shift } from '@/lib/types';
import { HoursStat, MonthNav, PayBreakdown, ShiftEditor, ShiftRow, useNow, useToast } from '@/components/ui';
import { LocationPrompt } from '@/components/LocationPrompt';

type Me = { user: PublicUser | null; companyName?: string; settings?: PublicSettings; active?: Shift | null; recent?: Shift[] };
type LoggedIn = { user: PublicUser; settings: PublicSettings; active: Shift | null; recent: Shift[] };

export default function EmployeePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [toast, setToast] = useToast();

  const load = useCallback(async () => {
    try { setMe(await api<Me>('/api/auth')); } catch (e) { setToast((e as Error).message); setMe({ user: null }); }
  }, [setToast]);
  useEffect(() => { load(); }, [load]);

  if (!me) return <div className="wrap"><p className="muted" style={{ textAlign: 'center', marginTop: '20vh' }}>טוען…</p></div>;
  return (
    <>
      {me.user && me.settings
        ? <Dashboard me={{ user: me.user, settings: me.settings, active: me.active ?? null, recent: me.recent ?? [] }} reload={load} toast={setToast} />
        : <Login company={me.companyName || ''} onDone={load} />}
      {toast}
    </>
  );
}

function Login({ company, onDone }: { company: string; onDone: () => void }) {
  const [username, setU] = useState('');
  const [password, setP] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr('');
    try { await api('/api/auth', 'POST', { username, password }); onDone(); }
    catch (x) { setErr((x as Error).message); }
    setBusy(false);
  }
  return (
    <div className="wrap login">
      <div className="brand">
        <img src="/logo.jpg" alt="SPARTA" className="logo" width={120} height={120} />
        <h1>שעון נוכחות</h1>
        {company ? <span className="muted">{company}</span> : null}
      </div>
      <form className="card form" onSubmit={submit}>
        <div className="field"><label className="label" htmlFor="lu">שם משתמש</label>
          <input id="lu" autoComplete="username" autoCapitalize="none" value={username} onChange={(e) => setU(e.target.value)} required /></div>
        <div className="field"><label className="label" htmlFor="lp">סיסמה</label>
          <input id="lp" type="password" autoComplete="current-password" value={password} onChange={(e) => setP(e.target.value)} required /></div>
        {err ? <p className="err" role="alert">{err}</p> : null}
        <button className="btn primary lg" type="submit" disabled={busy}>{busy ? 'מתחבר…' : 'כניסה'}</button>
        <p className="hint">אין לכם משתמש? המנהל יוצר אותו בממשק הניהול.</p>
      </form>
      <p className="hint" style={{ textAlign: 'center' }}><a href="/admin">כניסת מנהל</a></p>
    </div>
  );
}

function Dashboard({ me, reload, toast }: { me: LoggedIn; reload: () => Promise<void>; toast: (m: string) => void }) {
  const now = useNow();
  const { user, settings: st } = me;
  const [active, setActive] = useState<Shift | null>(me.active);
  const [recent, setRecent] = useState<Shift[]>(me.recent);
  const [tab, setTab] = useState<'today' | 'month'>('today');
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locPrompt, setLocPrompt] = useState(0);
  useEffect(() => { setActive(me.active); setRecent(me.recent); }, [me]);

  async function clock(action: 'in' | 'out' | 'break') {
    setBusy(true);
    let loc: { lat: number; lng: number; acc: number } | undefined;
    if (action !== 'break' && st.requireLocation) {
      setLocating(true);
      const g = await getLocation();
      setLocating(false);
      if ('error' in g) {
        setLocPrompt((n) => n + 1); setBusy(false); return;
      }
      loc = g;
    }
    try {
      const r = await api<{ active: Shift | null; closed?: Shift }>('/api/clock', 'POST', { action, loc });
      if (action === 'in') toast(`נרשמה כניסה ב-${clockT(Date.now())}`);
      if (action === 'out' && r.closed) toast(`נרשמה יציאה. עבדת ${hmLong(workMs(r.closed, Date.now()))}`);
      if (action === 'break') toast(r.active && onBreak(r.active) ? 'יצאת להפסקה' : 'חזרת מהפסקה');
      await reload();
    } catch (e) { toast((e as Error).message); await reload(); }
    setBusy(false);
  }
  async function logout() { await api('/api/auth', 'DELETE'); location.reload(); }

  const all = active && !recent.some((s) => s.id === active.id) ? [...recent, active] : recent;
  const today = dayKey(now);
  const todayMs = all.filter((s) => dayKey(s.start) === today).reduce((a, s) => a + workMs(s, now), 0);
  const ws = weekStart(now);
  const weekMs = all.filter((s) => s.start >= ws).reduce((a, s) => a + workMs(s, now), 0);
  const thisMonth = monthKey(now);
  const ms = summarize(all.filter((s) => monthKey(s.start) === thisMonth), st, user.wage, user.travel, now);
  const p = zparts(now);
  const brk = active ? onBreak(active) : false;

  return (
    <div className="wrap">
      <header className="top">
        <img src="/logo.jpg" alt="" className="logo-sm" width={40} height={40} />
        <div className="who"><h1>שלום, {user.name}</h1>{st.companyName ? <span className="muted">{st.companyName}</span> : null}</div>
        <button className="btn link" type="button" onClick={logout}>התנתקות</button>
      </header>

      {tab === 'today' ? (
        <>
          <div className="card clock">
            <div className="clock-head">
              <span style={{ fontWeight: 600 }}>יום {DAYNAMES[p.wd]}, {p.d} ב{MONTHS[p.m - 1]}</span>
              <span className={`pill ${active ? (brk ? 'brk' : 'on') : ''}`}>{active ? (brk ? 'בהפסקה' : 'במשמרת') : 'לא במשמרת'}</span>
            </div>
            <div className="big num" aria-live="off">{active ? hms(workMs(active, now)) : hms(((p.h * 60 + p.mi) * 60 + p.s) * 1000)}</div>
            <div className="sub">
              <div><span className="label">כניסה</span><span className="num">{active ? clockT(active.start) : '—'}</span></div>
              <div><span className="label">הפסקות</span><span className="num">{active ? hm(breakMs(active, now)) : '0:00'}</span></div>
              <div><span className="label">עבדת היום</span><span className="num">{hm(todayMs)}</span></div>
            </div>
            <div className="actions">
              {!active ? (
                <button className="btn in lg wide" type="button" disabled={busy} onClick={() => clock('in')}>כניסה למשמרת</button>
              ) : (
                <>
                  <button className="btn ghost lg" type="button" disabled={busy} onClick={() => clock('break')}>{brk ? 'חזרה מהפסקה' : 'יציאה להפסקה'}</button>
                  <button className="btn out lg" type="button" disabled={busy} onClick={() => clock('out')}>יציאה ממשמרת</button>
                </>
              )}
            </div>
            {locating ? <p className="hint" role="status" style={{ textAlign: 'center' }}>מאתר מיקום…</p>
              : st.requireLocation ? <p className="hint" style={{ textAlign: 'center' }}>בכניסה וביציאה נשמר המיקום שלך. הטלפון יבקש אישור בפעם הראשונה.</p> : null}
          </div>

          <div className="stats">
            <HoursStat label="השבוע" ms={weekMs} />
            <HoursStat label="החודש" ms={ms.tot} />
            <div className="stat"><span className="label">ימי עבודה החודש</span><span className="num">{ms.nDays}</span></div>
            {st.showPayToEmployees
              ? <div className="stat"><span className="label">שכר משוער החודש</span><span className="num">{money(ms.pay.total)}</span></div>
              : <HoursStat label="שעות נוספות החודש" ms={ms.ot1 + ms.ot2} />}
          </div>

          <div className="card">
            <h2 style={{ marginBottom: 6 }}>משמרות אחרונות</h2>
            <div className="list">
              {all.length === 0
                ? <div className="empty"><strong>עדיין אין משמרות</strong><span className="muted">לחצו &quot;כניסה למשמרת&quot; כשאתם מתחילים לעבוד.</span></div>
                : [...all].sort((a, b) => b.start - a.start).slice(0, 7).map((s) => (
                  <ShiftRow key={s.id} s={s} now={now} stdHours={st.stdHours} otEnabled={st.otEnabled} />
                ))}
            </div>
          </div>
        </>
      ) : (
        <MyMonth user={user} st={st} now={now} toast={toast} onChange={reload} />
      )}

      <LocationPrompt required={st.requireLocation} forceOpen={locPrompt} />

      <nav className="tabs" role="tablist">
        <div className="in">
          <button type="button" role="tab" aria-selected={tab === 'today'} onClick={() => setTab('today')}>היום</button>
          <button type="button" role="tab" aria-selected={tab === 'month'} onClick={() => setTab('month')}>החודש שלי</button>
        </div>
      </nav>
    </div>
  );
}

function MyMonth({ user, st, now, toast, onChange }: { user: PublicUser; st: PublicSettings; now: number; toast: (m: string) => void; onChange: () => Promise<void> }) {
  const [month, setMonth] = useState(monthKey(Date.now()));
  const [shifts, setShifts] = useState<Shift[] | null>(null);
  const [edit, setEdit] = useState<Shift | 'new' | null>(null);

  const load = useCallback(async () => {
    try { setShifts((await api<{ shifts: Shift[] }>(`/api/shifts?month=${month}`)).shifts); }
    catch (e) { toast((e as Error).message); setShifts([]); }
  }, [month, toast]);
  useEffect(() => { setShifts(null); load(); }, [load]);

  const sum = summarize(shifts || [], st, user.wage, user.travel, now);
  const canEdit = st.allowEmployeeEdit;

  async function save(v: Record<string, unknown>) {
    try {
      if (edit && edit !== 'new') await api(`/api/shifts/${edit.id}`, 'PATCH', v);
      else await api('/api/shifts', 'POST', v);
      setEdit(null); toast('המשמרת נשמרה'); await load(); await onChange(); return null;
    } catch (e) { return (e as Error).message; }
  }
  async function del() {
    if (!edit || edit === 'new') return null;
    try { await api(`/api/shifts/${edit.id}`, 'DELETE'); setEdit(null); toast('המשמרת נמחקה'); await load(); await onChange(); return null; }
    catch (e) { return (e as Error).message; }
  }

  return (
    <>
      <MonthNav title={monthTitle(month)} onPrev={() => setMonth(shiftMonth(month, -1))} onNext={() => setMonth(shiftMonth(month, 1))} />
      <div className="stats">
        <HoursStat label="סה״כ שעות" ms={sum.tot} />
        <div className="stat"><span className="label">ימי עבודה</span><span className="num">{sum.nDays}</span></div>
        <HoursStat label={`נוספות ${Math.round(st.ot1Rate * 100)}%`} ms={sum.ot1} />
        <HoursStat label={`נוספות ${Math.round(st.ot2Rate * 100)}%`} ms={sum.ot2} />
      </div>
      {st.showPayToEmployees ? (
        <PayBreakdown sum={sum} st={st} wage={user.wage} travel={user.travel} title="שכר משוער" />
      ) : (
        <div className="card pay">
          <h2 style={{ marginBottom: 4 }}>פירוט שעות</h2>
          <div className="payline"><span>שעות רגילות</span><span>{hmLong(sum.reg)}</span></div>
          {st.otEnabled ? <>
            <div className="payline"><span>נוספות {Math.round(st.ot1Rate * 100)}%</span><span>{hmLong(sum.ot1)}</span></div>
            <div className="payline"><span>נוספות {Math.round(st.ot2Rate * 100)}%</span><span>{hmLong(sum.ot2)}</span></div>
          </> : null}
          <div className="payline total"><span>סה״כ</span><span>{hmLong(sum.tot)}</span></div>
        </div>
      )}
      <div className="card">
        <div className="bar" style={{ marginBottom: 6 }}>
          <h2>פירוט ימים</h2>
          {canEdit ? <button className="btn ghost sm" type="button" onClick={() => setEdit('new')}>+ הוספה ידנית</button> : null}
        </div>
        {!canEdit ? <p className="hint" style={{ marginBottom: 6 }}>שכחתם להחתים? פנו למנהל לתיקון.</p> : null}
        <div className="list">
          {shifts === null ? <p className="muted">טוען…</p>
            : sum.days.length === 0 ? <div className="empty muted">אין משמרות בחודש הזה.</div>
            : sum.days.flatMap((d) => d.shifts).sort((a, b) => b.start - a.start).map((s) => (
              <ShiftRow key={s.id} s={s} now={now} stdHours={st.stdHours} otEnabled={st.otEnabled} onClick={canEdit ? () => setEdit(s) : undefined} />
            ))}
        </div>
      </div>
      {edit ? (
        <ShiftEditor shift={edit === 'new' ? null : edit} now={now} title={edit === 'new' ? 'הוספת משמרת' : 'תיקון משמרת'}
          onSave={save} onDelete={edit === 'new' ? undefined : del} onClose={() => setEdit(null)} />
      ) : null}
    </>
  );
}
