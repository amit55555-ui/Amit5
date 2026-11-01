'use client';
import { useEffect, useState } from 'react';
import { breakMs, clockT, dayKey, dayLabel, hm, hmLong, H, hours, money, workMs, type Summary } from '@/lib/calc';
import type { Loc, PublicSettings, Shift } from '@/lib/types';

export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(t); }, [ms]);
  return now;
}

export function useToast() {
  const [msg, setMsg] = useState('');
  useEffect(() => { if (!msg) return; const t = setTimeout(() => setMsg(''), 2800); return () => clearTimeout(t); }, [msg]);
  const node = msg ? <div className="toast" role="status">{msg}</div> : null;
  return [node, setMsg] as const;
}

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="sheet-bg" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="bar" style={{ marginBottom: 12 }}>
          <h2>{title}</h2>
          <button type="button" className="iconbtn" onClick={onClose} aria-label="סגירה">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** אריח סיכום: 10:30 גדול, ומתחתיו "10 שעות ו-30 דקות" */
export function HoursStat({ label, ms }: { label: string; ms: number }) {
  return (
    <div className="stat">
      <span className="label">{label}</span>
      <span className="num">{hm(ms)}</span>
      <span className="statsub">{hmLong(ms)}</span>
    </div>
  );
}

/** פירוט שכר שקוף: שעות ודקות × תעריף = סכום */
export function PayBreakdown({ sum, st, wage, travel, title }: { sum: Summary; st: PublicSettings; wage: number; travel: number | null; title: string }) {
  const line = (name: string, ms: number, rate: number, amount: number) => (
    <div className="payline">
      <span className="paytxt">
        <span>{name}</span>
        <span className="hint">{hmLong(ms)} <span className="num">({hours(ms)})</span> × {money(wage)}{rate !== 1 ? ` × ${Math.round(rate * 100)}%` : ''}</span>
      </span>
      <span className="num">{money(amount)}</span>
    </div>
  );
  const perDay = travel ?? st.travelPerDay ?? 0;
  return (
    <div className="card pay">
      <h2 style={{ marginBottom: 4 }}>{title}</h2>
      {line('שעות רגילות', sum.reg, 1, sum.pay.reg)}
      {st.otEnabled ? <>
        {line(`שעות נוספות ${Math.round(st.ot1Rate * 100)}%`, sum.ot1, st.ot1Rate, sum.pay.ot1)}
        {line(`שעות נוספות ${Math.round(st.ot2Rate * 100)}%`, sum.ot2, st.ot2Rate, sum.pay.ot2)}
      </> : null}
      {sum.pay.travel ? (
        <div className="payline">
          <span className="paytxt"><span>נסיעות</span><span className="hint">{sum.nDays} ימי עבודה × {money(perDay)}</span></span>
          <span className="num">{money(sum.pay.travel)}</span>
        </div>
      ) : null}
      <div className="payline total">
        <span className="paytxt"><span>סה״כ ברוטו</span><span className="hint" style={{ fontWeight: 400 }}>סה״כ {hmLong(sum.tot)} ב-{sum.nDays} ימי עבודה</span></span>
        <span className="num">{money(sum.pay.total)}</span>
      </div>
      <p className="hint">הערכה לפני מסים וניכויים. כל משמרת מחושבת לפי דקות שלמות. המספר בסוגריים הוא השעות בשבר עשרוני, כמו בתלוש.</p>
    </div>
  );
}

export const mapUrl = (l: Loc) => `https://www.google.com/maps?q=${l.lat},${l.lng}`;

/** קישורים למפה של מיקום הכניסה והיציאה */
export function LocLinks({ s }: { s: Shift }) {
  const item = (label: string, l: Loc | null | undefined, t: number | null) => (
    <div className="payline">
      <span>{label}{t ? <> · <span className="num">{clockT(t)}</span></> : null}</span>
      {l ? (
        <a href={mapUrl(l)} target="_blank" rel="noopener noreferrer">פתיחה במפה{l.acc ? ` (דיוק ±${l.acc} מ׳)` : ''}</a>
      ) : <span className="muted">{t ? 'לא נרשם' : '—'}</span>}
    </div>
  );
  return (
    <div className="pay" style={{ background: 'var(--sunk)', borderRadius: 10, padding: '10px 12px' }}>
      <span className="label">מיקום</span>
      {item('כניסה', s.inLoc, s.start)}
      {item('יציאה', s.outLoc, s.end)}
    </div>
  );
}

