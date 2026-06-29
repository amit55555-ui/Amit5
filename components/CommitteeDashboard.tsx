'use client';

import { useEffect, useMemo, useState } from 'react';
import { Report, ReportStatus, STATUS_LABELS } from '@/types';
import { ENTRANCES } from '@/data/building';
import { fetchReports, verifyPasscode } from '@/lib/client';
import ReportCard from './ReportCard';

const STORAGE = 'building.committee.v1';

export default function CommitteeDashboard() {
  const [unlocked, setUnlocked] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all');
  const [entranceFilter, setEntranceFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  // ניסיון פתיחה אוטומטי מקוד שמור
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE) : null;
    if (saved) {
      verifyPasscode(saved).then((ok) => {
        if (ok) {
          setPasscode(saved);
          setUnlocked(true);
        }
      });
    }
  }, []);

  async function load(code: string) {
    setLoading(true);
    const items = await fetchReports({ passcode: code });
    setReports(items);
    setLoading(false);
  }

  useEffect(() => {
    if (unlocked) load(passcode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked]);

  async function unlock() {
    setChecking(true);
    setError('');
    const ok = await verifyPasscode(codeInput);
    setChecking(false);
    if (ok) {
      setPasscode(codeInput);
      setUnlocked(true);
      localStorage.setItem(STORAGE, codeInput);
    } else {
      setError('קוד שגוי. נסו שוב.');
    }
  }

  function lock() {
    localStorage.removeItem(STORAGE);
    setUnlocked(false);
    setPasscode('');
    setCodeInput('');
    setReports([]);
  }

  function onUpdated(updated: Report) {
    setReports((rs) => rs.map((r) => (r.id === updated.id ? updated : r)));
  }

  const counts = useMemo(() => {
    return {
      open: reports.filter((r) => r.status === 'open').length,
      in_progress: reports.filter((r) => r.status === 'in_progress').length,
      closed: reports.filter((r) => r.status === 'closed').length,
      urgent: reports.filter((r) => r.priority === 'urgent' && r.status !== 'closed').length,
    };
  }, [reports]);

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (entranceFilter !== 'all' && r.entrance !== entranceFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const hay = `${r.ref} ${r.title} ${r.description} ${r.reporterName} ${r.apartment}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [reports, statusFilter, entranceFilter, search]);

  if (!unlocked) {
    return (
      <div className="card mx-auto max-w-sm p-6 text-center">
        <div className="mb-2 text-4xl">🔐</div>
        <h2 className="text-lg font-bold">כניסת ועד הבית</h2>
        <p className="mt-1 text-sm text-muted">הזינו את קוד הגישה כדי לראות את כל הפניות.</p>
        <input
          className="field mt-4 text-center tracking-widest"
          type="password"
          placeholder="קוד גישה"
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && unlock()}
        />
        {error && <p className="mt-2 text-sm text-open">{error}</p>}
        <button className="btn-primary mt-3 w-full" disabled={checking || !codeInput} onClick={unlock}>
          {checking ? 'בודק…' : 'כניסה'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* סטטיסטיקות */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'פתוחות', value: counts.open, color: 'text-open' },
          { label: 'בטיפול', value: counts.in_progress, color: 'text-progress' },
          { label: 'סגורות', value: counts.closed, color: 'text-closed' },
          { label: 'דחופות', value: counts.urgent, color: 'text-open' },
        ].map((s) => (
          <div key={s.label} className="card p-3 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted">{s.label}</div>
          </div>
        ))}
      </div>

      {/* סינון */}
      <div className="card space-y-3 p-3">
        <input
          className="field"
          placeholder="🔍 חיפוש לפי כותרת, שם, מספר פנייה…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <select
            className="field w-auto py-2"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ReportStatus | 'all')}
          >
            <option value="all">כל הסטטוסים</option>
            {(['open', 'in_progress', 'closed'] as ReportStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <select
            className="field w-auto py-2"
            value={entranceFilter}
            onChange={(e) => setEntranceFilter(e.target.value)}
          >
            <option value="all">כל הכניסות</option>
            {ENTRANCES.map((e) => (
              <option key={e} value={e}>
                כניסה {e}
              </option>
            ))}
          </select>
          <button className="btn-ghost px-3 py-2 text-sm" onClick={() => load(passcode)}>
            🔄 רענון
          </button>
          <button className="btn-ghost mr-auto px-3 py-2 text-sm" onClick={lock}>
            יציאה
          </button>
        </div>
      </div>

      {/* רשימה */}
      {loading ? (
        <div className="card p-8 text-center text-muted">טוען…</div>
      ) : filtered.length === 0 ? (
        <div className="card p-8 text-center text-muted">אין פניות התואמות לסינון.</div>
      ) : (
        <div className="space-y-3">
          <div className="text-sm text-muted">מוצגות {filtered.length} פניות</div>
          {filtered.map((r) => (
            <ReportCard
              key={r.id}
              report={r}
              role="committee"
              authorName="ועד הבית"
              passcode={passcode}
              onUpdated={onUpdated}
            />
          ))}
        </div>
      )}
    </div>
  );
}
