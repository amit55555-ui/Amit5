'use client';

import { useState, useEffect, useRef, useMemo, Component, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Lock, LogOut, Plus, Pencil, Trash2, Save, X, ArrowRight, Star, Search, RotateCcw, FileSpreadsheet, BarChart3, Eye, Heart, MousePointerClick, Share2 } from 'lucide-react';
import { PRODUCTS } from '@/data/products';
import { CAT_LABELS, CAT_EMOJI, type Product, type Category, type Badge } from '@/types';
import ExcelIO from '@/components/ExcelIO';
import { getAnalytics, getTotals, resetAnalytics, type AnalyticsMap } from '@/lib/analytics';
import { isVideoUrl, isYouTube, youTubeEmbed } from '@/lib/media';
import { fetchCatalog, saveCatalog } from '@/lib/catalog';

const ADMIN_PASSWORD = 'amit2389@';
const LS_CUSTOM    = 'shuk_custom_products';
const LS_OVERRIDES = 'shuk_overrides';   // Record<id, Product>  – edits to built-in products
const LS_HIDDEN    = 'shuk_hidden';      // string[]             – deleted built-in product IDs
const LS_AUTH      = 'shuk_admin_auth';

const EMPTY: Omit<Product, 'id'> = {
  name: '', cat: 'home', desc: '', price: '', orig: '',
  link: '', emoji: '', badge: '', stars: 5,
  mediaData: null, mediaType: null,
};

const CATS = Object.keys(CAT_LABELS) as Category[];

