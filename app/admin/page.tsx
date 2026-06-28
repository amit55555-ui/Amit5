'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, LogOut, Plus, Pencil, Trash2, Save, X, ArrowRight, Star, Search, RotateCcw, FileSpreadsheet } from 'lucide-react';
import { PRODUCTS } from '@/data/products';
import { CAT_LABELS, CAT_EMOJI, type Product, type Category, type Badge } from '@/types';
import ExcelIO from '@/components/ExcelIO';

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
  const fileRef = useRef<HTMLInputElement>(null);

  const field = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { alert('הקובץ גדול מ-15MB'); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      const data = ev.target?.result as string;
      const type = file.type.startsWith('video') ? 'video' : 'image';
      setForm(f => ({ ...f, mediaData: data, mediaType: type }));
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
        <label className="text-xs font-black text-soft mb-1.5 block">🔗 לינק אפיליאציה *</label>
        <input
          value={form.link}
          onChange={e => field('link', e.target.value)}
          className="w-full border-2 border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange"
          placeholder="https://s.click.aliexpress.com/e/..."
          dir="ltr"
        />
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
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:border-orange transition-colors"
        >
          <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleFile} className="hidden" />
          {preview ? (
            <div className="relative">
              {form.mediaType === 'video'
                ? <video src={preview} className="max-h-32 mx-auto rounded-lg" controls />
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
              <div className="text-xs text-gray-400 mt-1">עד 15MB</div>
            </div>
          )}
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
  const [tab, setTab]                       = useState<'products' | 'excel'>('products');
  const [editProduct, setEditProduct]       = useState<Product | null>(null);
  const [search, setSearch]                 = useState('');
  const [catFilter, setCatFilter]           = useState<Category | 'all'>('all');

  // Load from localStorage
  useEffect(() => {
    try { const r = localStorage.getItem(LS_CUSTOM);    if (r) setCustomProducts(JSON.parse(r)); } catch { /**/ }
    try { const r = localStorage.getItem(LS_OVERRIDES); if (r) setOverrides(JSON.parse(r)); }      catch { /**/ }
    try { const r = localStorage.getItem(LS_HIDDEN);    if (r) setHidden(JSON.parse(r)); }         catch { /**/ }
  }, []);

  // Persist helpers
  const persistCustom    = useCallback((p: Product[])            => { setCustomProducts(p); localStorage.setItem(LS_CUSTOM, JSON.stringify(p)); }, []);
  const persistOverrides = useCallback((o: Record<string, Product>) => { setOverrides(o);    localStorage.setItem(LS_OVERRIDES, JSON.stringify(o)); }, []);
  const persistHidden    = useCallback((h: string[])             => { setHidden(h);         localStorage.setItem(LS_HIDDEN, JSON.stringify(h)); }, []);

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
      persistCustom([...customProducts, { ...data, id: `c${Date.now()}` } as Product]);
    } else if (customProducts.some(p => p.id === data.id)) {
      // Edit existing custom
      persistCustom(customProducts.map(p => p.id === data.id ? { ...data, id: data.id } as Product : p));
    } else {
      // Edit built-in → save as override
      persistOverrides({ ...overrides, [data.id]: { ...data, id: data.id } as Product });
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
      persistCustom(customProducts.filter(c => c.id !== p.id));
    } else {
      persistHidden([...hidden, p.id]);
      const newOv = { ...overrides };
      delete newOv[p.id];
      persistOverrides(newOv);
    }
  };

  const handleRestoreBuiltin = (id: string) => {
    persistHidden(hidden.filter(h => h !== id));
    const newOv = { ...overrides };
    delete newOv[id];
    persistOverrides(newOv);
  };

  const handleResetOverride = (id: string) => {
    if (!confirm('לאפס עריכות ולחזור למוצר המקורי?')) return;
    const newOv = { ...overrides };
    delete newOv[id];
    persistOverrides(newOv);
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
              onClick={() => { if (confirm('לשחזר את כל המוצרים המוסתרים?')) { persistHidden([]); } }}
              className="text-xs bg-amber-600 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-amber-700 transition-colors"
            >
              שחזר הכל
            </button>
          </div>
        )}

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
                  persistCustom(prods);
                  setTab('products');
                }}
              />
            </div>
          </motion.div>
        )}

        {tab === 'products' && <AnimatePresence mode="wait">
          {view === 'list' && (
            <motion.div key="list" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
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
            <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
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
        </AnimatePresence>}
      </div>
    </div>
  );
}

/* ─── PAGE ─── */
export default function AdminPage() {
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
