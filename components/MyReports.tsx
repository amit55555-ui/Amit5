'use client';

import { useEffect, useState } from 'react';
import { Report } from '@/types';
import { fetchReports, getResidentToken } from '@/lib/client';
import ReportCard from './ReportCard';

export default function MyReports({ refreshKey }: { refreshKey: number }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');

  async function load() {
    setLoading(true);
    const items = await fetchReports({ token: getResidentToken() });
    setReports(items);
    setName(items[0]?.reporterName || '');
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  function onUpdated(updated: Report) {
    setReports((rs) => rs.map((r) => (r.id === updated.id ? updated : r)));
  }

  if (loading) {
    return <div className="card p-8 text-center text-muted">טוען…</div>;
  }

  if (reports.length === 0) {
    return (
      <div className="card p-8 text-center">
        <div className="mb-2 text-4xl">📭</div>
        <p className="font-semibold">עדיין אין לך פניות</p>
        <p className="mt-1 text-sm text-muted">דווחו על תקלה בלשונית «דיווח חדש» והיא תופיע כאן.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted">
        סך הכול {reports.length} פניות שלך{name ? ` · ${name}` : ''}
      </div>
      {reports.map((r) => (
        <ReportCard
          key={r.id}
          report={r}
          role="resident"
          authorName={r.reporterName}
          onUpdated={onUpdated}
        />
      ))}
    </div>
  );
}