/* ─── LOGIN ─── */
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState(false);
  const [shake, setShake] = useState(false);

  const submit = () => {
    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem(LS_AUTH, '1');
      onLogin();
    } else {
      setErr(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6" dir="rtl">
      <motion.div
        animate={shake ? { x: [0, -12, 12, -10, 10, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center"
      >
        <div className="w-16 h-16 bg-orange/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-orange" />
        </div>
        <h1 className="text-2xl font-black text-dark mb-1">לוח ניהול</h1>
        <p className="text-soft text-sm mb-6">הכנס סיסמת מנהל כדי להמשיך</p>
        <input
          type="password"
          value={pw}
          onChange={e => { setPw(e.target.value); setErr(false); }}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="סיסמה"
          className={`w-full border-2 rounded-xl px-4 py-3 text-center text-lg font-bold focus:outline-none transition-colors mb-3
            ${err ? 'border-red-400 bg-red-50' : 'border-border focus:border-orange'}`}
          autoFocus
        />
        {err && <p className="text-red-500 text-xs font-semibold mb-3">סיסמה שגויה, נסה שוב</p>}
        <button
          onClick={submit}
          className="w-full bg-orange hover:bg-deep-orange text-white font-black py-3.5 rounded-xl transition-colors shadow-lg shadow-orange/25"
        >
          כניסה
        </button>
        <a href="/" className="mt-4 flex items-center justify-center gap-1 text-soft text-sm hover:text-orange transition-colors">
          <ArrowRight className="w-4 h-4" />
          חזרה לאפליקציה
        </a>
      </motion.div>
    </div>
  );
}

/* ─── PRODUCT FORM ─── */
function ProductForm({
  initial, isBuiltIn, onSave, onCancel,
}: {
  initial?: Product;
  isBuiltIn?: boolean;
  onSave: (p: Omit<Product, 'id'> & { id?: string }) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Omit<Product, 'id'>>(initial ? { ...initial } : { ...EMPTY });
  const [stars, setStars] = useState(initial?.stars ?? 5);
  const [preview, setPreview] = useState<string | null>(initial?.mediaData || null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cloudRef = useRef<HTMLInputElement>(null);

  // Upload an image/video to Cloudflare R2 and store the same-origin URL.
  const handleCloudUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVid = file.type.startsWith('video');
    if (!isVid && !file.type.startsWith('image')) { alert('אפשר להעלות רק תמונה או וידאו'); return; }
    if (file.size > 100 * 1024 * 1024) { alert('הקובץ גדול מ-100MB'); return; }
    setUploading(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'content-type': file.type || 'application/octet-stream', 'x-admin-password': ADMIN_PASSWORD },
        body: file,
      });
      if (!res.ok) throw new Error('שגיאה ' + res.status);
      const data = await res.json();
      setForm(f => ({ ...f, mediaData: data.url, mediaType: isVid ? 'video' : 'image' }));
      setPreview(data.url);
    } catch (err) {
      alert('ההעלאה נכשלה: ' + (err instanceof Error ? err.message : 'לא ידוע') + '\nודא שמאגר האחסון (shuk-media) נוצר ב-Cloudflare.');
    } finally {
      setUploading(false);
      if (cloudRef.current) cloudRef.current.value = '';
    }
  };

  const field = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith('video')) {
      alert('לא ניתן להעלות קובץ וידאו ישירות (כבד מדי לאחסון).\nהעלה את הסרטון לשירות אחסון והדבק את הקישור בשדה "🔗 קישור לתמונה/וידאו".');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    // Images only, capped so they fit in local storage
    if (file.size > 2 * 1024 * 1024) {
      alert('התמונה גדולה מ-2MB. בחר תמונה קטנה יותר או הדבק קישור (URL) לתמונה.');
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      const data = ev.target?.result as string;
      setForm(f => ({ ...f, mediaData: data, mediaType: 'image' }));
      setPreview(data);
    };
    reader.readAsDataURL(file);
  };

  const submit = () => {
    if (!form.name.trim()) { alert('נא להכניס שם מוצר'); return; }
    if (!form.link.trim()) { alert('נא להכניס לינק אפיליאציה'); return; }
    onSave({ ...form, stars, ...(initial ? { id: initial.id } : {}) });
  };

  return (
    <div className="flex flex-col gap-4">
      {isBuiltIn && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-xs text-blue-700 font-semibold">
          ✏️ עריכת מוצר מובנה – השינויים ישמרו מקומית ויוצגו באפליקציה
        </div>
      )}

      <div>
        <label className="text-xs font-black text-soft mb-1.5 block">שם המוצר *</label>
        <input
          value={form.name}
          onChange={e => field('name', e.target.value)}
          className="w-full border-2 border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange transition-colors"
          placeholder="למשל: מנורת לד חכמה"
        />
      </div>

      <div>
        <label className="text-xs font-black text-soft mb-1.5 block">🔗 לינק למוצר (אפיליאציה) *</label>
        <input
          value={form.link}
          onChange={e => field('link', e.target.value)}
          className="w-full border-2 border-orange/40 bg-orange-50/40 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange"
          placeholder="https://s.click.aliexpress.com/e/..."
          dir="ltr"
        />
        <p className="text-[11px] text-soft mt-1">לכאן ייכנס המשתמש כשילחץ "קנה" / יחליק ימינה על המוצר</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-black text-soft mb-1.5 block">קטגוריה *</label>
          <select
            value={form.cat}
            onChange={e => field('cat', e.target.value as Category)}
            className="w-full border-2 border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange bg-white"
          >
            {CATS.map(c => <option key={c} value={c}>{CAT_EMOJI[c]} {CAT_LABELS[c]}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-black text-soft mb-1.5 block">תגית</label>
          <select
            value={form.badge || ''}
            onChange={e => field('badge', e.target.value as Badge)}
            className="w-full border-2 border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange bg-white"
          >
            <option value="">ללא</option>
            <option value="sale">🔥 מבצע</option>
            <option value="new">🆕 חדש</option>
            <option value="top">⭐ הכי נמכר</option>
            <option value="rec">✅ ממליץ</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-black text-soft mb-1.5 block">מחיר (₪)</label>
          <input
            value={form.price || ''}
            onChange={e => field('price', e.target.value)}
            className="w-full border-2 border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange"
            placeholder="49"
          />
        </div>
        <div>
          <label className="text-xs font-black text-soft mb-1.5 block">מחיר מקורי (₪)</label>
          <input
            value={form.orig || ''}
            onChange={e => field('orig', e.target.value)}
            className="w-full border-2 border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange"
            placeholder="89"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-black text-soft mb-1.5 block">תיאור קצר</label>
        <textarea
          value={form.desc || ''}
          onChange={e => field('desc', e.target.value)}
          className="w-full border-2 border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange resize-none"
          rows={2}
          placeholder="ספר קצת על המוצר..."
        />
      </div>

      <div>
        <label className="text-xs font-black text-soft mb-1.5 block">📸 תמונה / סרטון</label>

        {/* Primary: upload to cloud (R2) — works for videos, no external service */}
        <input ref={cloudRef} type="file" accept="image/*,video/*" onChange={handleCloudUpload} className="hidden" />
        <button
          type="button"
          onClick={() => cloudRef.current?.click()}
          disabled={uploading}
          className="w-full bg-orange hover:bg-deep-orange disabled:opacity-60 text-white font-black py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mb-2"
        >
          {uploading
            ? <>⏳ מעלה לענן... (אל תסגור)</>
            : <>☁️ העלה תמונה / וידאו לענן (מומלץ)</>}
        </button>
        <p className="text-[11px] text-gray-400 mb-3">הדרך הכי טובה לווידאו — הקובץ נשמר בענן שלך ומוצג ישירות באתר. עד 100MB.</p>

        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:border-orange transition-colors"
        >
          <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleFile} className="hidden" />
          {preview ? (
            <div className="relative">
              {form.mediaType === 'video'
                ? (isYouTube(preview)
                    ? <iframe src={youTubeEmbed(preview)} className="w-full h-32 mx-auto rounded-lg" style={{ border: 0 }} allow="autoplay; encrypted-media" title="preview" />
                    : <video src={preview} className="max-h-32 mx-auto rounded-lg" controls />)
                : <img src={preview} className="max-h-32 mx-auto rounded-lg object-cover" alt="" />}
              <button
                onClick={e => { e.stopPropagation(); setPreview(null); setForm(f => ({ ...f, mediaData: null, mediaType: null })); }}
                className="absolute top-1 end-1 bg-white rounded-full w-6 h-6 flex items-center justify-center shadow text-gray-500"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="text-soft">
              <div className="text-3xl mb-1">📷</div>
              <div className="text-sm font-semibold">לחץ להעלאת תמונה או סרטון</div>
              <div className="text-xs text-gray-400 mt-1">עד 15MB (מומלץ לתמונות בלבד)</div>
            </div>
          )}
        </div>

        {/* Media by URL — recommended for videos (avoids local-storage quota) */}
        <div className="mt-2">
          <label className="text-[11px] font-bold text-soft mb-1 block">🔗 או הדבק קישור לתמונה / וידאו (מומלץ לווידאו)</label>
          <input
            value={typeof form.mediaData === 'string' && !form.mediaData.startsWith('data:') ? form.mediaData : ''}
            onChange={e => {
              const url = e.target.value.trim();
              if (!url) { setForm(f => ({ ...f, mediaData: null, mediaType: null })); setPreview(null); return; }
              const isVideo = isVideoUrl(url);
              setForm(f => ({ ...f, mediaData: url, mediaType: isVideo ? 'video' : 'image' }));
              setPreview(url);
            }}
            className="w-full border-2 border-border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-orange"
            placeholder="קישור YouTube או https://example.com/video.mp4"
            dir="ltr"
          />
          <p className="text-[11px] text-gray-400 mt-1">אפשר להדביק קישור <b>YouTube</b> (מומלץ!) או קישור ישיר לקובץ וידאו/תמונה. קישור לדף מוצר רגיל לא יעבוד כווידאו.</p>
        </div>
      </div>

      <div>
        <label className="text-xs font-black text-soft mb-2 block">דירוג</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} type="button" onClick={() => setStars(n)} className="transition-transform active:scale-90">
              <Star className={`w-7 h-7 ${n <= stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={submit}
          className="flex-1 bg-orange hover:bg-deep-orange text-white font-black py-3 rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {initial ? 'עדכן מוצר' : 'הוסף מוצר'}
        </button>
        <button
          onClick={onCancel}
          className="px-5 bg-gray-100 text-soft font-semibold py-3 rounded-xl hover:bg-gray-200 transition-colors"
        >
          ביטול
        </button>
      </div>
    </div>
  );
}

/* ─── DASHBOARD ─── */
function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [customProducts, setCustomProducts] = useState<Product[]>([]);
  const [overrides, setOverrides]           = useState<Record<string, Product>>({});
  const [hidden, setHidden]                 = useState<string[]>([]);
  const [view, setView]                     = useState<'list' | 'add' | 'edit'>('list');
  const [tab, setTab]                       = useState<'products' | 'excel' | 'analytics'>('products');
  const [analytics, setAnalytics]           = useState<AnalyticsMap>({});
  const [editProduct, setEditProduct]       = useState<Product | null>(null);
  const [search, setSearch]                 = useState('');
  const [catFilter, setCatFilter]           = useState<Category | 'all'>('all');

  // Load the shared catalog from the server (fall back to local cache)
  useEffect(() => {
    (async () => {
      const cat = await fetchCatalog();
      if (cat) {
        setCustomProducts(cat.custom);
        setOverrides(cat.overrides);
        setHidden(cat.hidden);
      } else {
        try { const r = localStorage.getItem(LS_CUSTOM);    if (r) setCustomProducts(JSON.parse(r)); } catch { /**/ }
        try { const r = localStorage.getItem(LS_OVERRIDES); if (r) setOverrides(JSON.parse(r)); }      catch { /**/ }
        try { const r = localStorage.getItem(LS_HIDDEN);    if (r) setHidden(JSON.parse(r)); }         catch { /**/ }
      }
    })();
    setAnalytics(getAnalytics());
  }, []);

  // Refresh analytics whenever the tab is opened
  useEffect(() => {
    if (tab === 'analytics') setAnalytics(getAnalytics());
  }, [tab]);

  // Persist helpers — save to the shared server (KV) and cache locally.
  const safeSet = (key: string, value: string) => {
    try { localStorage.setItem(key, value); } catch { /* cache only, ignore quota */ }
  };
  const pushToServer = async (next: { custom: Product[]; overrides: Record<string, Product>; hidden: string[] }) => {
    const ok = await saveCatalog(ADMIN_PASSWORD, next);
    if (!ok) alert('⚠️ השמירה בענן נכשלה. ודא חיבור לאינטרנט ושהגדרות השרת (KV + ADMIN_PASSWORD) הוגדרו ב-Cloudflare.');
  };
  // Single atomic commit: update all three slices, cache locally, and push the
  // WHOLE catalog to the server exactly once. This avoids one save clobbering another.
  const commit = (next: { custom: Product[]; overrides: Record<string, Product>; hidden: string[] }): boolean => {
    safeSet(LS_CUSTOM, JSON.stringify(next.custom));
    safeSet(LS_OVERRIDES, JSON.stringify(next.overrides));
    safeSet(LS_HIDDEN, JSON.stringify(next.hidden));
    setCustomProducts(next.custom);
    setOverrides(next.overrides);
    setHidden(next.hidden);
    pushToServer(next);
    return true;
  };

  // Merged product list: built-ins (minus hidden, with overrides applied) + custom
  const allProducts = useMemo<(Product & { _source: 'builtin' | 'custom'; _modified: boolean })[]>(() => {
    const builtins = PRODUCTS
      .filter(p => !hidden.includes(p.id))
      .map(p => ({
        ...(overrides[p.id] ?? p),
        _source: 'builtin' as const,
        _modified: !!overrides[p.id],
      }));
    const customs = customProducts.map(p => ({ ...p, _source: 'custom' as const, _modified: false }));
    return [...builtins, ...customs];
  }, [overrides, hidden, customProducts]);

  const filtered = useMemo(() => {
    let list = allProducts;
    if (catFilter !== 'all') list = list.filter(p => p.cat === catFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || CAT_LABELS[p.cat].includes(q));
    }
    return list;
  }, [allProducts, catFilter, search]);

  const handleSave = (data: Omit<Product, 'id'> & { id?: string }) => {
    if (!data.id) {
      // New custom product
      commit({ custom: [...customProducts, { ...data, id: `c${Date.now()}` } as Product], overrides, hidden });
    } else if (customProducts.some(p => p.id === data.id)) {
      // Edit existing custom
      commit({ custom: customProducts.map(p => p.id === data.id ? { ...data, id: data.id } as Product : p), overrides, hidden });
    } else {
      // Edit built-in → save as override
      commit({ custom: customProducts, overrides: { ...overrides, [data.id]: { ...data, id: data.id } as Product }, hidden });
    }
    setView('list');
    setEditProduct(null);
  };

  const handleEdit = (p: Product) => {
    setEditProduct(p);
    setView('edit');
  };

  const handleDelete = (p: Product & { _source: 'builtin' | 'custom' }) => {
    if (!confirm('למחוק את המוצר? ניתן לשחזר בכל עת.')) return;
    if (p._source === 'custom') {
      commit({ custom: customProducts.filter(c => c.id !== p.id), overrides, hidden });
    } else {
      // Hide the built-in and drop any override — in a single commit
      const newOv = { ...overrides };
      delete newOv[p.id];
      commit({ custom: customProducts, overrides: newOv, hidden: [...hidden, p.id] });
    }
  };

  const handleRestoreBuiltin = (id: string) => {
    const newOv = { ...overrides };
    delete newOv[id];
    commit({ custom: customProducts, overrides: newOv, hidden: hidden.filter(h => h !== id) });
  };

  const handleResetOverride = (id: string) => {
    if (!confirm('לאפס עריכות ולחזור למוצר המקורי?')) return;
    const newOv = { ...overrides };
    delete newOv[id];
    commit({ custom: customProducts, overrides: newOv, hidden });
  };

  const isBuiltIn = (id: string) => PRODUCTS.some(p => p.id === id);

  return (
    <div className="min-h-screen bg-cream" dir="rtl">
      {/* Header */}
      <header className="bg-dark sticky top-0 z-30 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'linear-gradient(135deg,#ff6b35,#f9a825)' }}>⚙️</div>
            <div>
              <div className="text-white font-black text-base leading-none">לוח ניהול</div>
              <div className="text-white/40 text-[10px]">שוק הטעמים</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" className="flex items-center gap-1 text-white/60 hover:text-white text-xs font-semibold transition-colors">
              <ArrowRight className="w-4 h-4" />
              האפליקציה
            </a>
            <button onClick={onLogout} className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-2 rounded-full transition-colors">
              <LogOut className="w-3.5 h-3.5" />
              יציאה
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {[
            { label: 'סה"כ מוצרים', value: allProducts.length, icon: '📦' },
            { label: 'מוצרים מותאמים', value: customProducts.length, icon: '✨' },
            { label: 'ערוכים', value: Object.keys(overrides).length, icon: '✏️' },
            { label: 'מוסתרים', value: hidden.length, icon: '🙈' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-3 shadow-sm border border-border text-center">
              <div className="text-xl mb-0.5">{s.icon}</div>
              <div className="text-xl font-black text-dark">{s.value}</div>
              <div className="text-[10px] text-soft font-semibold leading-tight">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-5">
          <button
            onClick={() => setTab('products')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black transition-all
              ${tab === 'products' ? 'bg-white shadow text-dark' : 'text-soft hover:text-dark'}`}
          >
            📦 מוצרים
          </button>
          <button
            onClick={() => setTab('analytics')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black transition-all
              ${tab === 'analytics' ? 'bg-white shadow text-dark' : 'text-soft hover:text-dark'}`}
          >
            <BarChart3 className="w-4 h-4" />
            סטטיסטיקה
          </button>
          <button
            onClick={() => setTab('excel')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black transition-all
              ${tab === 'excel' ? 'bg-white shadow text-dark' : 'text-soft hover:text-dark'}`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            אקסל
          </button>
        </div>

        {/* Hidden products restore bar */}
        {tab === 'products' && hidden.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-4 flex items-center justify-between gap-3">
            <span className="text-xs text-amber-800 font-semibold">🙈 {hidden.length} מוצרים מוסתרים</span>
            <button
              onClick={() => { if (confirm('לשחזר את כל המוצרים המוסתרים?')) { commit({ custom: customProducts, overrides, hidden: [] }); } }}
              className="text-xs bg-amber-600 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-amber-700 transition-colors"
            >
              שחזר הכל
            </button>
          </div>
        )}

        {/* Analytics tab */}
        {tab === 'analytics' && (() => {
          const totals = getTotals();
          const rows = allProducts
            .map(p => ({ product: p, stat: analytics[p.id] || { views: 0, likes: 0, clicks: 0, shares: 0 } }))
            .sort((a, b) =>
              (b.stat.likes + b.stat.clicks + b.stat.shares) -
              (a.stat.likes + a.stat.clicks + a.stat.shares)
            );
          const ctr = totals.views > 0 ? Math.round((totals.clicks / totals.views) * 100) : 0;
          return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              {/* Totals */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { label: 'צפיות', value: totals.views, icon: <Eye className="w-4 h-4" />, color: 'text-sky-600 bg-sky-50' },
                  { label: 'לייקים', value: totals.likes, icon: <Heart className="w-4 h-4" />, color: 'text-pink-600 bg-pink-50' },
                  { label: 'הקלקות לקנייה', value: totals.clicks, icon: <MousePointerClick className="w-4 h-4" />, color: 'text-orange bg-orange-50' },
                  { label: 'שיתופים', value: totals.shares, icon: <Share2 className="w-4 h-4" />, color: 'text-green-600 bg-green-50' },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-border flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>{s.icon}</div>
                    <div>
                      <div className="text-2xl font-black text-dark leading-none">{s.value}</div>
                      <div className="text-[11px] text-soft font-semibold mt-0.5">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm border border-border mb-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-soft font-semibold">אחוז המרה (הקלקות מתוך צפיות)</div>
                  <div className="text-xl font-black text-dark">{ctr}%</div>
                </div>
                <button
                  onClick={() => { if (confirm('לאפס את כל נתוני הסטטיסטיקה?')) { resetAnalytics(); setAnalytics({}); } }}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-soft font-bold px-3 py-2 rounded-lg transition-colors"
                >
                  אפס נתונים
                </button>
              </div>

              {/* Per-product table */}
              <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-border text-[11px] font-black text-soft">
                  <span className="flex-1">מוצר</span>
                  <span className="w-12 text-center" title="צפיות"><Eye className="w-3.5 h-3.5 inline" /></span>
                  <span className="w-12 text-center" title="לייקים"><Heart className="w-3.5 h-3.5 inline" /></span>
                  <span className="w-12 text-center" title="הקלקות"><MousePointerClick className="w-3.5 h-3.5 inline" /></span>
                  <span className="w-12 text-center" title="שיתופים"><Share2 className="w-3.5 h-3.5 inline" /></span>
                </div>
                {rows.map(({ product, stat }) => (
                  <div key={product.id} className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-lg flex-shrink-0">{product.emoji || CAT_EMOJI[product.cat]}</span>
                      <span className="text-sm font-bold text-dark truncate">{product.name}</span>
                    </div>
                    <span className="w-12 text-center text-sm font-bold text-sky-600">{stat.views}</span>
                    <span className="w-12 text-center text-sm font-bold text-pink-600">{stat.likes}</span>
                    <span className="w-12 text-center text-sm font-bold text-orange">{stat.clicks}</span>
                    <span className="w-12 text-center text-sm font-bold text-green-600">{stat.shares}</span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-soft text-center mt-3">
                * הנתונים נאספים במכשיר זה בלבד (localStorage)
              </p>
            </motion.div>
          );
        })()}

        {/* Excel tab */}
        {tab === 'excel' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-white rounded-2xl p-5 border border-border shadow-sm">
              <h2 className="text-lg font-black text-dark mb-1">📊 ייבוא / ייצוא אקסל</h2>
              <p className="text-xs text-soft mb-5">ייצא את כל המוצרים לאקסל, ערוך, ויבא בחזרה בקלות</p>
              <ExcelIO
                customProducts={customProducts}
                overrides={overrides}
                onImport={prods => {
                  commit({ custom: prods, overrides, hidden });
                  setTab('products');
                }}
              />
            </div>
          </motion.div>
        )}

        {tab === 'products' && <>
          {view === 'list' && (
            <motion.div key="list" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              {/* Filters row */}
              <div className="flex gap-2 mb-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 end-3 text-gray-400 pointer-events-none" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="חיפוש מוצר..."
                    className="w-full border-2 border-border rounded-xl px-3.5 pe-9 py-2.5 text-sm focus:outline-none focus:border-orange bg-white"
                  />
                </div>
                <button
                  onClick={() => { setView('add'); setEditProduct(null); }}
                  className="bg-orange hover:bg-deep-orange text-white font-black px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 shadow-lg shadow-orange/25 flex-shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  הוסף
                </button>
              </div>

              {/* Category filter scrollable */}
              <div className="overflow-x-auto mb-4">
                <div className="flex gap-1.5 w-max pb-1">
                  <button
                    onClick={() => setCatFilter('all')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all
                      ${catFilter === 'all' ? 'bg-orange text-white' : 'bg-white border border-border text-soft hover:border-orange'}`}
                  >
                    🔥 הכל
                  </button>
                  {CATS.map(c => (
                    <button
                      key={c}
                      onClick={() => setCatFilter(c)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all
                        ${catFilter === c ? 'bg-orange text-white' : 'bg-white border border-border text-soft hover:border-orange'}`}
                    >
                      {CAT_EMOJI[c]} {CAT_LABELS[c]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product list */}
              <div className="flex flex-col gap-2">
                {filtered.length === 0 && (
                  <p className="text-center text-soft py-10 text-sm">לא נמצאו מוצרים</p>
                )}
                {filtered.map(product => (
                  <motion.div
                    key={product.id}
                    layout
                    className="bg-white rounded-2xl p-3 border border-border shadow-sm flex items-center gap-3"
                  >
                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-orange-50 flex items-center justify-center text-2xl flex-shrink-0">
                      {product.mediaData && product.mediaType === 'image'
                        ? <img src={product.mediaData} alt="" className="w-full h-full object-cover" />
                        : (product.emoji || CAT_EMOJI[product.cat])}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <span className="font-black text-dark text-sm truncate">{product.name}</span>
                        {product._source === 'custom' && (
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">מותאם</span>
                        )}
                        {product._modified && (
                          <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">ערוך</span>
                        )}
                      </div>
                      <div className="text-xs text-soft">
                        {CAT_EMOJI[product.cat]} {CAT_LABELS[product.cat]}
                        {product.price ? ` · ₪${product.price}` : ''}
                      </div>
                    </div>

                    <div className="flex gap-1.5 flex-shrink-0">
                      {/* Reset override (only for modified built-ins) */}
                      {product._modified && (
                        <button
                          onClick={() => handleRestoreBuiltin(product.id)}
                          className="w-8 h-8 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center transition-colors"
                          title="אפס לברירת מחדל"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(product)}
                        className="w-8 h-8 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        className="w-8 h-8 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center justify-center transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {(view === 'add' || view === 'edit') && (
            <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="bg-white rounded-2xl p-5 border border-border shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-black text-dark">
                    {view === 'edit' ? '✏️ עריכת מוצר' : '➕ הוספת מוצר חדש'}
                  </h2>
                  <button
                    onClick={() => { setView('list'); setEditProduct(null); }}
                    className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                <ProductForm
                  initial={editProduct || undefined}
                  isBuiltIn={editProduct ? isBuiltIn(editProduct.id) : false}
                  onSave={handleSave}
                  onCancel={() => { setView('list'); setEditProduct(null); }}
                />
              </div>
            </motion.div>
          )}
        </>}
      </div>
    </div>
  );
}

/* ─── ERROR BOUNDARY ─── */
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  reset = () => {
    // Clear the custom/overrides data that most often causes issues (e.g. heavy media), then reload
    localStorage.removeItem(LS_CUSTOM);
    localStorage.removeItem(LS_OVERRIDES);
    window.location.reload();
  };
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-cream flex items-center justify-center p-6" dir="rtl">
          <div className="bg-white rounded-3xl p-8 max-w-sm text-center shadow-2xl">
            <div className="text-5xl mb-3">😕</div>
            <h1 className="text-xl font-black text-dark mb-2">משהו השתבש</h1>
            <p className="text-soft text-sm mb-5">
              ייתכן שמוצר מותאם עם מדיה כבדה (וידאו/תמונה) גרם לתקלה. אפשר לאפס את המוצרים המותאמים כדי לשחזר את הלוח. מוצרי ברירת המחדל לא ימחקו.
            </p>
            <button
              onClick={this.reset}
              className="w-full bg-orange hover:bg-deep-orange text-white font-black py-3 rounded-xl transition-colors mb-2"
            >
              אפס מוצרים מותאמים ורענן
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gray-100 text-soft font-semibold py-3 rounded-xl hover:bg-gray-200 transition-colors"
            >
              רק רענן
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ─── PAGE ─── */
function AdminPageInner() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    setAuthed(!!sessionStorage.getItem(LS_AUTH));
  }, []);

  const logout = () => {
    sessionStorage.removeItem(LS_AUTH);
    setAuthed(false);
  };

  if (authed === null) return null;

  return authed
    ? <Dashboard onLogout={logout} />
    : <LoginScreen onLogin={() => setAuthed(true)} />;
}

export default function AdminPage() {
  return (
    <ErrorBoundary>
      <AdminPageInner />
    </ErrorBoundary>
  );
}
