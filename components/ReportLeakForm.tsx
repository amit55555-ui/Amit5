'use client';

import { useState } from 'react';
import { Leak } from '@/types';
import { fileToCompressedDataUrl } from '@/lib/image';

export default function ReportLeakForm({
  location,
  onClose,
  onCreated,
}: {
  location: { lat: number; lng: number };
  onClose: () => void;
  onCreated: (leak: Leak) => void;
}) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | null) {
    if (!file) return;
    setError(null);
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      setPhoto(dataUrl);
    } catch {
      setError('לא הצלחנו לקרוא את התמונה. נסו תמונה אחרת.');
    }
  }

  async function submit() {
    if (!photo) {
      setError('יש לצרף תמונה של הנזילה');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/leaks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: location.lat, lng: location.lng, description, photo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'שליחת הדיווח נכשלה');
      onCreated(data.leak as Leak);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שליחת הדיווח נכשלה');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/40 sm:items-center" dir="rtl">
      <div className="w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">דיווח על נזילת מים 💧</h2>
          <button onClick={onClose} className="text-2xl leading-none text-muted" aria-label="סגירה">
            ×
          </button>
        </div>

        <p className="mb-3 text-sm text-muted">
          המיקום שנבחר: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
        </p>

        <label className="label">תמונה של הנזילה *</label>
        {photo ? (
          <div className="relative mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="תצוגה מקדימה" className="h-44 w-full rounded-xl object-cover" />
            <button
              onClick={() => setPhoto(null)}
              className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold shadow"
            >
              החלף
            </button>
          </div>
        ) : (
          <label className="mb-3 flex h-32 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line bg-cloud text-sm text-muted hover:bg-white">
            <span className="text-2xl">📷</span>
            <span>לחצו לצילום או העלאת תמונה</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
          </label>
        )}

        <label className="label">תיאור (לא חובה)</label>
        <textarea
          className="field mb-3 min-h-20 resize-none"
          placeholder="לדוגמה: טפטוף מברז כיבוי אש בפינת הרחוב"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
        />

        {error && <p className="mb-3 text-sm text-open">{error}</p>}

        <p className="mb-4 text-xs text-muted">הדיווח מתפרסם באופן אנונימי וגלוי לכולם.</p>

        <div className="flex gap-2">
          <button onClick={onClose} className="btn-ghost flex-1" disabled={busy}>
            ביטול
          </button>
          <button onClick={submit} className="btn-primary flex-1" disabled={busy || !photo}>
            {busy ? 'שולח…' : 'פרסום הדיווח'}
          </button>
        </div>
      </div>
    </div>
  );
}
