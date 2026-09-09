'use client';

import { useState } from 'react';
import { verifyAdminPasscode } from '@/lib/attendance-client';

export default function AdminLogin({
  isAdmin,
  onUnlock,
  onLock,
}: {
  isAdmin: boolean;
  onUnlock: (passcode: string) => void;
  onLock: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');

  if (isAdmin) {
    return (
      <div className="mb-4 flex items-center justify-between rounded-xl border border-admin/40 bg-admin-light px-4 py-2.5 text-sm">
        <span className="flex items-center gap-2 font-semibold text-admin">
          <span className="h-2 w-2 rounded-full bg-admin" />
          מצב עריכה: מנהל
        </span>
        <button className="text-admin underline hover:no-underline" onClick={onLock}>
          יציאה ממצב מנהל
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        className="mb-4 w-full rounded-xl border border-dashed border-line px-4 py-2.5 text-center text-sm text-muted hover:bg-cloud"
        onClick={() => setOpen(true)}
      >
        כניסת מנהל 🔐
      </button>
    );
  }

  async function unlock() {
    setChecking(true);
    setError('');
    const ok = await verifyAdminPasscode(codeInput);
    setChecking(false);
    if (ok) {
      onUnlock(codeInput);
      setOpen(false);
      setCodeInput('');
    } else {
      setError('קוד שגוי. נסה שוב.');
    }
  }

  return (
    <div className="card mb-4 space-y-2 p-4">
      <label className="label" htmlFor="admin-passcode">קוד גישת מנהל</label>
      <div className="flex gap-2">
        <input
          id="admin-passcode"
          type="password"
          className="field text-center tracking-widest"
          placeholder="קוד גישה"
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && unlock()}
        />
        <button className="btn-primary px-4" disabled={checking || !codeInput} onClick={unlock}>
          {checking ? 'בודק…' : 'כניסה'}
        </button>
        <button className="btn-ghost px-4" onClick={() => { setOpen(false); setError(''); setCodeInput(''); }}>
          ביטול
        </button>
      </div>
      {error && <p className="text-sm text-open">{error}</p>}
    </div>
  );
}