export function ShiftRow({ s, now, stdHours, otEnabled, onClick, showLoc }: { s: Shift; now: number; stdHours: number; otEnabled: boolean; onClick?: () => void; showLoc?: boolean }) {
  const w = workMs(s, now);
  const over = otEnabled ? Math.max(0, w - stdHours * H) : 0;
  const br = breakMs(s, now);
  const dl = dayLabel(dayKey(s.start));
  return (
    <button type="button" className="rowbtn" onClick={onClick} aria-disabled={!onClick}>
      <div className="row">
        <div className="day"><b>{dl.d}</b><small>{dl.wd}</small></div>
        <div className="mid">
          <span className="num" style={{ textAlign: 'right' }}>{clockT(s.start)} – {s.end ? clockT(s.end) : '…'}</span>
          <span className="note">{br ? `הפסקה ${hm(br)}` : 'ללא הפסקה'}{s.note ? ` · ${s.note}` : ''}</span>
        </div>
        <div className="tot">
          <span className="num" style={{ fontWeight: 600 }}>{hm(w)}</span>
          {!s.end ? <span className="tag live">פעיל</span> : over > 0 ? <span className="tag ot">+{hm(over)} נוספות</span> : null}
          {s.inLoc || s.outLoc ? <span className="tag live">📍 מיקום</span> : showLoc && !s.editedBy ? <span className="tag edit">ללא מיקום</span> : null}
          {s.editedBy ? <span className="tag edit">{s.editedBy === 'admin' ? 'תוקן ע״י מנהל' : 'הוזן ידנית'}</span> : null}
        </div>
      </div>
    </button>
  );
}

/** טופס הוספה/תיקון משמרת. onSave מחזיר הודעת שגיאה או null */
export function ShiftEditor({ shift, now, title, onSave, onDelete, onClose, showLocations }: {
  shift: Shift | null; now: number; title: string; showLocations?: boolean;
  onSave: (v: { date: string; in: string; out: string; breakMin: number; note: string }) => Promise<string | null>;
  onDelete?: () => Promise<string | null>;
  onClose: () => void;
}) {
  const [date, setDate] = useState(shift ? dayKey(shift.start) : dayKey(now));
  const [tin, setTin] = useState(shift ? clockT(shift.start) : '09:00');
  const [tout, setTout] = useState(shift ? (shift.end ? clockT(shift.end) : '') : '17:30');
  const [brk, setBrk] = useState(String(shift ? Math.round(breakMs(shift, now) / 60000) : 30));
  const [note, setNote] = useState(shift?.note || '');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr('');
    const r = await onSave({ date, in: tin, out: tout, breakMin: Number(brk) || 0, note });
    setBusy(false);
    if (r) setErr(r);
  }
  async function del() {
    if (!onDelete) return;
    setBusy(true);
    const r = await onDelete();
    setBusy(false);
    if (r) setErr(r);
  }

  return (
    <Sheet title={title} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        {showLocations && shift ? <LocLinks s={shift} /> : null}
        <div className="field"><label className="label" htmlFor="eDate">תאריך</label>
          <input id="eDate" type="date" required value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <div className="grid2">
          <div className="field"><label className="label" htmlFor="eIn">כניסה</label>
            <input id="eIn" type="time" required value={tin} onChange={(e) => setTin(e.target.value)} /></div>
          <div className="field"><label className="label" htmlFor="eOut">יציאה</label>
            <input id="eOut" type="time" value={tout} onChange={(e) => setTout(e.target.value)} required={!(shift && !shift.end)} /></div>
        </div>
        <div className="field"><label className="label" htmlFor="eBrk">הפסקה (דקות)</label>
          <input id="eBrk" type="number" min={0} step={5} inputMode="numeric" value={brk} onChange={(e) => setBrk(e.target.value)} /></div>
        <div className="field"><label className="label" htmlFor="eNote">הערה</label>
          <input id="eNote" type="text" maxLength={120} placeholder="לדוגמה: עבודה מהבית" value={note} onChange={(e) => setNote(e.target.value)} /></div>
        {shift && !shift.end ? <p className="hint">המשמרת פעילה. השאירו &quot;יציאה&quot; ריק כדי להמשיך אותה.</p> : null}
        <p className="hint">אם שעת היציאה מוקדמת משעת הכניסה, המשמרת נחשבת כמשמרת לילה שנגמרת למחרת.</p>
        {err ? <p className="err" role="alert">{err}</p> : null}
        <button className="btn primary" type="submit" disabled={busy}>{busy ? 'שומר…' : 'שמירה'}</button>
        {onDelete ? (confirmDel ? (
          <div className="confirm">
            <span>למחוק את המשמרת?</span>
            <span style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn sm ghost" onClick={() => setConfirmDel(false)}>ביטול</button>
              <button type="button" className="btn sm out" onClick={del} disabled={busy}>מחיקה</button>
            </span>
          </div>
        ) : (
          <button type="button" className="btn danger-text" onClick={() => setConfirmDel(true)}>מחיקת משמרת</button>
        )) : null}
      </form>
    </Sheet>
  );
}

export function MonthNav({ title, onPrev, onNext }: { title: string; onPrev: () => void; onNext: () => void }) {
  return (
    <div className="bar" style={{ flexWrap: 'nowrap' }}>
      <button className="iconbtn" type="button" onClick={onPrev} aria-label="חודש קודם">›</button>
      <h2>{title}</h2>
      <button className="iconbtn" type="button" onClick={onNext} aria-label="חודש הבא">‹</button>
    </div>
  );
}
