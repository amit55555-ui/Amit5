'use client';

// תוכן החלון שנפתח בלחיצה על סימון במפה: פרטי הדיווח, היסטוריית הערות,
// ושתי פעולות לכל מבקר (בלי התחברות): סימון "טופל" והוספת הערה.

import { useState } from 'react';
import { Leak, STATUS_LABELS } from '@/types';
import { timeAgo } from '@/lib/format';
import StatusBadge from '@/components/StatusBadge';

type Panel = 'none' | 'resolve' | 'comment';

export default function LeakPopup({ leak, onUpdated }: { leak: Leak; onUpdated: (leak: Leak) => void }) {
  const [panel, setPanel] = useState<Panel>('none');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function open(p: Panel) {
    setPanel(p);
    setText('');
    setError(null);
  }

  async function submit() {
    if (panel === 'comment' && !text.trim()) {
      setError('יש לכתוב הערה');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const url = panel === 'resolve' ? `/api/leaks/${leak.id}/resolve` : `/api/leaks/${leak.id}/comments`;
      const payload = panel === 'resolve' ? { note: text } : { text };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'הפעולה נכשלה');
      onUpdated(data.leak as Leak);
      setPanel('none');
      setText('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'הפעולה נכשלה');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-60 text-right" dir="rtl">
      <div className="mb-2 flex items-center justify-between gap-2">
        <StatusBadge status={leak.status} />
        <span className="text-xs text-muted">{leak.area}</span>
      </div>

      {leak.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={leak.photoUrl} alt="תמונת נזילה" className="mb-2 h-32 w-full rounded-lg object-cover" />
      ) : (
        <div className="mb-2 flex h-16 w-full items-center justify-center rounded-lg bg-cloud text-xs text-muted">
          התמונה הוסתרה ע״י מנהל
        </div>
      )}
      {leak.description && <p className="mb-1 text-sm text-ink">{leak.description}</p>}
      <p className="mb-2 text-xs text-muted">דווח {timeAgo(leak.createdAt)}</p>

      {leak.comments.length > 0 && (
        <ul className="mb-2 max-h-32 space-y-1 overflow-y-auto border-t border-line pt-2">
          {leak.comments.map((c) => (
            <li key={c.id} className="text-xs">
              <span className={c.kind === 'status' ? 'font-semibold text-ink' : 'text-ink'}>
                {c.author === 'admin' && c.kind === 'comment' ? 'מנהל: ' : ''}
                {c.text}
              </span>{' '}
              <span className="text-muted">· {timeAgo(c.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}

      {panel === 'none' ? (
        <div className="flex gap-1.5 border-t border-line pt-2">
          {leak.status !== 'resolved' && (
            <button onClick={() => open('resolve')} className="popup-btn popup-btn-primary">
              ✔ המפגע טופל
            </button>
          )}
          <button onClick={() => open('comment')} className="popup-btn">
            💬 הוספת הערה
          </button>
        </div>
      ) : (
        <div className="border-t border-line pt-2">
          <p className="mb-1 text-xs font-semibold text-ink">
            {panel === 'resolve' ? `לסמן את הדיווח כ״${STATUS_LABELS.resolved}״?` : 'הערה על הדיווח'}
          </p>
          <textarea
            className="mb-1.5 w-full resize-none rounded-lg border border-line p-2 text-xs outline-none focus:border-brand"
            rows={2}
            maxLength={500}
            placeholder={panel === 'resolve' ? 'הערה (לא חובה) – למשל: הברז הוחלף' : 'כתבו הערה…'}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {error && <p className="mb-1 text-xs text-open">{error}</p>}
          <div className="flex gap-1.5">
            <button onClick={() => setPanel('none')} className="popup-btn" disabled={busy}>
              ביטול
            </button>
            <button onClick={submit} className="popup-btn popup-btn-primary" disabled={busy}>
              {busy ? 'שולח…' : panel === 'resolve' ? 'אישור' : 'שליחה'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
