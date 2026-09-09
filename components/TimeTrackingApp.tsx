'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AttendanceEntry } from '@/types';
import {
  adminCreateEntry, adminDeleteEntry, adminUpdateEntry,
  clockIn, closeOwnEntry, fetchEntries,
} from '@/lib/attendance-client';
import ClockCard from './attendance/ClockCard';
import AdminLogin from './attendance/AdminLogin';
import DailyReport from './attendance/DailyReport';
import MonthlyReport from './attendance/MonthlyReport';

const ADMIN_STORAGE = 'attendance.admin.v1';

type Tab = 'daily' | 'monthly';

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}
function startOfMonth(d: Date): Date {
  const c = new Date(d);
  c.setDate(1);
  c.setHours(0, 0, 0, 0);
  return c;
}

export default function TimeTrackingApp() {
  const [entries, setEntries] = useState<AttendanceEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [adminPasscode, setAdminPasscode] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>('daily');
  const [currentDay, setCurrentDay] = useState(() => startOfDay(new Date()));
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(new Date()));

  const refresh = useCallback(async () => {
    try {
      const items = await fetchEntries();
      setEntries(items);
      setError('');
    } catch {
      setError('שגיאה בטעינת הנתונים מהשרת. מנסה שוב…');
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 20000);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(ADMIN_STORAGE) : null;
    if (saved) setAdminPasscode(saved);
  }, []);

  const openEntry = useMemo(() => entries.find((e) => e.clockOut == null), [entries]);

  async function guarded(fn: () => Promise<unknown>) {
    setBusy(true);
    setError('');
    try {
      await fn();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'משהו השתבש, נסה שוב');
    } finally {
      setBusy(false);
    }
  }

  function unlockAdmin(passcode: string) {
    setAdminPasscode(passcode);
    localStorage.setItem(ADMIN_STORAGE, passcode);
  }
  function lockAdmin() {
    setAdminPasscode(null);
    localStorage.removeItem(ADMIN_STORAGE);
  }

  return (
    <div className="mx-auto min-h-full max-w-2xl px-4 pb-16">
      <header className="py-6 text-center">
        <div className="mb-1 text-3xl">⏱️</div>
        <h1 className="text-xl font-bold sm:text-2xl">שעון נוכחות</h1>
        <p className="mt-1 text-sm text-muted">מעקב שעות עבודה — משותף לכל מי שיש לו את הקישור</p>
      </header>

      {error && (
        <div className="mb-4 rounded-xl border border-open/30 bg-red-50 px-4 py-2.5 text-sm text-open">{error}</div>
      )}

      <AdminLogin isAdmin={Boolean(adminPasscode)} onUnlock={unlockAdmin} onLock={lockAdmin} />

      {!loaded ? (
        <div className="card p-8 text-center text-muted">טוען…</div>
      ) : (
        <>
          <ClockCard
            openEntry={openEntry}
            busy={busy}
            onClockIn={(note) => guarded(() => clockIn(note))}
            onClockOut={(note) =>
              guarded(() => closeOwnEntry(openEntry!.id, Date.now(), note || undefined))
            }
            onManualClose={(entry, ts) => guarded(() => closeOwnEntry(entry.id, ts))}
          />

          <div className="card mt-4 p-5">
            <div className="mb-4 flex gap-1 border-b border-line">
              {[
                { id: 'daily' as Tab, label: 'דוח יומי' },
                { id: 'monthly' as Tab, label: 'דוח חודשי' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-bold transition ${
                    tab === t.id ? 'border-brand text-brand-dark' : 'border-transparent text-muted hover:text-ink'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === 'daily' ? (
              <DailyReport
                entries={entries}
                currentDay={currentDay}
                onPrevDay={() => setCurrentDay((d) => { const n = new Date(d); n.setDate(n.getDate() - 1); return n; })}
                onNextDay={() => setCurrentDay((d) => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; })}
                isAdmin={Boolean(adminPasscode)}
                busy={busy}
                onAdminSave={(id, changes) => guarded(() => adminUpdateEntry(adminPasscode!, id, changes))}
                onAdminDelete={(id) => guarded(() => adminDeleteEntry(adminPasscode!, id))}
                onAdminAdd={(input) => guarded(() => adminCreateEntry(adminPasscode!, input))}
              />
            ) : (
              <MonthlyReport
                entries={entries}
                currentMonth={currentMonth}
                onPrevMonth={() => setCurrentMonth((d) => { const n = new Date(d); n.setMonth(n.getMonth() - 1); return n; })}
                onNextMonth={() => setCurrentMonth((d) => { const n = new Date(d); n.setMonth(n.getMonth() + 1); return n; })}
                onSelectDay={(d) => { setCurrentDay(startOfDay(d)); setTab('daily'); }}
              />
            )}
          </div>
        </>
      )}

      <footer className="mt-10 text-center text-xs text-muted">
        הנתונים נשמרים בענן ומשותפים לכל מי שפותח את הקישור הזה
      </footer>
    </div>
  );
}
