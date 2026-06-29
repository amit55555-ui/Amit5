'use client';

import { useState } from 'react';
import { NewReportInput, Priority, Report } from '@/types';
import { CATEGORIES, ENTRANCES } from '@/data/building';
import { createReport, getResidentToken } from '@/lib/client';

const CONTACT_KEY = 'building.contact.v1';

interface SavedContact {
  reporterName: string;
  reporterPhone: string;
  reporterEmail: string;
  entrance: string;
  apartment: string;
}

function loadContact(): Partial<SavedContact> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(CONTACT_KEY) || '{}');
  } catch {
    return {};
  }
}

export default function ReportForm({ onCreated }: { onCreated: (r: Report) => void }) {
  const saved = loadContact();
  const [categoryId, setCategoryId] = useState('lightbulb');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [entrance, setEntrance] = useState(saved.entrance || ENTRANCES[0] || '');
  const [apartment, setApartment] = useState(saved.apartment || '');
  const [reporterName, setReporterName] = useState(saved.reporterName || '');
  const [reporterPhone, setReporterPhone] = useState(saved.reporterPhone || '');
  const [reporterEmail, setReporterEmail] = useState(saved.reporterEmail || '');
  const [priority, setPriority] = useState<Priority>('normal');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<Report | null>(null);

  const valid = title.trim() && description.trim() && entrance && reporterName.trim();

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
      reporterEmail: reporterEmail.trim() || undefined,
      reporterToken: getResidentToken(),
      priority,
    };
    const report = await createReport(input);
    localStorage.setItem(
      CONTACT_KEY,
      JSON.stringify({ reporterName, reporterPhone, reporterEmail, entrance, apartment }),
    );
    setSubmitting(false);
    setDone(report);
    onCreated(report);
  }

  function reset() {
    setTitle('');
    setDescription('');
    setPriority('normal');
    setCategoryId('lightbulb');
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
        <label className="label">כותרת קצרה</label>
        <input
          className="field"
          placeholder="לדוגמה: נורה שרופה בחדר מדרגות קומה 2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <label className="label">תיאור התקלה</label>
        <textarea
          className="field min-h-[90px] resize-y"
          placeholder="פרטו מה התקלה והיכן בדיוק…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* מיקום */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label className="label">כניסה (מספר בניין)</label>
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
          <label className="label">שם מלא</label>
          <input className="field" value={reporterName} onChange={(e) => setReporterName(e.target.value)} />
        </div>
        <div>
          <label className="label">טלפון</label>
          <input
            className="field"
            inputMode="tel"
            value={reporterPhone}
            onChange={(e) => setReporterPhone(e.target.value)}
          />
        </div>
        <div>
          <label className="label">אימייל (לעדכונים)</label>
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
        הפנייה תישלח לוועד הבית במייל, ותוכלו לעקוב אחרי הסטטוס בלשונית «הפניות שלי».
      </p>
    </div>
  );
}
