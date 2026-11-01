'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, downloadCsv } from '@/lib/client';
import { breakMs, clockT, dayKey, DAYNAMES, hm, hours, money, monthKey, monthTitle, shiftMonth, summarize, workMs, zparts } from '@/lib/calc';
import type { PublicSettings, PublicUser, Shift } from '@/lib/types';
import { mapUrl, MonthNav, Sheet, ShiftEditor, ShiftRow, useNow, useToast } from '@/components/ui';

type Status = { admin: boolean; defaultPassword: boolean; database: boolean };
type Toast = (m: string) => void;

export default function AdminPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [toast, setToast] = useToast();
  const load = useCallback(async () => {
    try { setStatus(await api<Status>('/api/admin/auth')); } catch (e) { setToast((e as Error).message); }
  }, [setToast]);
  useEffect(() => { load(); }, [load]);

  if (!status) return <div className="wrap"><p className="muted" style={{ textAlign: 'center', marginTop: '20vh' }}>טוען…</p></div>;
  return <>{status.admin ? <AdminApp status={status} toast={setToast} onAuthLost={load} /> : <AdminLogin onDone={load} />}{toast}</>;
}

function AdminLogin({ onDone }: { onDone: () => void }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr('');
    try { await api('/api/admin/auth', 'POST', { password: pw }); onDone(); } catch (x) { setErr((x as Error).message); }
    setBusy(false);
  }
  return (
    <div className="wrap login">
      <div className="brand"><span className="mark num">ADMIN</span><h1>ממשק מנהל</h1></div>
      <form className="card form" onSubmit={submit}>
        <div className="field"><label className="label" htmlFor="ap">סיסמת מנהל</label>
          <input id="ap" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} required autoFocus /></div>
        {err ? <p className="err" role="alert">{err}</p> : null}
        <button className="btn primary lg" type="submit" disabled={busy}>{busy ? 'בודק…' : 'כניסה'}</button>
      </form>
      <p className="hint" style={{ textAlign: 'center' }}><a href="/">חזרה לכניסת עובדים</a></p>
    </div>
  );
}

type Report = { month: string; settings: PublicSettings; users: PublicUser[]; shifts: Shift[]; active: Shift[] };

function AdminApp({ status, toast, onAuthLost }: { status: Status; toast: Toast; onAuthLost: () => void }) {
  const [tab, setTab] = useState<'report' | 'users' | 'settings'>('report');
  const [month, setMonth] = useState(monthKey(Date.now()));
  const [rep, setRep] = useState<Report | null>(null);

  const load = useCallback(async () => {
    try { setRep(await api<Report>(`/api/admin/report?month=${month}`)); }
    catch (e) { if ((e as { status?: number }).status === 401) onAuthLost(); else toast((e as Error).message); }
  }, [month, toast, onAuthLost]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { const t = setInterval(load, 60000); return () => clearInterval(t); }, [load]);

  async function logout() { await api('/api/admin/auth', 'DELETE'); onAuthLost(); }

  return (
    <div className="wrap wide">
      <header className="top">
        <div className="who"><h1>ממשק מנהל</h1>{rep?.settings.companyName ? <span className="muted">{rep.settings.companyName}</span> : null}</div>
        <button className="btn link" type="button" onClick={logout}>התנתקות</button>
      </header>
      {status.defaultPassword ? <div className="banner">סיסמת המנהל היא עדיין סיסמת ברירת המחדל (1234). החליפו אותה בלשונית &quot;הגדרות&quot;.</div> : null}
      {!status.database ? <div className="banner">אין חיבור למסד נתונים. הנתונים נשמרים זמנית בשרת ועלולים להימחק. ראו SETUP.md לחיבור Neon.</div> : null}

      {!rep ? <p className="muted">טוען…</p>
        : tab === 'report' ? <ReportView rep={rep} month={month} setMonth={setMonth} reload={load} toast={toast} />
        : tab === 'users' ? <UsersView users={rep.users} st={rep.settings} reload={load} toast={toast} />
        : <SettingsView st={rep.settings} reload={load} toast={toast} />}

      <nav className="tabs" role="tablist">
        <div className="in">
          <button type="button" role="tab" aria-selected={tab === 'report'} onClick={() => setTab('report')}>דוח נוכחות</button>
          <button type="button" role="tab" aria-selected={tab === 'users'} onClick={() => setTab('users')}>עובדים</button>
          <button type="button" role="tab" aria-selected={tab === 'settings'} onClick={() => setTab('settings')}>הגדרות</button>
        </div>
      </nav>
    </div>
  );
}

