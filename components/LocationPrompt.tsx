'use client';
import { useCallback, useEffect, useState } from 'react';
import { getLocation } from '@/lib/client';
import { Sheet } from './ui';

type PermState = 'granted' | 'prompt' | 'denied' | 'unknown';

const KEY = 'att-loc-ok';

async function queryPermission(): Promise<PermState> {
  try {
    if (!navigator.permissions?.query) return 'unknown';
    const r = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    return r.state as PermState;
  } catch { return 'unknown'; }
}

function device(): 'ios' | 'android' | 'other' {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'other';
}

/** הוראות פתיחת מיקום כשהבקשה נחסמה בעבר */
function FixSteps() {
  const d = device();
  if (d === 'ios') {
    return (
      <ol className="steps">
        <li>פתחו את <b>הגדרות</b> באייפון.</li>
        <li><b>פרטיות ואבטחה</b> ← <b>שירותי מיקום</b>. ודאו שהמתג למעלה דלוק.</li>
        <li>גללו ל-<b>Safari</b> (או לדפדפן שבו פתחתם את האתר) ← בחרו <b>בזמן השימוש ביישום</b>.</li>
        <li>חזרו לכאן ולחצו &quot;נסו שוב&quot;.</li>
      </ol>
    );
  }
  if (d === 'android') {
    return (
      <ol className="steps">
        <li>לחצו על סמל המנעול או ההגדרות שליד כתובת האתר למעלה.</li>
        <li><b>הרשאות</b> ← <b>מיקום</b> ← <b>אפשר</b>.</li>
        <li>ודאו שה<b>מיקום</b> דלוק בטלפון (מושכים את התפריט העליון למטה).</li>
        <li>חזרו לכאן ולחצו &quot;נסו שוב&quot;.</li>
      </ol>
    );
  }
  return (
    <ol className="steps">
      <li>לחצו על סמל המנעול שליד כתובת האתר.</li>
      <li>בהרשאת <b>מיקום</b> בחרו <b>אפשר</b>.</li>
      <li>רעננו את הדף ולחצו &quot;נסו שוב&quot;.</li>
    </ol>
  );
}

/**
 * חלון שמבקש הרשאת מיקום מיד אחרי הכניסה.
 * לחיצה על "אישור מיקום" מקפיצה את חלון האישור של הטלפון.
 * `forceOpen` פותח אותו מבחוץ (למשל כשהחתמה נכשלה בגלל מיקום).
 */
export function LocationPrompt({ required, forceOpen, onClosed }: { required: boolean; forceOpen?: number; onClosed?: () => void }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<PermState>('unknown');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);

  const check = useCallback(async () => {
    const s = await queryPermission();
    setState(s);
    return s;
  }, []);

  // בדיקה ראשונית אחרי כניסה
  useEffect(() => {
    if (!required) return;
    (async () => {
      const s = await check();
      let remembered = false;
      try { remembered = localStorage.getItem(KEY) === '1'; } catch { /* ignore */ }
      if (s === 'prompt' || s === 'denied' || (s === 'unknown' && !remembered)) setOpen(true);
    })();
  }, [required, check]);

  // פתיחה מבחוץ
  useEffect(() => {
    if (forceOpen) { setErr(''); setDone(false); check(); setOpen(true); }
  }, [forceOpen, check]);

  async function ask() {
    setBusy(true); setErr('');
    const g = await getLocation();
    setBusy(false);
    if ('error' in g) {
      setErr(g.error);
      setState((await check()) === 'granted' ? 'granted' : 'denied');
      return;
    }
    try { localStorage.setItem(KEY, '1'); } catch { /* ignore */ }
    setState('granted');
    setDone(true);
    setTimeout(() => close(), 1200);
  }

  function close() { setOpen(false); onClosed?.(); }

  if (!open) return null;
  const blocked = state === 'denied';

  return (
    <Sheet title={done ? 'המיקום מאושר' : blocked ? 'המיקום חסום בטלפון' : 'אישור מיקום'} onClose={close}>
      <div className="form">
        {done ? (
          <p style={{ margin: 0, fontSize: '1.05rem' }}>✓ הכול מוכן. מעכשיו המיקום יירשם אוטומטית בכל כניסה ויציאה.</p>
        ) : blocked ? (
          <>
            <p style={{ margin: 0 }}>
              בקשת המיקום נחסמה בעבר, ולכן הטלפון לא מציג אותה שוב.
              {required ? ' בלי מיקום אי אפשר להחתים כניסה ויציאה.' : ''} כך פותחים אותה, פעם אחת בלבד:
            </p>
            <FixSteps />
            {err ? <p className="err" role="alert">{err}</p> : null}
            <button className="btn primary lg" type="button" onClick={ask} disabled={busy}>{busy ? 'בודק…' : 'נסו שוב'}</button>
          </>
        ) : (
          <>
            <div className="locicon" aria-hidden="true">📍</div>
            <p style={{ margin: 0, fontSize: '1.05rem' }}>
              כדי להחתים כניסה ויציאה, האפליקציה צריכה גישה למיקום.
            </p>
            <p className="hint">המיקום נשמר רק ברגע הלחיצה על כניסה או יציאה, לא במהלך המשמרת.</p>
            <p className="hint">אחרי הלחיצה הטלפון יציג חלון. בחרו <b>אפשר</b> (או <b>אפשר בזמן השימוש</b>).</p>
            {err ? <p className="err" role="alert">{err}</p> : null}
            <button className="btn in lg" type="button" onClick={ask} disabled={busy}>{busy ? 'ממתין לאישור…' : 'אישור מיקום'}</button>
            {!required ? <button className="btn ghost" type="button" onClick={close}>לא עכשיו</button> : null}
          </>
        )}
      </div>
    </Sheet>
  );
}
