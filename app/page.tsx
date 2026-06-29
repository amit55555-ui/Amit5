'use client';

import { useState } from 'react';
import { BUILDING_NAME } from '@/data/building';
import ReportForm from '@/components/ReportForm';
import MyReports from '@/components/MyReports';
import CommitteeDashboard from '@/components/CommitteeDashboard';

type Tab = 'new' | 'mine' | 'committee';

export default function Home() {
  const [tab, setTab] = useState<Tab>('new');
  const [refreshKey, setRefreshKey] = useState(0);

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'new', label: 'דיווח חדש', icon: '➕' },
    { id: 'mine', label: 'הפניות שלי', icon: '📋' },
    { id: 'committee', label: 'ועד הבית', icon: '🛠️' },
  ];

  return (
    <div className="mx-auto min-h-full max-w-2xl px-4 pb-16">
      {/* כותרת */}
      <header className="py-6 text-center">
        <div className="mb-1 text-3xl">🏢</div>
        <h1 className="text-xl font-bold sm:text-2xl">{BUILDING_NAME}</h1>
        <p className="mt-1 text-sm text-muted">מערכת דיווח תקלות ומעקב פניות</p>
      </header>

      {/* טאבים */}
      <nav className="sticky top-2 z-10 mb-5 grid grid-cols-3 gap-1 rounded-2xl border border-line bg-white/90 p-1 backdrop-blur">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-2 py-2.5 text-sm font-semibold transition ${
              tab === t.id ? 'bg-brand text-white' : 'text-muted hover:bg-cloud'
            }`}
          >
            <span className="ml-1">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      <main>
        {tab === 'new' && (
          <ReportForm
            onCreated={() => {
              setRefreshKey((k) => k + 1);
              setTab('mine');
            }}
          />
        )}
        {tab === 'mine' && <MyReports refreshKey={refreshKey} />}
        {tab === 'committee' && <CommitteeDashboard />}
      </main>

      <footer className="mt-10 text-center text-xs text-muted">
        בנוי לניהול בניין · הפניות נשלחות לוועד במייל
      </footer>
    </div>
  );
}