/* ---------------- דוח ---------------- */
function ReportView({ rep, month, setMonth, reload, toast }: { rep: Report; month: string; setMonth: (m: string) => void; reload: () => Promise<void>; toast: Toast }) {
  const now = useNow(30000);
  const st = rep.settings;
  const [openUser, setOpenUser] = useState<string | null>(null);
  const byUser = useMemo(() => {
    const m = new Map<string, Shift[]>();
    for (const s of rep.shifts) { const a = m.get(s.userId) || []; a.push(s); m.set(s.userId, a); }
    return m;
  }, [rep.shifts]);
  const rows = rep.users
    .map((u) => ({ u, sum: summarize(byUser.get(u.id) || [], st, u.wage, u.travel, now) }))
    .filter((r) => r.u.active || r.sum.nDays > 0);
  const tot = rows.reduce((a, r) => ({ days: a.days + r.sum.nDays, ms: a.ms + r.sum.tot, ot1: a.ot1 + r.sum.ot1, ot2: a.ot2 + r.sum.ot2, pay: a.pay + r.sum.pay.total }),
    { days: 0, ms: 0, ot1: 0, ot2: 0, pay: 0 });
  const names = new Map(rep.users.map((u) => [u.id, u.name]));
  const r1 = Math.round(st.ot1Rate * 100), r2 = Math.round(st.ot2Rate * 100);

  function exportSummary() {
    const out: (string | number)[][] = [[`דוח נוכחות ${monthTitle(month)}`], [], ['עובד', 'שם משתמש', 'ימי עבודה', 'סה"כ שעות', 'שעות רגילות', `נוספות ${r1}%`, `נוספות ${r2}%`, 'שכר לשעה', 'נסיעות', 'שכר משוער']];
    for (const { u, sum } of rows) out.push([u.name, u.username, sum.nDays, hours(sum.tot), hours(sum.reg), hours(sum.ot1), hours(sum.ot2), u.wage, sum.pay.travel.toFixed(2), sum.pay.total.toFixed(2)]);
    out.push(['סה"כ', '', tot.days, hours(tot.ms), '', hours(tot.ot1), hours(tot.ot2), '', '', tot.pay.toFixed(2)]);
    downloadCsv(`attendance-summary-${month}.csv`, out);
  }
  function exportDetail() {
    const out: (string | number)[][] = [['עובד', 'תאריך', 'יום', 'כניסה', 'יציאה', 'הפסקה (דק׳)', 'שעות', 'הערה', 'תיקון ידני', 'מיקום כניסה', 'מיקום יציאה']];
    const list = [...rep.shifts].sort((a, b) => (names.get(a.userId) || '').localeCompare(names.get(b.userId) || '', 'he') || a.start - b.start);
    for (const s of list) out.push([names.get(s.userId) || '', dayKey(s.start), DAYNAMES[zparts(s.start).wd], clockT(s.start), s.end ? clockT(s.end) : '',
      Math.round(breakMs(s, now) / 60000), hours(workMs(s, now)), s.note, s.editedBy === 'admin' ? 'מנהל' : s.editedBy === 'user' ? 'עובד' : '',
      s.inLoc ? mapUrl(s.inLoc) : '', s.outLoc ? mapUrl(s.outLoc) : '']);
    downloadCsv(`attendance-detail-${month}.csv`, out);
  }

  const openU = openUser ? rep.users.find((u) => u.id === openUser) : null;
  return (
    <>
      <div className="card">
        <h2 style={{ marginBottom: 10 }}>במשמרת עכשיו ({rep.active.length})</h2>
        {rep.active.length === 0 ? <p className="muted" style={{ margin: 0 }}>אף עובד לא במשמרת כרגע.</p> : (
          <div className="chips">
            {rep.active.map((s) => s.inLoc
              ? <a className="chip" key={s.id} href={mapUrl(s.inLoc)} target="_blank" rel="noopener noreferrer" title="מיקום הכניסה במפה">{names.get(s.userId) || '—'} · <span className="num">{clockT(s.start)}</span> · 📍</a>
              : <span className="chip" key={s.id}>{names.get(s.userId) || '—'} · <span className="num">{clockT(s.start)}</span></span>)}
          </div>
        )}
      </div>

      <MonthNav title={monthTitle(month)} onPrev={() => setMonth(shiftMonth(month, -1))} onNext={() => setMonth(shiftMonth(month, 1))} />
      <div className="stats">
        <div className="stat"><span className="label">סה״כ שעות</span><span className="num">{hm(tot.ms)}</span></div>
        <div className="stat"><span className="label">ימי עבודה (כל העובדים)</span><span className="num">{tot.days}</span></div>
        <div className="stat"><span className="label">שעות נוספות</span><span className="num">{hm(tot.ot1 + tot.ot2)}</span></div>
        <div className="stat"><span className="label">עלות שכר משוערת</span><span className="num">{money(tot.pay)}</span></div>
      </div>

      <div className="card">
        <div className="bar" style={{ marginBottom: 6 }}>
          <h2>סיכום לפי עובד</h2>
          <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn ghost sm" type="button" onClick={exportSummary}>ייצוא סיכום</button>
            <button className="btn ghost sm" type="button" onClick={exportDetail}>ייצוא מפורט</button>
          </span>
        </div>
        {rows.length === 0 ? (
          <div className="empty"><strong>אין עובדים עדיין</strong><span className="muted">הוסיפו עובדים בלשונית &quot;עובדים&quot;. כל עובד מקבל שם משתמש וסיסמה.</span></div>
        ) : (
          <div className="tablewrap">
            <table>
              <thead><tr>
                <th>עובד</th><th className="n">ימים</th><th className="n">שעות</th><th className="n">{r1}%</th><th className="n">{r2}%</th><th className="n">שכר משוער</th>
              </tr></thead>
              <tbody>
                {rows.map(({ u, sum }) => (
                  <tr key={u.id} onClick={() => setOpenUser(u.id)} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') setOpenUser(u.id); }}>
                    <td>{u.name}{!u.active ? <span className="tag edit" style={{ marginInlineStart: 6 }}>מושבת</span> : null}</td>
                    <td className="n">{sum.nDays}</td><td className="n">{hm(sum.tot)}</td><td className="n">{hm(sum.ot1)}</td><td className="n">{hm(sum.ot2)}</td>
                    <td className="n">{money(sum.pay.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr>
                <td>סה״כ</td><td className="n">{tot.days}</td><td className="n">{hm(tot.ms)}</td><td className="n">{hm(tot.ot1)}</td><td className="n">{hm(tot.ot2)}</td><td className="n">{money(tot.pay)}</td>
              </tr></tfoot>
            </table>
          </div>
        )}
        {rows.length ? <p className="hint" style={{ marginTop: 8 }}>לחצו על עובד כדי לראות את כל המשמרות שלו ולתקן אותן.</p> : null}
      </div>

      {openU ? <EmployeeSheet u={openU} shifts={byUser.get(openU.id) || []} st={st} month={month} now={now} reload={reload} toast={toast} onClose={() => setOpenUser(null)} /> : null}
    </>
  );
}

function EmployeeSheet({ u, shifts, st, month, now, reload, toast, onClose }: {
  u: PublicUser; shifts: Shift[]; st: PublicSettings; month: string; now: number; reload: () => Promise<void>; toast: Toast; onClose: () => void;
}) {
  const [edit, setEdit] = useState<Shift | 'new' | null>(null);
  const sum = summarize(shifts, st, u.wage, u.travel, now);
  async function save(v: Record<string, unknown>) {
    try {
      if (edit && edit !== 'new') await api(`/api/shifts/${edit.id}`, 'PATCH', v);
      else await api('/api/shifts', 'POST', { ...v, userId: u.id });
      setEdit(null); toast('המשמרת נשמרה'); await reload(); return null;
    } catch (e) { return (e as Error).message; }
  }
  async function del() {
    if (!edit || edit === 'new') return null;
    try { await api(`/api/shifts/${edit.id}`, 'DELETE'); setEdit(null); toast('המשמרת נמחקה'); await reload(); return null; }
    catch (e) { return (e as Error).message; }
  }
  if (edit) {
    return <ShiftEditor shift={edit === 'new' ? null : edit} now={now} title={`${edit === 'new' ? 'הוספת משמרת' : 'תיקון משמרת'} · ${u.name}`}
      onSave={save} onDelete={edit === 'new' ? undefined : del} onClose={() => setEdit(null)} showLocations />;
  }
  return (
    <Sheet title={`${u.name} · ${monthTitle(month)}`} onClose={onClose}>
      <div className="form">
        <div className="pay">
          <div className="payline"><span>ימי עבודה</span><span className="num">{sum.nDays}</span></div>
          <div className="payline"><span>שעות רגילות ({hm(sum.reg)} × {money(u.wage)})</span><span className="num">{money(sum.pay.reg)}</span></div>
          {st.otEnabled ? <>
            <div className="payline"><span>נוספות {Math.round(st.ot1Rate * 100)}% ({hm(sum.ot1)})</span><span className="num">{money(sum.pay.ot1)}</span></div>
            <div className="payline"><span>נוספות {Math.round(st.ot2Rate * 100)}% ({hm(sum.ot2)})</span><span className="num">{money(sum.pay.ot2)}</span></div>
          </> : null}
          {sum.pay.travel ? <div className="payline"><span>נסיעות</span><span className="num">{money(sum.pay.travel)}</span></div> : null}
          <div className="payline total"><span>סה״כ ברוטו · {hm(sum.tot)} שעות</span><span className="num">{money(sum.pay.total)}</span></div>
        </div>
        <div className="bar"><h3>משמרות</h3><button className="btn ghost sm" type="button" onClick={() => setEdit('new')}>+ הוספת משמרת</button></div>
        <div className="list">
          {shifts.length === 0 ? <div className="empty muted">אין משמרות בחודש הזה.</div>
            : [...shifts].sort((a, b) => b.start - a.start).map((s) => (
              <ShiftRow key={s.id} s={s} now={now} stdHours={st.stdHours} otEnabled={st.otEnabled} onClick={() => setEdit(s)} showLoc />
            ))}
        </div>
      </div>
    </Sheet>
  );
}

/* ---------------- עובדים ---------------- */
function UsersView({ users, st, reload, toast }: { users: PublicUser[]; st: PublicSettings; reload: () => Promise<void>; toast: Toast }) {
  const [edit, setEdit] = useState<PublicUser | 'new' | null>(null);
  return (
    <>
      <div className="card">
        <div className="bar" style={{ marginBottom: 6 }}>
          <h2>עובדים ({users.length})</h2>
          <button className="btn primary sm" type="button" onClick={() => setEdit('new')}>+ עובד חדש</button>
        </div>
        <div className="list">
          {users.length === 0 ? (
            <div className="empty"><strong>אין עובדים עדיין</strong><span className="muted">הוסיפו עובד, ושלחו לו את שם המשתמש והסיסמה כדי שיוכל להתחבר ולדווח שעות.</span></div>
          ) : users.map((u) => (
            <button key={u.id} type="button" className="rowbtn" onClick={() => setEdit(u)}>
              <div className="row" style={{ gridTemplateColumns: '1fr auto' }}>
                <div className="mid">
                  <strong>{u.name}</strong>
                  <span className="note">שם משתמש: <span className="num">{u.username}</span></span>
                </div>
                <div className="tot">
                  <span className="num">{money(u.wage)}/שעה</span>
                  <span className={`pill ${u.active ? 'on' : 'off'}`}>{u.active ? 'פעיל' : 'מושבת'}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
      {edit ? <UserEditor user={edit === 'new' ? null : edit} st={st} onClose={() => setEdit(null)} onSaved={async (m) => { setEdit(null); toast(m); await reload(); }} /> : null}
    </>
  );
}

function UserEditor({ user, st, onClose, onSaved }: { user: PublicUser | null; st: PublicSettings; onClose: () => void; onSaved: (msg: string) => Promise<void> }) {
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [password, setPassword] = useState('');
  const [wage, setWage] = useState(String(user?.wage ?? 40));
  const [travel, setTravel] = useState(user?.travel == null ? '' : String(user.travel));
  const [active, setActive] = useState(user?.active ?? true);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      const data = { name, username, wage, travel, active, ...(password ? { password } : {}) };
      if (user) await api(`/api/admin/users/${user.id}`, 'PATCH', data);
      else await api('/api/admin/users', 'POST', data);
      await onSaved(user ? 'פרטי העובד נשמרו' : `העובד נוסף. שם משתמש: ${username}`);
    } catch (x) { setErr((x as Error).message); }
    setBusy(false);
  }
  async function del() {
    if (!user) return;
    setBusy(true);
    try { await api(`/api/admin/users/${user.id}`, 'DELETE'); await onSaved('העובד נמחק'); } catch (x) { setErr((x as Error).message); }
    setBusy(false);
  }

  return (
    <Sheet title={user ? `עריכת עובד · ${user.name}` : 'עובד חדש'} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <div className="field"><label className="label" htmlFor="uName">שם מלא</label>
          <input id="uName" value={name} onChange={(e) => setName(e.target.value)} required maxLength={60} /></div>
        <div className="grid2">
          <div className="field"><label className="label" htmlFor="uUser">שם משתמש</label>
            <input id="uUser" value={username} onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))} required autoCapitalize="none" autoComplete="off" maxLength={32} /></div>
          <div className="field"><label className="label" htmlFor="uPass">{user ? 'סיסמה חדשה' : 'סיסמה'}</label>
            <input id="uPass" type="text" value={password} onChange={(e) => setPassword(e.target.value)} required={!user} autoComplete="new-password" placeholder={user ? 'השאירו ריק בלי שינוי' : 'לפחות 4 תווים'} /></div>
        </div>
        <div className="grid2">
          <div className="field"><label className="label" htmlFor="uWage">שכר לשעה (₪)</label>
            <input id="uWage" type="number" min={0} step={0.5} inputMode="decimal" value={wage} onChange={(e) => setWage(e.target.value)} /></div>
          <div className="field"><label className="label" htmlFor="uTravel">נסיעות ליום (₪)</label>
            <input id="uTravel" type="number" min={0} step={0.5} inputMode="decimal" value={travel} onChange={(e) => setTravel(e.target.value)} placeholder={`ברירת מחדל: ${st.travelPerDay}`} /></div>
        </div>
        {user ? (
          <label className="toggle" htmlFor="uActive"><input id="uActive" type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            <span>עובד פעיל<br /><span className="hint">עובד מושבת לא יכול להתחבר, אבל השעות שלו נשמרות בדוחות.</span></span></label>
        ) : null}
        {user && password ? <p className="hint">אחרי החלפת סיסמה העובד ינותק ויצטרך להתחבר עם הסיסמה החדשה.</p> : null}
        {err ? <p className="err" role="alert">{err}</p> : null}
        <button className="btn primary" type="submit" disabled={busy}>{busy ? 'שומר…' : user ? 'שמירה' : 'הוספת עובד'}</button>
        {user ? (confirmDel ? (
          <div className="confirm">
            <span>למחוק את {user.name} ואת כל המשמרות שלו? אי אפשר לבטל.</span>
            <span style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn sm ghost" onClick={() => setConfirmDel(false)}>ביטול</button>
              <button type="button" className="btn sm out" onClick={del} disabled={busy}>מחיקה</button>
            </span>
          </div>
        ) : <button type="button" className="btn danger-text" onClick={() => setConfirmDel(true)}>מחיקת עובד</button>) : null}
      </form>
    </Sheet>
  );
}

/* ---------------- הגדרות ---------------- */
function SettingsView({ st, reload, toast }: { st: PublicSettings; reload: () => Promise<void>; toast: Toast }) {
  const [f, setF] = useState({ ...st });
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [newPw2, setNewPw2] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof PublicSettings>(k: K, v: PublicSettings[K]) => setF((x) => ({ ...x, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    if (newPw && newPw !== newPw2) { setErr('הסיסמאות החדשות לא תואמות'); return; }
    setBusy(true);
    try {
      await api('/api/admin/settings', 'PUT', { ...f, ...(newPw ? { newAdminPassword: newPw, currentAdminPassword: curPw } : {}) });
      setCurPw(''); setNewPw(''); setNewPw2('');
      toast(newPw ? 'ההגדרות וסיסמת המנהל נשמרו' : 'ההגדרות נשמרו');
      await reload();
    } catch (x) { setErr((x as Error).message); }
    setBusy(false);
  }

  return (
    <form className="card form" onSubmit={submit}>
      <h2>הגדרות</h2>
      <div className="field"><label className="label" htmlFor="sName">שם העסק</label>
        <input id="sName" value={f.companyName} onChange={(e) => set('companyName', e.target.value)} placeholder="יוצג לעובדים במסך הכניסה" /></div>

      <fieldset>
        <legend>שעות ושעות נוספות</legend>
        <div className="field"><label className="label" htmlFor="sStd">שעות תקן ליום</label>
          <input id="sStd" type="number" min={1} max={24} step={0.1} inputMode="decimal" value={f.stdHours} onChange={(e) => set('stdHours', Number(e.target.value))} /></div>
        <p className="hint">לפי החוק: 8.4 שעות בשבוע עבודה של 5 ימים (42 שעות), 7 שעות בשבוע של 6 ימים.</p>
        <label className="toggle" htmlFor="sOt"><input id="sOt" type="checkbox" checked={f.otEnabled} onChange={(e) => set('otEnabled', e.target.checked)} /> חישוב שעות נוספות</label>
        {f.otEnabled ? (
          <div className="grid3">
            <div className="field"><label className="label" htmlFor="sOt1h">שעות בתעריף א׳</label>
              <input id="sOt1h" type="number" min={0} max={24} step={0.5} value={f.ot1Hours} onChange={(e) => set('ot1Hours', Number(e.target.value))} /></div>
            <div className="field"><label className="label" htmlFor="sOt1r">תעריף א׳ (%)</label>
              <input id="sOt1r" type="number" min={100} step={5} value={Math.round(f.ot1Rate * 100)} onChange={(e) => set('ot1Rate', Number(e.target.value) / 100)} /></div>
            <div className="field"><label className="label" htmlFor="sOt2r">תעריף ב׳ (%)</label>
              <input id="sOt2r" type="number" min={100} step={5} value={Math.round(f.ot2Rate * 100)} onChange={(e) => set('ot2Rate', Number(e.target.value) / 100)} /></div>
          </div>
        ) : null}
        <div className="field"><label className="label" htmlFor="sTravel">דמי נסיעה ליום עבודה (₪, ברירת מחדל)</label>
          <input id="sTravel" type="number" min={0} step={0.5} inputMode="decimal" value={f.travelPerDay} onChange={(e) => set('travelPerDay', Number(e.target.value))} /></div>
      </fieldset>

      <fieldset>
        <legend>הרשאות עובדים</legend>
        <label className="toggle" htmlFor="sEdit"><input id="sEdit" type="checkbox" checked={f.allowEmployeeEdit} onChange={(e) => set('allowEmployeeEdit', e.target.checked)} />
          <span>עובדים יכולים להוסיף ולתקן משמרות בעצמם<br /><span className="hint">כל תיקון מסומן בדוח כ&quot;הוזן ידנית&quot;.</span></span></label>
        <label className="toggle" htmlFor="sPay"><input id="sPay" type="checkbox" checked={f.showPayToEmployees} onChange={(e) => set('showPayToEmployees', e.target.checked)} />
          עובדים רואים את השכר המשוער שלהם</label>
        <label className="toggle" htmlFor="sLoc"><input id="sLoc" type="checkbox" checked={f.requireLocation} onChange={(e) => set('requireLocation', e.target.checked)} />
          <span>חובה לאשר מיקום בכניסה וביציאה<br /><span className="hint">המיקום נשמר רק ברגע הלחיצה, לא במעקב רציף. כבוי: המיקום נשמר רק אם העובד אישר.</span></span></label>
      </fieldset>

      <fieldset>
        <legend>החלפת סיסמת מנהל</legend>
        <div className="field"><label className="label" htmlFor="pCur">סיסמה נוכחית</label>
          <input id="pCur" type="password" autoComplete="current-password" value={curPw} onChange={(e) => setCurPw(e.target.value)} /></div>
        <div className="grid2">
          <div className="field"><label className="label" htmlFor="pNew">סיסמה חדשה</label>
            <input id="pNew" type="password" autoComplete="new-password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="לפחות 6 תווים" /></div>
          <div className="field"><label className="label" htmlFor="pNew2">אימות סיסמה</label>
            <input id="pNew2" type="password" autoComplete="new-password" value={newPw2} onChange={(e) => setNewPw2(e.target.value)} /></div>
        </div>
        <p className="hint">השאירו ריק אם לא רוצים להחליף.</p>
      </fieldset>

      {err ? <p className="err" role="alert">{err}</p> : null}
      <button className="btn primary lg" type="submit" disabled={busy}>{busy ? 'שומר…' : 'שמירת הגדרות'}</button>
    </form>
  );
}
