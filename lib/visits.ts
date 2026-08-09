// Lightweight site-traffic tracking.
// The public app sends a "visit" once per browser per day and a "ping"
// heartbeat while the tab is open. The server (functions/api/visits.js) keeps
// daily counts and a short-lived presence map so the admin can see how many
// people are on the site right now, today, this week and this month.

const HEARTBEAT_MS = 60_000;

function sid(): string {
  try {
    let s = sessionStorage.getItem('mz_sid');
    if (!s) {
      s = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem('mz_sid', s);
    }
    return s;
  } catch {
    return 'anon';
  }
}

function send(type: 'visit' | 'ping') {
  try {
    const body = JSON.stringify({ type, sid: sid() });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/visits', new Blob([body], { type: 'application/json' }));
    } else {
      fetch('/api/visits', { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true });
    }
  } catch {
    /* best effort */
  }
}

let started = false;
export function startVisitTracking() {
  if (typeof window === 'undefined' || started) return;
  started = true;
  // Count one visit per browser per day; otherwise just mark presence.
  try {
    const key = 'mz_visit_' + new Date().toISOString().slice(0, 10);
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, '1');
      send('visit');
    } else {
      send('ping');
    }
  } catch {
    send('visit');
  }
  // Heartbeat while the tab is visible (keeps "online now" accurate).
  setInterval(() => { if (document.visibilityState === 'visible') send('ping'); }, HEARTBEAT_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') send('ping');
  });
}

export interface VisitStats {
  online: number;
  today: number;
  last7: number;
  last30: number;
  series: { date: string; count: number }[];
}

// Admin-only: fetch aggregated traffic stats (gated by the admin password).
export async function fetchVisits(password: string): Promise<VisitStats | null> {
  try {
    const res = await fetch(`/api/visits?password=${encodeURIComponent(password)}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
