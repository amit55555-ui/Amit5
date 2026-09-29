'use client';

// כרטיס דיווח בממשק הניהול: שינוי סטטוס, הסתרת תמונה, הערות ומחיקה

import { useState } from 'react';
import { Leak, LeakStatus, LEAK_STATUSES, STATUS_LABELS } from '@/types';
import { formatDateTime, timeAgo } from '@/lib/format';
import StatusBadge from '@/components/StatusBadge';

export default function AdminLeakCard({
  leak,
  onUpdated,
  onDeleted,
}: {
  leak: Leak;
  onUpdated: (leak: Leak) => void;
  onDeleted: (id: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [showComments, setShowComments] = useState(false);

  async function call(url: string, init: RequestInit): Promise<Record<string, unknown> | null> {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, {
        ...init,
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'הפעולה נכשלה');
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'הפעולה נכשלה');
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function patch(body: Record<string, unknown>) {
    const data = await call(`/api/admin/leaks/${leak.id}`, { method: 'PATCH', body: JSON.stringify(body) });
    if (data?.leak) onUpdated(data.leak as Leak);
    return Boolean(data);
  }

  async function remove() {
    if (!confirm('למחוק את הדיווח לצמיתות? לא ניתן לבטל פעולה זו.')) return;
    const data = await call(`/api/admin/leaks/${leak.id}`, { method: 'DELETE' });
    if (data) onDeleted(leak.id);
  }

  async function removeComment(id: string) {
    if (!confirm('למחוק את ההערה?')) return;
    const data = await call(`/api/admin/comments/${id}`, { method: 'DELETE' });
    if (data) onUpdated({ ...leak, comments: leak.comments.filter((c) => c.id !== id) });
  }

  async function sendComment() {
    if (!comment.trim()) return;
    if (await patch({ comment })) setComment('');
  }

  const mapUrl = `https://www.google.com/maps?q=${leak.lat},${leak.lng}`;

  return (
    <article className="card flex flex-col gap-3 p-3 sm:flex-row">
      <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-xl bg-cloud sm:h-32 sm:w-44">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={leak.photoUrl}
          alt="תמונת נזילה"
          className={`h-full w-full object-cover ${leak.photoHidden ? 'opacity-30 blur-sm' : ''}`}
        />
        {leak.photoHidden && (
          <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-xs font-bold text-ink">
            🚫 מוסתרת מהציבור
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <StatusBadge status={leak.status} />
          <span className="text-sm font-semibold">{leak.area}</span>
          <span className="text-xs text-muted" title={formatDateTime(leak.createdAt)}>
            · {timeAgo(leak.createdAt)}
          </span>
          <a href={mapUrl} target="_blank" rel="noreferrer" className="text-xs text-brand hover:underline">
            📍 במפה
          </a>
        </div>
        <p className="mb-2 text-sm text-ink">{leak.description || <span className="text-muted">ללא תיאור</span>}</p>

        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-semibold text-muted" htmlFor={`st-${leak.id}`}>
            סטטוס:
          </label>
          <select
            id={`st-${leak.id}`}
            value={leak.status}
            disabled={busy}
            onChange={(e) => patch({ status: e.target.value as LeakStatus })}
            className="rounded-lg border border-line bg-white px-2 py-1 text-sm"
          >
            {LEAK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <button
            onClick={() => patch({ photoHidden: !leak.photoHidden })}
            disabled={busy}
            className="rounded-lg border border-line bg-white px-2 py-1 text-sm hover:bg-cloud disabled:opacity-50"
          >
            {leak.photoHidden ? '👁️ הצג תמונה' : '🚫 הסתר תמונה'}
          </button>
          <button
            onClick={() => setShowComments((v) => !v)}
            className="rounded-lg border border-line bg-white px-2 py-1 text-sm hover:bg-cloud"
          >
            💬 הערות ({leak.comments.length})
          </button>
          <button
            onClick={remove}
            disabled={busy}
            className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            🗑️ מחיקה
          </button>
        </div>

        {error && <p className="mt-2 text-sm text-open">{error}</p>}

        {showComments && (
          <div className="mt-3 rounded-xl bg-cloud p-3">
            {leak.comments.length === 0 ? (
              <p className="mb-2 text-xs text-muted">אין הערות.</p>
            ) : (
              <ul className="mb-2 space-y-1.5">
                {leak.comments.map((c) => (
                  <li key={c.id} className="flex items-start justify-between gap-2 text-sm">
                    <span>
                      <span className="text-xs font-semibold text-muted">
                        {c.author === 'admin' ? 'מנהל' : 'תושב'} · {formatDateTime(c.createdAt)}:
                      </span>{' '}
                      {c.text}
                    </span>
                    <button
                      onClick={() => removeComment(c.id)}
                      disabled={busy}
                      className="shrink-0 text-xs text-red-700 hover:underline"
                    >
                      מחיקה
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendComment()}
                maxLength={500}
                placeholder="הערת מנהל (תוצג לציבור)…"
                className="flex-1 rounded-lg border border-line bg-white px-2 py-1 text-sm"
              />
              <button
                onClick={sendComment}
                disabled={busy || !comment.trim()}
                className="rounded-lg bg-brand px-3 py-1 text-sm font-semibold text-white disabled:opacity-50"
              >
                הוספה
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
