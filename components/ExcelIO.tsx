'use client';

import { useRef, useState } from 'react';
import { Download, Upload, FileSpreadsheet, CheckCircle, AlertCircle, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { CAT_LABELS, CAT_EMOJI, type Product, type Category, type Badge } from '@/types';
import { PRODUCTS } from '@/data/products';

const CATS = Object.keys(CAT_LABELS) as Category[];

/* ── Column definitions ── */
const COLUMNS = [
  { key: 'name',  heb: 'שם המוצר *',           hint: 'חובה' },
  { key: 'link',  heb: 'לינק אפיליאציה *',     hint: 'חובה – URL מלא' },
  { key: 'cat',   heb: 'קטגוריה',               hint: CATS.join(' | ') },
  { key: 'price', heb: 'מחיר (₪)',              hint: 'מספר בלבד, למשל: 49' },
  { key: 'orig',  heb: 'מחיר מקורי (₪)',        hint: 'מספר בלבד, למשל: 89' },
  { key: 'desc',  heb: 'תיאור',                 hint: 'תיאור קצר של המוצר' },
  { key: 'badge', heb: 'תגית',                  hint: 'sale | new | top | rec | ריק' },
  { key: 'stars', heb: 'דירוג (1-5)',            hint: 'מספר בין 1 ל-5' },
  { key: 'emoji', heb: 'אימוג׳י',               hint: 'אופציונלי, למשל: 🏠' },
];

/* ── Helpers ── */
function normalizeCat(raw: string): Category {
  const r = (raw ?? '').trim().toLowerCase();
  // Try direct key match
  if (CATS.includes(r as Category)) return r as Category;
  // Try Hebrew label match
  const found = CATS.find(c => CAT_LABELS[c] === raw.trim());
  return found ?? 'home';
}

function normalizeBadge(raw: string): Badge {
  const r = (raw ?? '').trim().toLowerCase();
  if (['sale','new','top','rec'].includes(r)) return r as Badge;
  return '';
}

function normalizeStars(raw: unknown): number {
  const n = Number(raw);
  if (!isNaN(n) && n >= 1 && n <= 5) return Math.round(n);
  return 5;
}

interface PreviewRow {
  data: Omit<Product,'id'>;
  ok: boolean;
  errors: string[];
  rowNum: number;
}

interface Props {
  customProducts: Product[];
  overrides: Record<string, Product>;
  onImport: (products: Product[]) => void;
}

export default function ExcelIO({ customProducts, overrides, onImport }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview]   = useState<PreviewRow[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [done, setDone]         = useState<number | null>(null);

  /* ── EXPORT ── */
  const handleExport = () => {
    const allProducts: Product[] = [
      ...PRODUCTS.map(p => overrides[p.id] ?? p),
      ...customProducts,
    ];

    const rows = allProducts.map(p => ({
      'שם המוצר *':         p.name,
      'לינק אפיליאציה *':   p.link,
      'קטגוריה':            p.cat,
      'מחיר (₪)':           p.price ?? '',
      'מחיר מקורי (₪)':     p.orig ?? '',
      'תיאור':              p.desc ?? '',
      'תגית':               p.badge ?? '',
      'דירוג (1-5)':        p.stars,
      'אימוג׳י':            p.emoji ?? '',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows, { header: COLUMNS.map(c => c.heb) });

    // Column widths
    ws['!cols'] = [
      { wch: 35 }, // name
      { wch: 50 }, // link
      { wch: 20 }, // cat
      { wch: 12 }, // price
      { wch: 15 }, // orig
      { wch: 45 }, // desc
      { wch: 10 }, // badge
      { wch: 12 }, // stars
      { wch: 10 }, // emoji
    ];

    // RTL + freeze header row
    ws['!sheetView'] = { rightToLeft: true };

    XLSX.utils.book_append_sheet(wb, ws, 'מוצרים');

    // Add "Instructions" sheet
    const infoRows = [
      ['שדה',           'הסבר',                                       'ערכים מותרים'],
      ['שם המוצר *',    'שם המוצר שיופיע בכרטיס – חובה',              'טקסט חופשי'],
      ['לינק אפיליאציה *','URL של מוצר אליאקספרס – חובה',             'https://...'],
      ['קטגוריה',       'קטגוריית המוצר (אנגלית)',                     CATS.join(', ')],
      ['מחיר (₪)',      'מחיר מבצע בשקלים – מספר בלבד',              '49'],
      ['מחיר מקורי (₪)','מחיר לפני הנחה – מספר בלבד',               '89'],
      ['תיאור',         'תיאור קצר שיופיע מתחת לשם',                 'טקסט חופשי'],
      ['תגית',          'תגית צבעונית שתוצג על הכרטיס',              'sale | new | top | rec | ריק'],
      ['דירוג (1-5)',   'כוכבים 1 עד 5',                              '1 / 2 / 3 / 4 / 5'],
      ['אימוג׳י',       'אימוג׳י שיוצג כרקע כשאין תמונה',             '🏠 🧸 ⚡ ...'],
    ];
    const wsInfo = XLSX.utils.aoa_to_sheet(infoRows);
    wsInfo['!cols'] = [{ wch: 20 }, { wch: 40 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(wb, wsInfo, 'הוראות');

    XLSX.writeFile(wb, 'shuk-products.xlsx');
  };

  /* ── TEMPLATE DOWNLOAD ── */
  const handleTemplate = () => {
    const sample = [{
      'שם המוצר *':         'מנורת לד חכמה',
      'לינק אפיליאציה *':   'https://s.click.aliexpress.com/e/_example',
      'קטגוריה':            'home',
      'מחיר (₪)':           '35',
      'מחיר מקורי (₪)':     '65',
      'תיאור':              'נורה חכמה 12W עם 16 מיליון צבעים',
      'תגית':               'sale',
      'דירוג (1-5)':        5,
      'אימוג׳י':            '💡',
    }];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sample, { header: COLUMNS.map(c => c.heb) });
    ws['!cols'] = [{ wch: 35 },{ wch: 50 },{ wch: 20 },{ wch: 12 },{ wch: 15 },{ wch: 45 },{ wch: 10 },{ wch: 12 },{ wch: 10 }];
    ws['!sheetView'] = { rightToLeft: true };
    XLSX.utils.book_append_sheet(wb, ws, 'מוצרים');

    const infoRows = [
      ['שדה', 'הסבר', 'ערכים מותרים'],
      ['שם המוצר *',    'שם המוצר שיופיע בכרטיס – חובה',       'טקסט חופשי'],
      ['לינק אפיליאציה *','URL מלא – חובה',                     'https://...'],
      ['קטגוריה',       'אנגלית בלבד – ראה ערכים מותרים',       CATS.join(', ')],
      ['מחיר (₪)',      'מספר בלבד ללא סימן ₪',                  '49'],
      ['מחיר מקורי (₪)','מספר בלבד ללא סימן ₪',                 '89'],
      ['תיאור',         'תיאור קצר',                             'טקסט חופשי'],
      ['תגית',          'תגית צבעונית',                          'sale | new | top | rec | (ריק = ללא תגית)'],
      ['דירוג (1-5)',   'כוכבים',                                '1 / 2 / 3 / 4 / 5'],
      ['אימוג׳י',       'אופציונלי',                             '🏠 🧸 ⚡ 📱 ...'],
    ];
    const wsInfo = XLSX.utils.aoa_to_sheet(infoRows);
    wsInfo['!cols'] = [{ wch: 20 },{ wch: 38 },{ wch: 50 }];
    XLSX.utils.book_append_sheet(wb, wsInfo, 'הוראות');

    XLSX.writeFile(wb, 'template-shuk.xlsx');
  };

  /* ── IMPORT: parse & preview ── */
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDone(null);

    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string,unknown>>(ws, { defval: '' });

        const parsed: PreviewRow[] = rows.map((row, i) => {
          const errors: string[] = [];

          const name = String(row['שם המוצר *'] ?? row['name'] ?? '').trim();
          const link = String(row['לינק אפיליאציה *'] ?? row['link'] ?? '').trim();

          if (!name) errors.push('חסר שם מוצר');
          if (!link) errors.push('חסר לינק');
          else if (!link.startsWith('http')) errors.push('לינק לא תקין');

          const cat  = normalizeCat(String(row['קטגוריה'] ?? row['cat'] ?? 'home'));
          const data: Omit<Product,'id'> = {
            name,
            link,
            cat,
            price:     String(row['מחיר (₪)']      ?? row['price'] ?? '').trim() || undefined,
            orig:      String(row['מחיר מקורי (₪)'] ?? row['orig']  ?? '').trim() || undefined,
            desc:      String(row['תיאור']          ?? row['desc']  ?? '').trim(),
            badge:     normalizeBadge(String(row['תגית'] ?? row['badge'] ?? '')),
            stars:     normalizeStars(row['דירוג (1-5)'] ?? row['stars'] ?? 5),
            emoji:     String(row['אימוג׳י']        ?? row['emoji'] ?? '').trim() || undefined,
            mediaData: null,
            mediaType: null,
          };

          return { data, ok: errors.length === 0, errors, rowNum: i + 2 };
        });

        setPreview(parsed);
      } catch {
        alert('שגיאה בקריאת הקובץ. ודא שהוא קובץ Excel תקין (.xlsx / .xls).');
      }
    };
    reader.readAsBinaryString(file);
    // Reset input so same file can be re-loaded
    e.target.value = '';
  };

  /* ── IMPORT: commit ── */
  const handleCommit = () => {
    if (!preview) return;
    setImporting(true);

    const valid = preview.filter(r => r.ok);
    const newProducts: Product[] = valid.map(r => ({
      ...r.data,
      id: `xl${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
    }));

    onImport([...customProducts, ...newProducts]);
    setDone(valid.length);
    setPreview(null);
    setImporting(false);
  };

  const validCount   = preview?.filter(r => r.ok).length  ?? 0;
  const invalidCount = preview?.filter(r => !r.ok).length ?? 0;

  return (
    <div className="flex flex-col gap-4">

      {/* ── Action buttons ── */}
      <div className="grid grid-cols-1 gap-3">
        {/* Export */}
        <button
          onClick={handleExport}
          className="flex items-center gap-3 bg-green-50 hover:bg-green-100 border-2 border-green-200 text-green-800 font-bold rounded-2xl px-4 py-3.5 transition-colors text-sm"
        >
          <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Download className="w-4 h-4 text-white" />
          </div>
          <div className="text-right">
            <div className="font-black">ייצוא כל המוצרים לאקסל</div>
            <div className="text-xs text-green-600 font-normal">מוריד קובץ עם כל המוצרים הקיימים</div>
          </div>
        </button>

        {/* Template */}
        <button
          onClick={handleTemplate}
          className="flex items-center gap-3 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 text-blue-800 font-bold rounded-2xl px-4 py-3.5 transition-colors text-sm"
        >
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <FileSpreadsheet className="w-4 h-4 text-white" />
          </div>
          <div className="text-right">
            <div className="font-black">הורד תבנית אקסל ריקה</div>
            <div className="text-xs text-blue-600 font-normal">קובץ עם כותרות + שורת דוגמה + הוראות</div>
          </div>
        </button>

        {/* Import */}
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-3 bg-orange/10 hover:bg-orange/20 border-2 border-orange/30 text-orange font-bold rounded-2xl px-4 py-3.5 transition-colors text-sm"
        >
          <div className="w-9 h-9 bg-orange rounded-xl flex items-center justify-center flex-shrink-0">
            <Upload className="w-4 h-4 text-white" />
          </div>
          <div className="text-right">
            <div className="font-black">ייבוא מוצרים מאקסל</div>
            <div className="text-xs text-orange/80 font-normal">בחר קובץ .xlsx – מציג תצוגה מקדימה לפני שמירה</div>
          </div>
        </button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />
      </div>

      {/* ── Category reference ── */}
      <div className="bg-gray-50 rounded-2xl p-4 border border-border">
        <p className="text-xs font-black text-soft mb-2">ערכי קטגוריה תקינים לייבוא:</p>
        <div className="flex flex-wrap gap-1.5">
          {CATS.map(c => (
            <span key={c} className="text-xs bg-white border border-border rounded-lg px-2 py-1 font-mono text-dark">
              {CAT_EMOJI[c]} <span className="font-bold">{c}</span>
              <span className="text-soft"> = {CAT_LABELS[c]}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Success banner ── */}
      {done !== null && (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm font-bold text-green-800">✅ יובאו {done} מוצרים בהצלחה!</p>
          <button onClick={() => setDone(null)} className="ms-auto text-green-600 hover:text-green-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Preview table ── */}
      {preview && (
        <div className="border-2 border-border rounded-2xl overflow-hidden">
          {/* Preview header */}
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-border">
            <div>
              <p className="font-black text-dark text-sm">תצוגה מקדימה – {preview.length} שורות</p>
              <p className="text-xs text-soft mt-0.5">
                <span className="text-green-700 font-bold">{validCount} תקינות</span>
                {invalidCount > 0 && <span className="text-red-600 font-bold"> · {invalidCount} עם שגיאות (לא יובאו)</span>}
              </p>
            </div>
            <button onClick={() => setPreview(null)} className="w-7 h-7 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors">
              <X className="w-3.5 h-3.5 text-gray-600" />
            </button>
          </div>

          {/* Rows */}
          <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
            {preview.map((row, i) => (
              <div key={i} className={`px-4 py-2.5 flex items-start gap-3 ${row.ok ? 'bg-white' : 'bg-red-50'}`}>
                <div className="flex-shrink-0 mt-0.5">
                  {row.ok
                    ? <CheckCircle className="w-4 h-4 text-green-500" />
                    : <AlertCircle className="w-4 h-4 text-red-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">שורה {row.rowNum}</span>
                    <span className="text-sm font-bold text-dark truncate">{row.data.name || '(ללא שם)'}</span>
                    {row.data.cat && (
                      <span className="text-xs bg-orange-50 text-orange border border-orange/20 px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0">
                        {CAT_EMOJI[row.data.cat]} {CAT_LABELS[row.data.cat]}
                      </span>
                    )}
                  </div>
                  {row.data.price && (
                    <span className="text-xs text-soft">₪{row.data.price}</span>
                  )}
                  {row.errors.length > 0 && (
                    <p className="text-xs text-red-600 font-semibold mt-0.5">{row.errors.join(' · ')}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Commit */}
          {validCount > 0 && (
            <div className="bg-gray-50 px-4 py-3 border-t border-border flex items-center gap-3">
              <button
                onClick={handleCommit}
                disabled={importing}
                className="flex-1 bg-orange hover:bg-deep-orange text-white font-black py-2.5 rounded-xl transition-colors disabled:opacity-60 text-sm"
              >
                {importing ? '⏳ מייבא...' : `✅ אישור ייבוא ${validCount} מוצרים`}
              </button>
              <button
                onClick={() => setPreview(null)}
                className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-soft font-semibold rounded-xl transition-colors text-sm"
              >
                ביטול
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
