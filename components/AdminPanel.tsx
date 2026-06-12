'use client';

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { CAT_LABELS, CAT_EMOJI, type Product, type Category, type Badge } from '@/types';

interface Props {
  onClose: () => void;
  onSave: (products: Product[]) => void;
  customProducts: Product[];
}

const EMPTY: Omit<Product, 'id'> = {
  name: '', cat: 'beauty', desc: '', price: '', orig: '',
  link: '', emoji: '', badge: '', stars: 5,
  mediaData: null, mediaType: null,
};

const CAT_KEYS = Object.keys(CAT_LABELS) as Category[];

/* Map of readable Hebrew/English column names → Product field */
const COL_MAP: Record<string, keyof Product> = {
  'שם מוצר':       'name',  'name':        'name',
  'שם':             'name',
  'קטגוריה':       'cat',   'cat':         'cat',  'category': 'cat',
  'תיאור':          'desc',  'desc':        'desc', 'description': 'desc',
  'מחיר':           'price', 'price':       'price',
  'מחיר מקורי':    'orig',  'orig':        'orig', 'original price': 'orig',
  'לינק':           'link',  'link':        'link', 'url': 'link',
  'אמוג\'י':        'emoji', 'emoji':       'emoji',
  'תגית':           'badge', 'badge':       'badge',
  'דירוג':          'stars', 'stars':       'stars', 'rating': 'stars',
};

/* Normalise a category value typed in Hebrew or English */
const normCat = (val: string): Category => {
  const v = String(val).trim().toLowerCase();
  // direct English key
  if (CAT_KEYS.includes(v as Category)) return v as Category;
  // Hebrew label match
  const found = CAT_KEYS.find(k => CAT_LABELS[k] === val.trim());
  if (found) return found;
  return 'beauty';
};

/* Normalise badge */
const normBadge = (val: string): Badge => {
  const v = String(val).trim().toLowerCase();
  if (['sale','new','top','rec'].includes(v)) return v as Badge;
  if (v.includes('מבצע')) return 'sale';
  if (v.includes('חדש'))  return 'new';
  if (v.includes('נמכר')) return 'top';
  if (v.includes('ממליצ')) return 'rec';
  return '';
};

interface ImportRow {
  name?: string; cat?: string; desc?: string; price?: string; orig?: string;
  link?: string; emoji?: string; badge?: string; stars?: string;
  _ok: boolean; _err: string;
}

