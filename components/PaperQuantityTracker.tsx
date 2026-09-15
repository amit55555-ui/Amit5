'use client';

import { useEffect, useState } from 'react';

type Row = {
  id: string;
  label: string;
  ordered: string; // כמות בניירת
  received: string; // כמות שהתקבלה
};

const STORAGE_KEY = 'paper-quantity-tracker';

function emptyRow(): Row {
  return { id: crypto.randomUUID(), label: '', ordered: '', received: '' };
}

function diffOf(row: Row): number | null {
  if (row.ordered === '' || row.received === '') return null;
  const ordered = Number(row.ordered);
  const received = Number(row.received);
  if (Number.isNaN(ordered) || Number.isNaN(received)) return null;
  return received - ordered;
}

export default function PaperQuantityTracker() {
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const [loaded, setLoaded] = useState(false);

  // טעינה מהזיכרון המקומי
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Row[];
        if (Array.isArray(parsed) && parsed.length > 0) setRows(parsed);
      }
    } catch {
      // מתעלמים מנתונים פגומים
    }
    setLoaded(true);
  }, []);

  // שמירה בזיכרון המקומי
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    } catch {
      // אחסון לא זמין – מתעלמים
    }
  }, [rows, loaded]);

  function updateRow(id: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow()]);
  }

  function removeRow(id: string) {
    setRows((prev) => {
      const next = prev.filter((r) => r.id !== id);
      return next.length > 0 ? next : [emptyRow()];
    });
  }

  function resetAll() {
    if (!confirm('לאפס את כל הנתונים בטבלה?')) return;
    setRows([emptyRow()]);
  }

  const totals = rows.reduce(
    (acc, r) => {
      const ordered = Number(r.ordered);
      const received = Number(r.received);
      if (r.ordered !== '' && !Number.isNaN(ordered)) acc.ordered += ordered;
      if (r.received !== '' && !Number.isNaN(received)) acc.received += received;
      return acc;
    },
    { ordered: 0, received: 0 }
  );
  const totalDiff = totals.received - totals.ordered;

  return (
    <div className="card p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">מעקב כמות ניירת</h2>
          <p className="text-sm text-muted">כמות שהוזמנה מול כמות שהתקבלה, וחישוב ההפרש</p>
        </div>
        <button onClick={resetAll} className="btn-ghost shrink-0" type="button">
          <span>🔄</span>
          איפוס
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="text-right text-muted">
              <th className="border-b border-line px-2 pb-2 font-semibold">תיאור</th>
              <th className="border-b border-line px-2 pb-2 font-semibold">כמות בניירת</th>
              <th className="border-b border-line px-2 pb-2 font-semibold">כמות שהתקבלה</th>
              <th className="border-b border-line px-2 pb-2 font-semibold">הפרש</th>
              <th className="border-b border-line px-2 pb-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const diff = diffOf(row);
              const diffClass =
                diff === null
                  ? 'text-muted'
                  : diff === 0
                  ? 'text-closed'
                  : diff < 0
                  ? 'text-open'
                  : 'text-progress';
              return (
                <tr key={row.id} className="align-middle">
                  <td className="border-b border-line px-2 py-2">
                    <input
                      type="text"
                      value={row.label}
                      onChange={(e) => updateRow(row.id, { label: e.target.value })}
                      placeholder="לדוגמה: דפי A4"
                      className="field py-2 text-sm"
                    />
                  </td>
                  <td className="border-b border-line px-2 py-2">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={row.ordered}
                      onChange={(e) => updateRow(row.id, { ordered: e.target.value })}
                      placeholder="0"
                      className="field py-2 text-sm"
                    />
                  </td>
                  <td className="border-b border-line px-2 py-2">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={row.received}
                      onChange={(e) => updateRow(row.id, { received: e.target.value })}
                      placeholder="0"
                      className="field py-2 text-sm"
                    />
                  </td>
                  <td className={`border-b border-line px-2 py-2 text-center font-bold ${diffClass}`}>
                    {diff === null ? '—' : diff > 0 ? `+${diff}` : diff}
                  </td>
                  <td className="border-b border-line px-2 py-2 text-center">
                    <button
                      onClick={() => removeRow(row.id)}
                      type="button"
                      className="rounded-lg px-2 py-1 text-muted transition hover:bg-cloud hover:text-open"
                      title="מחיקת שורה"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="font-bold">
              <td className="px-2 pt-3">סה״כ</td>
              <td className="px-2 pt-3 text-center">{totals.ordered || 0}</td>
              <td className="px-2 pt-3 text-center">{totals.received || 0}</td>
              <td
                className={`px-2 pt-3 text-center ${
                  totalDiff === 0 ? 'text-closed' : totalDiff < 0 ? 'text-open' : 'text-progress'
                }`}
              >
                {totalDiff > 0 ? `+${totalDiff}` : totalDiff}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <button onClick={addRow} type="button" className="btn-ghost mt-4">
        <span>➕</span>
        הוספת שורה
      </button>
    </div>
  );
}
