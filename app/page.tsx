'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Leak } from '@/types';
import ReportLeakForm from '@/components/ReportLeakForm';
import type { FlyTarget } from '@/components/LeakMap';

const LeakMap = dynamic(() => import('@/components/LeakMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-muted">טוען מפה…</div>
  ),
});

type Mode = 'idle' | 'locating' | 'confirm' | 'manual';

export default function Home() {
  const [leaks, setLeaks] = useState<Leak[]>([]);
  const [mode, setMode] = useState<Mode>('idle');
  const [pending, setPending] = useState<{ lat: number; lng: number } | null>(null);
  const [reportLocation, setReportLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [flyTarget, setFlyTarget] = useState<FlyTarget | null>(null);
  const [flyToken, setFlyToken] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

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

  function flyTo(lat: number, lng: number, zoom: number) {
    const token = flyToken + 1;
    setFlyToken(token);
    setFlyTarget({ lat, lng, zoom, token });
  }

  function goManual(message: string | null) {
    setNotice(message);
    setPending(null);
    setMode('manual');
  }

  function startReportFlow() {
    setNotice(null);
    if (!('geolocation' in navigator)) {
      goManual('הדפדפן לא תומך באיתור מיקום אוטומטי — בחרו מיקום ידנית על המפה');
      return;
    }
    setMode('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPending({ lat: latitude, lng: longitude });
        flyTo(latitude, longitude, 17);
        setMode('confirm');
      },
      () => {
        goManual('לא הצלחנו לאתר את מיקומך — בחרו מיקום ידנית על המפה');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }

  function cancelFlow() {
    setMode('idle');
    setPending(null);
    setNotice(null);
  }

  function confirmLocation() {
    if (!pending) return;
    setReportLocation(pending);
    setMode('idle');
    setPending(null);
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <header className="pointer-events-none absolute inset-x-0 top-0 z-[500] flex justify-center p-3">
        <div className="pointer-events-auto rounded-2xl border border-line bg-white/95 px-4 py-2 text-center shadow backdrop-blur">
          <h1 className="text-base font-bold sm:text-lg">💧 מפת נזילות מים — תל אביב</h1>
          <p className="text-xs text-muted">דיווח אנונימי על טפטופי מים ברחבי העיר</p>
        </div>
      </header>

      <LeakMap
        leaks={leaks}
        clickable={mode === 'manual' || mode === 'confirm'}
        pending={pending}
        pendingDraggable={mode === 'confirm'}
        flyTarget={flyTarget}
        onPick={(lat, lng) => {
          setPending({ lat, lng });
          if (mode === 'manual') setMode('confirm');
        }}
        onDragPending={(lat, lng) => setPending({ lat, lng })}
      />

      {mode === 'locating' && (
        <div className="pointer-events-none absolute inset-x-0 top-20 z-[500] flex justify-center px-3">
          <div className="pointer-events-auto flex items-center gap-2 rounded-xl bg-ink/90 px-4 py-2 text-sm font-medium text-white shadow">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            מאתרים את מיקומך…
          </div>
        </div>
      )}

      {mode === 'confirm' && (
        <div className="pointer-events-none absolute inset-x-0 top-20 z-[500] flex justify-center px-3">
          <div className="pointer-events-auto max-w-xs rounded-xl bg-ink/90 px-4 py-2 text-center text-sm font-medium text-white shadow">
            זה המיקום של הנזילה? אפשר לגרור את הסימון או ללחוץ במקום אחר במפה לדיוק
          </div>
        </div>
      )}

      {mode === 'manual' && (
        <div className="pointer-events-none absolute inset-x-0 top-20 z-[500] flex justify-center px-3">
          <div className="pointer-events-auto max-w-xs rounded-xl bg-ink/90 px-4 py-2 text-center text-sm font-medium text-white shadow">
            {notice ?? 'לחצו על המפה במקום שבו יש נזילה'}
          </div>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-5 z-[500] flex justify-center gap-2 px-4">
        {mode === 'idle' && (
          <button onClick={startReportFlow} className="btn-primary shadow-lg">
            <span className="text-lg">➕</span>
            דיווח על נזילה
          </button>
        )}
        {mode === 'locating' && (
          <button onClick={cancelFlow} className="btn-ghost shadow-lg">
            ביטול
          </button>
        )}
        {mode === 'confirm' && (
          <>
            <button onClick={cancelFlow} className="btn-ghost shadow-lg">
              ביטול
            </button>
            <button onClick={() => goManual(null)} className="btn-ghost shadow-lg">
              בחירה ידנית במפה
            </button>
            <button onClick={confirmLocation} className="btn-primary shadow-lg">
              אשר מיקום ✔
            </button>
          </>
        )}
        {mode === 'manual' && (
          <button onClick={cancelFlow} className="btn-ghost shadow-lg">
            ביטול
          </button>
        )}
      </div>

      {reportLocation && (
        <ReportLeakForm
          location={reportLocation}
          onClose={() => setReportLocation(null)}
          onCreated={(leak) => {
            setLeaks((prev) => [leak, ...prev]);
            setReportLocation(null);
          }}
        />
      )}
    </div>
  );
}