export default function AdminPanel({ onClose, onSave, customProducts }: Props) {
  const [tab, setTab]               = useState<'list' | 'add' | 'excel'>('list');
  const [form, setForm]             = useState<Omit<Product, 'id'>>(EMPTY);
  const [editId, setEditId]         = useState<string | null>(null);
  const [stars, setStars]           = useState(5);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const fileRef   = useRef<HTMLInputElement>(null);
  const xlsxRef   = useRef<HTMLInputElement>(null);

  /* Excel import state */
  const [xlsxRows, setXlsxRows]       = useState<ImportRow[]>([]);
  const [xlsxName, setXlsxName]       = useState('');
  const [importing, setImporting]     = useState(false);
  const [importDone, setImportDone]   = useState(false);

  /* ── Helpers ── */
  const field = (k: keyof typeof form, val: string) =>
    setForm(f => ({ ...f, [k]: val }));

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { alert('הקובץ גדול מ-15MB'); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      const data = ev.target?.result as string;
      const type = file.type.startsWith('video') ? 'video' : 'image';
      setForm(f => ({ ...f, mediaData: data, mediaType: type }));
      setMediaPreview(data);
    };
    reader.readAsDataURL(file);
  };

  const save = () => {
    if (!form.name.trim()) { alert('נא להכניס שם מוצר'); return; }
    if (!form.link.trim()) { alert('נא להכניס לינק לרכישה'); return; }
    const prod: Product = { ...form, id: editId || `c${Date.now()}`, stars };
    const updated = editId
      ? customProducts.map(p => p.id === editId ? prod : p)
      : [...customProducts, prod];
    onSave(updated);
    resetForm();
    setTab('list');
  };

  const edit = (p: Product) => {
    setEditId(p.id);
    setForm({ ...p });
    setStars(p.stars);
    setMediaPreview(p.mediaData || null);
    setTab('add');
  };

  const del = (id: string) => {
    if (!confirm('למחוק את המוצר?')) return;
    onSave(customProducts.filter(p => p.id !== id));
  };

  const resetForm = () => {
    setForm(EMPTY); setEditId(null); setStars(5);
    setMediaPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  /* ── Excel: download template ── */
  const downloadTemplate = () => {
    const header = [
      'שם מוצר', 'קטגוריה', 'תיאור', 'מחיר', 'מחיר מקורי',
      'לינק', 'אמוג\'י', 'תגית', 'דירוג'
    ];
    const example = [
      'סרום פנים ויטמין C', 'beauty', 'סרום שמאיר ומעניק לחות', '59', '120',
      'https://example.com/product', '✨', 'top', '5'
    ];
    const catNote = [
      '← שם חובה', 'beauty/bachelorette/bachelor/garden/balcony/jewelry/cleaning/accessories/home',
      '', '', '', '← לינק חובה', '', 'sale/new/top/rec', '1-5'
    ];

    const ws = XLSX.utils.aoa_to_sheet([header, example, catNote]);

    /* column widths */
    ws['!cols'] = [22,22,30,10,14,40,8,12,8].map(w => ({ wch: w }));

    /* style header row (best-effort – xlsx-js-style not in scope) */
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'מוצרים');
    XLSX.writeFile(wb, 'תבנית_מוצרים_sheli.xlsx');
  };

  /* ── Excel: parse uploaded file ── */
  const handleXlsx = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setXlsxName(file.name);
    setImportDone(false);

    const reader = new FileReader();
    reader.onload = ev => {
      const data = new Uint8Array(ev.target?.result as ArrayBuffer);
      const wb   = XLSX.read(data, { type: 'array' });
      const ws   = wb.Sheets[wb.SheetNames[0]];
      const raw  = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });

      const rows: ImportRow[] = raw.map(r => {
        const tmp: Record<string, string> = {};
        for (const [col, val] of Object.entries(r)) {
          const key = COL_MAP[col.trim()] || COL_MAP[col.trim().toLowerCase()];
          if (key) tmp[key] = String(val).trim();
        }
        const row: ImportRow = {
          name: tmp.name, cat: tmp.cat, desc: tmp.desc,
          price: tmp.price, orig: tmp.orig, link: tmp.link,
          emoji: tmp.emoji, badge: tmp.badge, stars: tmp.stars,
          _ok: !!(tmp.name && tmp.link),
          _err: !tmp.name ? 'חסר שם מוצר' : !tmp.link ? 'חסר לינק' : '',
        };
        return row;
      }).filter(r => r.name || r.link);

      setXlsxRows(rows);
    };
    reader.readAsArrayBuffer(file);
  };

  /* ── Excel: commit import ── */
  const commitImport = () => {
    setImporting(true);
    const valid = xlsxRows.filter(r => r._ok);
    const newProds: Product[] = valid.map((r, i) => ({
      id:        `xl${Date.now()}_${i}`,
      name:      r.name || '',
      cat:       normCat(r.cat || 'beauty'),
      desc:      r.desc || '',
      price:     r.price || '',
      orig:      r.orig || '',
      link:      r.link || '',
      emoji:     r.emoji || '',
      badge:     normBadge(r.badge || '') as Badge,
      stars:     Math.min(5, Math.max(1, parseInt(r.stars || '5') || 5)),
      mediaData: null,
      mediaType: null,
    }));
    onSave([...customProducts, ...newProds]);
    setImporting(false);
    setImportDone(true);
    setXlsxRows([]);
    setXlsxName('');
    if (xlsxRef.current) xlsxRef.current.value = '';
    setTimeout(() => setTab('list'), 1200);
  };

  /* ── Render ── */
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(20,4,15,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl w-full max-w-lg p-6 relative my-4 shadow-2xl">

        {/* Close */}
        <button onClick={onClose}
          className="absolute top-4 start-4 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 font-bold transition-colors">
          ✕
        </button>

        {/* Header */}
        <div className="text-center mb-5 mt-1">
          <div className="text-2xl mb-1">⚙️</div>
          <h2 className="text-xl font-black" style={{ color: '#1a0816' }}>ניהול מוצרים</h2>
          <p className="text-xs text-gray-500 mt-0.5">הוסיפי מוצרים ידנית, או ייבאי קובץ Excel בלחיצה אחת</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 mb-5 gap-0">
          {([
            ['list',  `📋 המוצרים שלי (${customProducts.length})`],
            ['add',   editId ? '✏️ עריכה' : '➕ מוצר חדש'],
            ['excel', '📊 ייבוא Excel'],
          ] as const).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-2.5 text-xs font-bold border-b-2 transition-colors -mb-px flex-1 ${
                tab === t
                  ? 'border-rose-500 text-rose-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* ══ LIST TAB ══ */}
        {tab === 'list' && (
          <div>
            {customProducts.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-5xl mb-3">🛍️</div>
                <p className="text-gray-500 text-sm font-semibold">עדיין אין מוצרים מותאמים אישית</p>
                <p className="text-gray-400 text-xs mt-1">הוסיפי ידנית או ייבאי קובץ Excel</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-72 overflow-y-auto mb-4 pe-1">
                {customProducts.map(p => (
                  <div key={p.id} className="flex items-center gap-3 rounded-2xl p-3 border"
                    style={{ background: '#fdf8fb', borderColor: '#f5d0e8' }}>
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg,#fce4ec,#f8bbd9)' }}>
                      {p.mediaData
                        ? (p.mediaType === 'video'
                          ? <video src={p.mediaData} className="w-full h-full object-cover" muted />
                          : <img src={p.mediaData} className="w-full h-full object-cover" alt="" />)
                        : (p.emoji || CAT_EMOJI[p.cat])}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-black text-sm truncate" style={{ color: '#1a0816' }}>{p.name}</div>
                      <div className="text-xs text-gray-500">{CAT_EMOJI[p.cat]} {CAT_LABELS[p.cat]}{p.price ? ` · ₪${p.price}` : ''}</div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => edit(p)}
                        className="text-xs font-bold px-3 py-1.5 rounded-xl"
                        style={{ background: '#fce8f3', color: '#c14b7c' }}>
                        ערוך
                      </button>
                      <button onClick={() => del(p.id)}
                        className="text-xs font-bold px-3 py-1.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100">
                        מחק
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => { resetForm(); setTab('add'); }}
                className="flex-1 text-white font-black py-3.5 rounded-2xl transition-all active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg,#c14b7c,#9c3060)' }}>
                ➕ הוסיפי מוצר
              </button>
              <button onClick={() => setTab('excel')}
                className="flex-1 font-black py-3.5 rounded-2xl border-2 transition-all active:scale-[0.98]"
                style={{ borderColor: '#c14b7c', color: '#c14b7c' }}>
                📊 ייבוא Excel
              </button>
            </div>
          </div>
        )}

        {/* ══ ADD / EDIT TAB ══ */}
        {tab === 'add' && (
          <div className="flex flex-col gap-3.5">
            {/* Media upload */}
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block">📸 תמונה / סרטון</label>
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-colors hover:border-rose-400"
                style={{ borderColor: mediaPreview ? '#c14b7c' : '#f5d0e8', background: '#fdf8fb' }}
              >
                <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleFile} className="hidden" />
                {mediaPreview ? (
                  <div className="relative">
                    {form.mediaType === 'video'
                      ? <video src={mediaPreview} className="max-h-36 mx-auto rounded-xl" controls />
                      : <img src={mediaPreview} className="max-h-36 mx-auto rounded-xl object-cover" alt="" />}
                    <button
                      onClick={e => { e.stopPropagation(); setMediaPreview(null); setForm(f => ({ ...f, mediaData: null, mediaType: null })); }}
                      className="absolute top-1 end-1 bg-white rounded-full w-7 h-7 text-xs text-gray-500 shadow-md font-bold flex items-center justify-center">
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="text-gray-400">
                    <div className="text-3xl mb-1">📷</div>
                    <div className="text-sm font-semibold text-gray-500">לחצי להעלאת תמונה או סרטון</div>
                    <div className="text-xs mt-0.5">עד 15MB</div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-bold text-gray-500 mb-1 block">שם המוצר *</label>
                <input value={form.name} onChange={e => field('name', e.target.value)}
                  className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                  style={{ borderColor: '#f5d0e8', background: '#fdf8fb' }}
                  placeholder="למשל: סרום פנים עם ויטמין C" />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">קטגוריה *</label>
                <select value={form.cat} onChange={e => field('cat', e.target.value as Category)}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                  style={{ borderColor: '#f5d0e8', background: '#fdf8fb' }}>
                  {CAT_KEYS.map(c => <option key={c} value={c}>{CAT_EMOJI[c]} {CAT_LABELS[c]}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">תגית</label>
                <select value={form.badge || ''} onChange={e => field('badge', e.target.value as Badge)}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                  style={{ borderColor: '#f5d0e8', background: '#fdf8fb' }}>
                  <option value="">ללא תגית</option>
                  <option value="sale">🔥 מבצע</option>
                  <option value="new">✨ חדש</option>
                  <option value="top">⭐ הכי נמכר</option>
                  <option value="rec">💖 ממליצה</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">מחיר (₪)</label>
                <input value={form.price || ''} onChange={e => field('price', e.target.value)}
                  className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                  style={{ borderColor: '#f5d0e8', background: '#fdf8fb' }}
                  placeholder="49" />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">מחיר מקורי (₪)</label>
                <input value={form.orig || ''} onChange={e => field('orig', e.target.value)}
                  className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                  style={{ borderColor: '#f5d0e8', background: '#fdf8fb' }}
                  placeholder="89" />
              </div>

              <div className="col-span-2">
                <label className="text-xs font-bold text-gray-500 mb-1 block">🔗 לינק לרכישה *</label>
                <input value={form.link} onChange={e => field('link', e.target.value)}
                  className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                  style={{ borderColor: '#f5d0e8', background: '#fdf8fb' }}
                  placeholder="https://..." />
              </div>

              <div className="col-span-2">
                <label className="text-xs font-bold text-gray-500 mb-1 block">תיאור קצר</label>
                <textarea value={form.desc || ''} onChange={e => field('desc', e.target.value)}
                  className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none resize-none"
                  style={{ borderColor: '#f5d0e8', background: '#fdf8fb' }}
                  rows={2} placeholder="ספרי קצת על המוצר..." />
              </div>

              <div className="col-span-2">
                <label className="text-xs font-bold text-gray-500 mb-2 block">דירוג</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} type="button" onClick={() => setStars(n)}
                      className={`text-2xl transition-transform active:scale-90 ${n <= stars ? 'text-amber-400' : 'text-gray-200'}`}>
                      ★
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-1">
              <button onClick={save}
                className="flex-1 text-white font-black py-3.5 rounded-2xl transition-all active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg,#c14b7c,#9c3060)' }}>
                💾 שמור מוצר
              </button>
              <button onClick={() => { resetForm(); setTab('list'); }}
                className="px-5 bg-gray-100 text-gray-500 font-semibold py-3.5 rounded-2xl hover:bg-gray-200">
                ביטול
              </button>
            </div>
          </div>
        )}

        {/* ══ EXCEL TAB ══ */}
        {tab === 'excel' && (
          <div className="flex flex-col gap-4">

            {/* Step 1: Download template */}
            <div className="rounded-2xl p-4" style={{ background: '#fdf8fb', border: '1px solid #f5d0e8' }}>
              <div className="flex items-start gap-3">
                <div className="text-2xl flex-shrink-0">1️⃣</div>
                <div className="flex-1">
                  <div className="font-black text-sm mb-0.5" style={{ color: '#1a0816' }}>הורידי תבנית Excel</div>
                  <div className="text-xs text-gray-500 mb-3">
                    קובץ מוכן עם כל העמודות הנדרשות + שורת דוגמא
                  </div>
                  <button onClick={downloadTemplate}
                    className="flex items-center gap-2 text-xs font-black px-4 py-2 rounded-xl text-white transition-all active:scale-95"
                    style={{ background: 'linear-gradient(135deg,#d4a843,#b8892e)' }}>
                    ⬇️ הורד תבנית (XLSX)
                  </button>
                </div>
              </div>

              {/* Column legend */}
              <div className="mt-3 pt-3 border-t" style={{ borderColor: '#f5d0e8' }}>
                <div className="text-xs font-bold text-gray-500 mb-2">עמודות הקובץ:</div>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {[
                    ['שם מוצר', 'חובה'],
                    ['קטגוריה', 'beauty, home, jewelry...'],
                    ['תיאור', 'אופציונלי'],
                    ['מחיר', 'מספר בלבד'],
                    ['מחיר מקורי', 'אופציונלי'],
                    ['לינק', 'חובה – URL לרכישה'],
                    ['אמוג\'י', 'אופציונלי'],
                    ['תגית', 'sale/new/top/rec'],
                    ['דירוג', '1–5'],
                  ].map(([col, hint]) => (
                    <div key={col} className="flex gap-1">
                      <span className="font-bold" style={{ color: '#9c3060' }}>{col}:</span>
                      <span className="text-gray-400 truncate">{hint}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 2: Upload */}
            <div className="rounded-2xl p-4" style={{ background: '#fdf8fb', border: '1px solid #f5d0e8' }}>
              <div className="flex items-start gap-3">
                <div className="text-2xl flex-shrink-0">2️⃣</div>
                <div className="flex-1">
                  <div className="font-black text-sm mb-0.5" style={{ color: '#1a0816' }}>העלי את הקובץ המלא</div>
                  <div className="text-xs text-gray-500 mb-3">תומך בקבצי .xlsx ו-.csv</div>
                  <div
                    onClick={() => xlsxRef.current?.click()}
                    className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors hover:border-rose-400"
                    style={{ borderColor: xlsxName ? '#c14b7c' : '#f5d0e8' }}>
                    <input ref={xlsxRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleXlsx} className="hidden" />
                    {xlsxName ? (
                      <div className="text-sm font-bold" style={{ color: '#c14b7c' }}>📊 {xlsxName}</div>
                    ) : (
                      <div className="text-gray-400">
                        <div className="text-2xl mb-1">📊</div>
                        <div className="text-sm font-semibold text-gray-500">לחצי לבחירת קובץ Excel</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Preview table */}
            {xlsxRows.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-black" style={{ color: '#1a0816' }}>
                    תצוגה מקדימה – {xlsxRows.filter(r => r._ok).length} מוצרים תקינים
                    {xlsxRows.filter(r => !r._ok).length > 0 && (
                      <span className="text-red-500 font-semibold text-xs mr-2">
                        ({xlsxRows.filter(r => !r._ok).length} שגיאות)
                      </span>
                    )}
                  </div>
                </div>
                <div className="rounded-2xl overflow-hidden border" style={{ borderColor: '#f5d0e8' }}>
                  <div className="max-h-44 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead style={{ background: '#fce8f3', position: 'sticky', top: 0 }}>
                        <tr>
                          <th className="px-2 py-2 text-right font-black" style={{ color: '#9c3060' }}>✓</th>
                          <th className="px-2 py-2 text-right font-black" style={{ color: '#9c3060' }}>שם</th>
                          <th className="px-2 py-2 text-right font-black" style={{ color: '#9c3060' }}>קטגוריה</th>
                          <th className="px-2 py-2 text-right font-black" style={{ color: '#9c3060' }}>מחיר</th>
                          <th className="px-2 py-2 text-right font-black" style={{ color: '#9c3060' }}>לינק</th>
                        </tr>
                      </thead>
                      <tbody>
                        {xlsxRows.map((r, i) => (
                          <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fdf8fb' }}>
                            <td className="px-2 py-1.5 text-center">
                              {r._ok ? <span className="text-green-500">✓</span> : <span className="text-red-500" title={r._err}>✗</span>}
                            </td>
                            <td className="px-2 py-1.5 font-semibold truncate max-w-[100px]">{r.name || '—'}</td>
                            <td className="px-2 py-1.5 text-gray-500">{r.cat ? normCat(r.cat) : '—'}</td>
                            <td className="px-2 py-1.5">{r.price ? `₪${r.price}` : '—'}</td>
                            <td className="px-2 py-1.5 text-gray-400 truncate max-w-[80px]">
                              {r.link ? <span className="text-green-600">✓</span> : <span className="text-red-400">חסר</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {importDone ? (
                  <div className="mt-3 text-center py-3 rounded-2xl font-black text-green-700 bg-green-50 border border-green-200">
                    ✅ המוצרים יובאו בהצלחה!
                  </div>
                ) : (
                  <button
                    onClick={commitImport}
                    disabled={importing || xlsxRows.filter(r => r._ok).length === 0}
                    className="mt-3 w-full text-white font-black py-3.5 rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg,#c14b7c,#9c3060)' }}>
                    {importing ? '⏳ מייבא...' : `📥 ייבא ${xlsxRows.filter(r => r._ok).length} מוצרים`}
                  </button>
                )}
              </div>
            )}

            {xlsxRows.length === 0 && !xlsxName && (
              <div className="text-center text-xs text-gray-400 py-2">
                💡 טיפ: ניתן גם לשנות עמודות לעברית/אנגלית – המערכת מזהה אוטומטית
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
