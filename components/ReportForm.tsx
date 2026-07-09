'use client';

import { useState } from 'react';
import { NewReportInput, Priority, Report } from '@/types';
import { CATEGORIES, ENTRANCES } from '@/data/building';
import { createReport, getResidentToken } from '@/lib/client';

export default function ReportForm({ onCreated }: { onCreated: (r: Report) => void }) {
  // הטופס מתחיל ריק ומתאפס אחרי כל שליחה — כדי שלא יופיעו פרטים מפנייה קודמת
  const [categoryId, setCategoryId] = useState('lightbulb');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [entrance, setEntrance] = useState(ENTRANCES[0] || '');
  const [apartment, setApartment] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [priority, setPriority] = useState<Priority>('normal');
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<Report | null>(null);

  const valid =
    title.trim() &&
    description.trim() &&
    entrance &&
    reporterName.trim() &&
    reporterPhone.trim() &&
    reporterEmail.trim();

  // דחיסת תמונה ל-JPEG קטן לפני שמירה
  function compress(file: File): Promise<string | null> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const max = 1000;
        let w = img.width, h = img.height;
        if (w > h && w > max) { h = Math.round((h * max) / w); w = max; }
        else if (h >= w && h > max) { w = Math.round((w * max) / h); h = max; }
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d')?.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        try { resolve(c.toDataURL('image/jpeg', 0.7)); } catch { resolve(null); }
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });
  }

  async function onPickPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    const remaining = 4 - photos.length;
    if (remaining <= 0) return;
    const picked = files.slice(0, remaining);
    const results = await Promise.all(picked.map(compress));
    setPhotos((p) => [...p, ...results.filter((r): r is string => !!r)]);
  }

  async function submit() {
    if (!valid) return;
    setSubmitting(true);
    const input: NewReportInput = {
      categoryId,
      title: title.trim(),
      description: description.trim(),
      entrance,
      apartment: apartment.trim(),
      reporterName: reporterName.trim(),
      reporterPhone: reporterPhone.trim(),
      reporterEmail: reporterEmail.trim(),
      reporterToken: getResidentToken(),
      priority,
      photos,
    };
    const report = await createReport(input);
    clearForm();
    setSubmitting(false);
    setDone(report);
    onCreated(report);
  }

  // מנקה את כל שדות הטופס לערכי ברירת מחדל
  function clearForm() {
    setCategoryId('lightbulb');
    setTitle('');
    setDescription('');
    setEntrance(ENTRANCES[0] || '');
    setApartment('');
    setReporterName('');
    setReporterPhone('');
    setReporterEmail('');
    setPriority('normal');
    setPhotos([]);
  }

  function reset() {
    clearForm();
    setDone(null);
  }

  if (done) {
    return (
      <div className="card p-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-3xl">
          ✅
        </div>
        <h3 className="text-lg font-bold">הפנייה נשלחה!</h3>
        <p className="mt-1 text-muted">
          מספר הפנייה שלך הוא <b>#{done.ref}</b>. הוועד קיבל את הדיווח ויחזור אליך.
          אפשר לעקוב אחרי הסטטוס בלשונית «הפניות שלי».
        </p>
        <button className="btn-primary mt-4" onClick={reset}>
          דיווח על תקלה נוספת
        </button>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <h2 className="mb-4 text-lg font-bold">דיווח על תקלה חדשה</h2>

      {/* קטגוריה */}
      <label className="label">סוג התקלה</label>
      <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategoryId(c.id)}
            className={`flex flex-col items-center gap-1 rounded-xl border px-1 py-2.5 text-center text-xs transition ${
              categoryId === c.id
                ? 'border-brand bg-brand/5 font-semibold text-brand'
                : 'border-line bg-white text-muted hover:bg-cloud'
            }`}
          >
            <span className="text-xl">{c.emoji}</span>
            {c.label}
          </button>
        ))}
      </div>

      {/* כותרת + תיאור */}
      <div className="mb-4">
        <label className="label">כותרת קצרה <span className="text-open">*</span></label>
        <input
          className="field"
          placeholder="לדוגמה: נורה שרופה בחדר מדרגות קומה 2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <label className="label">תיאור התקלה <span className="text-open">*</span></label>
        <textarea
          className="field min-h-[90px] resize-y"
          placeholder="פרטו מה התקלה והיכן בדיוק…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* תמונות של התקלה */}
      <div className="mb-4">
        <label className="label">תמונה של התקלה (אופציונלי)</label>
        <div className="flex flex-wrap items-center gap-2">
          <label className="btn-ghost cursor-pointer text-sm">
            📷 צילום / הוספת תמונה
            <input type="file" accept="image/*" multiple className="hidden" onChange={onPickPhotos} />
          </label>
          <span className="text-xs text-muted">עד 4 תמונות</span>
        </div>
        {photos.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {photos.map((p, i) => (
              <div key={i} className="relative h-[72px] w-[72px] overflow-hidden rounded-xl border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotos((ps) => ps.filter((_, j) => j !== i))}
                  className="absolute start-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white"
                  aria-label="הסרה"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* מיקום */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label className="label">כניסה (מספר בניין) <span className="text-open">*</span></label>
          <select className="field" value={entrance} onChange={(e) => setEntrance(e.target.value)}>
            {ENTRANCES.map((e) => (
              <option key={e} value={e}>
                כניסה {e}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">דירה (אופציונלי)</label>
          <input className="field" value={apartment} onChange={(e) => setApartment(e.target.value)} />
        </div>
      </div>

      {/* דחיפות */}
      <div className="mb-4">
        <label className="label">דחיפות</label>
        <div className="flex gap-2">
          {(['normal', 'urgent'] as Priority[]).map((p) => (
            <button
              key={p}
              onClick={() => setPriority(p)}
              className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                priority === p
                  ? p === 'urgent'
                    ? 'border-open bg-red-50 text-open'
                    : 'border-brand bg-brand/5 text-brand'
                  : 'border-line bg-white text-muted hover:bg-cloud'
              }`}
            >
              {p === 'urgent' ? '🔴 דחוף' : 'רגיל'}
            </button>
          ))}
        </div>
      </div>

      {/* פרטי קשר */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="label">שם מלא <span className="text-open">*</span></label>
          <input className="field" value={reporterName} onChange={(e) => setReporterName(e.target.value)} />
        </div>
        <div>
          <label className="label">טלפון <span className="text-open">*</span></label>
          <input
            className="field"
            inputMode="tel"
            value={reporterPhone}
            onChange={(e) => setReporterPhone(e.target.value)}
          />
        </div>
        <div>
          <label className="label">אימייל (לעדכונים) <span className="text-open">*</span></label>
          <input
            className="field"
            inputMode="email"
            value={reporterEmail}
            onChange={(e) => setReporterEmail(e.target.value)}
          />
        </div>
      </div>

      <button className="btn-primary w-full" disabled={!valid || submitting} onClick={submit}>
        {submitting ? 'שולח…' : 'שליחת הפנייה לוועד'}
      </button>
      <p className="mt-2 text-center text-xs text-muted">
        <span className="text-open">*</span> שדות חובה · הפנייה תישלח לוועד הבית במייל, ותוכלו לעקוב אחרי הסטטוס בלשונית «הפניות שלי».
      </p>
    </div>
  );
}
