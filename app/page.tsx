'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Leak } from '@/types';
import ReportLeakForm from '@/components/ReportLeakForm';

const LeakMap = dynamic(() => import('@/components/LeakMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-muted">טוען מפה…</div>
  ),
});

export default function Home() {
  const [leaks, setLeaks] = useState<Leak[]>([]);
  const [placing, setPlacing] = useState(false);
  const [pending, setPending] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/leaks');
        const data = await res.json();
        if (!cancelled && Array.isArray(data.leaks)) setLeaks(data.leaks);
      } catch {
        // רשת לא זמינה — ממשיכים עם מה שיש
      }
    }
    load();
    const interval = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <header className="pointer-events-none absolute inset-x-0 top-0 z-[500] flex justify-center p-3">
        <div className="pointer-events-auto rounded-2xl border border-line bg-white/95 px-4 py-2 text-center shadow backdrop-blur">
          <h1 className="text-base font-bold sm:text-lg">💧 מפת נזילות מים — תל אביב</h1>
          <p className="text-xs text-muted">דיווח אנונימי על טפטופי מים ברחבי העיר</p>
        </div>
      </header>

      <LeakMap leaks={leaks} placing={placing} pending={pending} onPick={(lat, lng) => {
        setPending({ lat, lng });
        setPlacing(false);
      }} />

      {placing && (
        <div className="pointer-events-none absolute inset-x-0 top-20 z-[500] flex justify-center px-3">
          <div className="pointer-events-auto rounded-xl bg-ink/90 px-4 py-2 text-sm font-medium text-white shadow">
            לחצו על המפה במקום שבו יש נזילה
          </div>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-5 z-[500] flex justify-center px-4">
        {!placing && !pending && (
          <button onClick={() => setPlacing(true)} className="btn-primary shadow-lg">
            <span className="text-lg">➕</span>
            דיווח על נזילה
          </button>
        )}
        {placing && (
          <button onClick={() => setPlacing(false)} className="btn-ghost shadow-lg">
            ביטול
          </button>
        )}
      </div>

      {pending && (
        <ReportLeakForm
          location={pending}
          onClose={() => setPending(null)}
          onCreated={(leak) => {
            setLeaks((prev) => [leak, ...prev]);
            setPending(null);
          }}
        />
      )}
    </div>
  );
}
