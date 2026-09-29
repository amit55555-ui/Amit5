'use client';

// דשבורד מנהל: כמויות, סטטוס טיפול והתפלגות לפי אזורים.
// כל החישובים נעשים בצד הלקוח מתוך רשימת הדיווחים המלאה.

import { Leak, LeakStatus, LEAK_STATUSES, STATUS_LABELS } from '@/types';
import { STATUS_ICONS } from '@/components/StatusBadge';

// צבעי סטטוס (תואמים לסימונים במפה) – תמיד מלווים באייקון ותווית
const STATUS_COLORS: Record<LeakStatus, string> = {
  open: '#dc2626',
  in_progress: '#d97706',
  resolved: '#16a34a',
};

type Counts = Record<LeakStatus, number>;

function emptyCounts(): Counts {
  return { open: 0, in_progress: 0, resolved: 0 };
}

function StatTile({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-ink">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

// פס אופקי מחולק לפי סטטוס; מעבר עכבר מציג את הכמות המדויקת
function StatusBar({ counts, total }: { counts: Counts; total: number }) {
  if (total === 0) return <div className="h-3 w-full rounded bg-cloud" />;
  return (
    <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded">
      {LEAK_STATUSES.filter((s) => counts[s] > 0).map((s) => (
        <div
          key={s}
          title={`${STATUS_LABELS[s]}: ${counts[s]} (${Math.round((counts[s] / total) * 100)}%)`}
          style={{ width: `${(counts[s] / total) * 100}%`, background: STATUS_COLORS[s] }}
          className="h-full first:rounded-r last:rounded-l"
        />
      ))}
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-3 text-xs text-muted">
      {LEAK_STATUSES.map((s) => (
        <span key={s} className="inline-flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: STATUS_COLORS[s] }} />
          {STATUS_ICONS[s]} {STATUS_LABELS[s]}
        </span>
      ))}
    </div>
  );
}

export default function AdminDashboard({
  leaks,
  onPickArea,
}: {
  leaks: Leak[];
  onPickArea: (area: string) => void;
}) {
  const total = leaks.length;
  const counts = emptyCounts();
  for (const l of leaks) counts[l.status]++;

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const lastWeek = leaks.filter((l) => l.createdAt >= weekAgo).length;
  const hiddenPhotos = leaks.filter((l) => l.photoHidden).length;
  const resolvedPct = total ? Math.round((counts.resolved / total) * 100) : 0;

  // זמן טיפול ממוצע (מדיווח ועד סימון "טופל")
  const resolvedTimes = leaks
    .filter((l) => l.status === 'resolved' && l.resolvedAt)
    .map((l) => (l.resolvedAt as number) - l.createdAt);
  const avgDays = resolvedTimes.length
    ? resolvedTimes.reduce((a, b) => a + b, 0) / resolvedTimes.length / (24 * 60 * 60 * 1000)
    : null;

  const byArea = new Map<string, Counts>();
  for (const l of leaks) {
    const c = byArea.get(l.area) ?? emptyCounts();
    c[l.status]++;
    byArea.set(l.area, c);
  }
  const areaRows = [...byArea.entries()]
    .map(([area, c]) => ({ area, c, total: c.open + c.in_progress + c.resolved }))
    .sort((a, b) => b.total - a.total || b.c.open - a.c.open);

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="סה״כ דיווחים" value={total} hint={`${lastWeek} בשבוע האחרון`} />
        <StatTile label={`${STATUS_ICONS.open} פתוחים`} value={counts.open} />
        <StatTile label={`${STATUS_ICONS.in_progress} בטיפול`} value={counts.in_progress} />
        <StatTile label={`${STATUS_ICONS.resolved} טופלו`} value={counts.resolved} hint={`${resolvedPct}% מהדיווחים`} />
        <StatTile
          label="זמן טיפול ממוצע"
          value={avgDays === null ? '—' : avgDays < 1 ? '< יום' : `${avgDays.toFixed(1)} ימים`}
        />
        <StatTile label="תמונות מוסתרות" value={hiddenPhotos} />
      </div>

      <div className="card p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-bold">סטטוס טיפול</h2>
          <Legend />
        </div>
        <StatusBar counts={counts} total={total} />
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 p-4 pb-2">
          <h2 className="font-bold">דיווחים לפי אזור</h2>
          <Legend />
        </div>
        {areaRows.length === 0 ? (
          <p className="p-4 pt-0 text-sm text-muted">אין עדיין דיווחים.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="text-xs text-muted">
                <tr className="border-b border-line">
                  <th className="px-4 py-2 text-right font-semibold">אזור</th>
                  <th className="px-2 py-2 text-right font-semibold">סה״כ</th>
                  <th className="w-1/3 px-2 py-2 text-right font-semibold">התפלגות</th>
                  <th className="px-2 py-2 text-right font-semibold">פתוח</th>
                  <th className="px-2 py-2 text-right font-semibold">בטיפול</th>
                  <th className="px-4 py-2 text-right font-semibold">טופל</th>
                </tr>
              </thead>
              <tbody>
                {areaRows.map(({ area, c, total: t }) => (
                  <tr key={area} className="border-b border-line last:border-0 hover:bg-cloud">
                    <td className="px-4 py-2">
                      <button
                        onClick={() => onPickArea(area)}
                        className="font-semibold text-brand hover:underline"
                        title="הצג את הדיווחים באזור זה"
                      >
                        {area}
                      </button>
                    </td>
                    <td className="px-2 py-2 font-bold tabular-nums">{t}</td>
                    <td className="px-2 py-2">
                      <StatusBar counts={c} total={t} />
                    </td>
                    <td className="px-2 py-2 tabular-nums">{c.open}</td>
                    <td className="px-2 py-2 tabular-nums">{c.in_progress}</td>
                    <td className="px-4 py-2 tabular-nums">{c.resolved}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
