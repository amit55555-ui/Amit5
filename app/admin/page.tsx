'use client';

// ממשק הניהול: התחברות בסיסמה, דשבורד וניהול הדיווחים.
// מבקרים רגילים לא צריכים להגיע לכאן – רק המנהל.

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Leak, LeakStatus, LEAK_STATUSES, STATUS_LABELS } from '@/types';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminLeakCard from '@/components/admin/AdminLeakCard';

type Auth = 'loading' | 'not_configured' | 'logged_out' | 'logged_in';

function LoginForm({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'ההתחברות נכשלה');
      onLoggedIn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ההתחברות נכשלה');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card mx-auto mt-16 w-full max-w-sm p-6">
      <h1 className="mb-1 text-xl font-bold">🔒 כניסת מנהל</h1>
      <p className="mb-4 text-sm text-muted">מפת נזילות מים — תל אביב</p>
      <label className="label" htmlFor="pw">
        סיסמה
      </label>
      <input
        id="pw"
        type="password"
        autoComplete="current-password"
        className="field mb-3"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoFocus
      />
      {error && <p className="mb-3 text-sm text-open">{error}</p>}
      <button type="submit" className="btn-primary w-full" disabled={busy || !password}>
        {busy ? 'מתחבר…' : 'כניסה'}
      </button>
      <Link href="/" className="mt-4 block text-center text-sm text-brand hover:underline">
        חזרה למפה
      </Link>
    </form>
  );
}

export default function AdminPage() {
  const [auth, setAuth] = useState<Auth>('loading');
  const [leaks, setLeaks] = useState<Leak[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<LeakStatus | 'all'>('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [hiddenOnly, setHiddenOnly] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch('/api/admin/leaks', { cache: 'no-store' });
      if (res.status === 401) {
        setAuth('logged_out');
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'טעינת הדיווחים נכשלה');
      setLeaks(data.leaks as Leak[]);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'טעינת הדיווחים נכשלה');
    }
  }, []);

  useEffect(() => {
    fetch('/api/admin/login', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setAuth(!d.configured ? 'not_configured' : d.loggedIn ? 'logged_in' : 'logged_out'))
      .catch(() => setAuth('logged_out'));
  }, []);

  useEffect(() => {
    if (auth === 'logged_in') load();
  }, [auth, load]);

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    setLeaks([]);
    setAuth('logged_out');
  }

  const areas = useMemo(() => [...new Set(leaks.map((l) => l.area))].sort((a, b) => a.localeCompare(b, 'he')), [leaks]);

  const filtered = useMemo(() => {
    const q = search.trim();
    return leaks.filter(
      (l) =>
        (statusFilter === 'all' || l.status === statusFilter) &&
        (areaFilter === 'all' || l.area === areaFilter) &&
        (!hiddenOnly || l.photoHidden) &&
        (!q || l.description.includes(q) || l.area.includes(q) || l.comments.some((c) => c.text.includes(q))),
    );
  }, [leaks, statusFilter, areaFilter, hiddenOnly, search]);

  if (auth === 'loading') {
    return <div className="p-10 text-center text-muted">טוען…</div>;
  }

  if (auth === 'not_configured') {
    return (
      <div className="card mx-auto mt-16 max-w-md p-6 text-sm">
        <h1 className="mb-2 text-xl font-bold">ממשק הניהול עדיין לא הוגדר</h1>
        <p className="text-muted">
          יש להגדיר ב-Vercel משתנה סביבה בשם <code className="font-mono">LEAKMAP_ADMIN_PASSWORD</code> עם סיסמת
          המנהל, ולפרוס מחדש.
        </p>
      </div>
    );
  }

  if (auth === 'logged_out') {
    return (
      <div className="min-h-dvh px-4">
        <LoginForm onLoggedIn={() => setAuth('logged_in')} />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-dvh max-w-6xl px-4 py-6">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">ניהול מפת נזילות מים</h1>
          <p className="text-sm text-muted">תל אביב-יפו</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-ghost py-2 text-sm">
            ⟳ רענון
          </button>
          <Link href="/" className="btn-ghost py-2 text-sm">
            🗺️ למפה
          </Link>
          <button onClick={logout} className="btn-ghost py-2 text-sm">
            יציאה
          </button>
        </div>
      </header>

      {loadError && <p className="card mb-4 p-3 text-sm text-open">{loadError}</p>}

      <AdminDashboard
        leaks={leaks}
        onPickArea={(area) => {
          setAreaFilter(area);
          document.getElementById('reports')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      <section id="reports" className="mt-8">
        <h2 className="mb-3 text-lg font-bold">
          דיווחים <span className="text-sm font-normal text-muted">({filtered.length} מתוך {leaks.length})</span>
        </h2>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LeakStatus | 'all')}
            className="rounded-lg border border-line bg-white px-2 py-1.5 text-sm"
            aria-label="סינון לפי סטטוס"
          >
            <option value="all">כל הסטטוסים</option>
            {LEAK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="rounded-lg border border-line bg-white px-2 py-1.5 text-sm"
            aria-label="סינון לפי אזור"
          >
            <option value="all">כל האזורים</option>
            {areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <label className="inline-flex items-center gap-1.5 text-sm">
            <input type="checkbox" checked={hiddenOnly} onChange={(e) => setHiddenOnly(e.target.checked)} />
            רק תמונות מוסתרות
          </label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש בתיאור / הערות…"
            className="min-w-40 flex-1 rounded-lg border border-line bg-white px-3 py-1.5 text-sm"
          />
        </div>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <p className="card p-6 text-center text-sm text-muted">אין דיווחים להצגה.</p>
          ) : (
            filtered.map((leak) => (
              <AdminLeakCard
                key={leak.id}
                leak={leak}
                onUpdated={(u) => setLeaks((prev) => prev.map((l) => (l.id === u.id ? u : l)))}
                onDeleted={(id) => setLeaks((prev) => prev.filter((l) => l.id !== id))}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
