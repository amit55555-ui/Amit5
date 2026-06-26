'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, LogOut, Plus, Pencil, Trash2, Save, X, ArrowRight, Star } from 'lucide-react';
import { PRODUCTS } from '@/data/products';
import { CAT_LABELS, CAT_EMOJI, type Product, type Category, type Badge } from '@/types';

const ADMIN_PASSWORD = 'admin123';
const LS_CUSTOM = 'shuk_custom_products';
const LS_AUTH   = 'shuk_admin_auth';

const EMPTY: Omit<Product, 'id'> = {
  name: '', cat: 'kitchen', desc: '', price: '', orig: '',
  link: '', emoji: '', badge: '', stars: 5,
  mediaData: null, mediaType: null,
};

const CATS = Object.keys(CAT_LABELS) as Category[];

/* ─── LOGIN SCREEN ─── */
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

/* ─── FORM ─── */
function ProductForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Product;
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
      {/* Name */}
      <div>
        <label className="text-xs font-black text-soft mb-1.5 block">שם המוצר *</label>
        <input
          value={form.name}
          onChange={e => field('name', e.target.value)}
          className="w-full border-2 border-border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-orange transition-colors"
          placeholder="למשל: מסחטת לימון חשמלית"
        />
      </div>

      {/* Cat + Badge row */}
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

      {/* Price row */}
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

      {/* Link */}
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

      {/* Description */}
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

      {/* Media upload */}
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
                className="absolute top-1 end-1 bg-white rounded-full w-6 h-6 text-xs text-gray-500 shadow font-bold flex items-center justify-center"
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

      {/* Stars */}
      <div>
        <label className="text-xs font-black text-soft mb-2 block">דירוג</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setStars(n)}
              className="transition-transform active:scale-90"
            >
              <Star
                className={`w-7 h-7 ${n <= stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Action buttons */}
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

/* ─── ADMIN DASHBOARD ─── */
function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [customProducts, setCustomProducts] = useState<Product[]>([]);
  const [view, setView] = useState<'list' | 'add' | 'edit'>('list');
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_CUSTOM);
      if (raw) setCustomProducts(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const persist = useCallback((prods: Product[]) => {
    setCustomProducts(prods);
    localStorage.setItem(LS_CUSTOM, JSON.stringify(prods));
  }, []);

  const handleSave = (data: Omit<Product, 'id'> & { id?: string }) => {
    if (data.id) {
      persist(customProducts.map(p => p.id === data.id ? { ...data, id: data.id } as Product : p));
    } else {
      persist([...customProducts, { ...data, id: `c${Date.now()}` } as Product]);
    }
    setView('list');
    setEditProduct(null);
  };

  const handleEdit = (p: Product) => {
    setEditProduct(p);
    setView('edit');
  };

  const handleDelete = (id: string) => {
    if (!confirm('למחוק את המוצר?')) return;
    persist(customProducts.filter(p => p.id !== id));
  };

  const allProducts = [...PRODUCTS, ...customProducts];
  const filtered = search
    ? allProducts.filter(p => p.name.includes(search) || CAT_LABELS[p.cat].includes(search))
    : allProducts;

  return (
    <div className="min-h-screen bg-cream" dir="rtl">
      {/* Header */}
      <header className="bg-dark sticky top-0 z-30 shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
              style={{ background: 'linear-gradient(135deg,#ff6b35,#f9a825)' }}>
              ⚙️
            </div>
            <div>
              <div className="text-white font-black text-base leading-none">לוח ניהול</div>
              <div className="text-white/40 text-[10px]">שוק הטעמים</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/"
              className="flex items-center gap-1 text-white/60 hover:text-white text-xs font-semibold transition-colors">
              <ArrowRight className="w-4 h-4" />
              האפליקציה
            </a>
            <button
              onClick={onLogout}
              className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-2 rounded-full transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              יציאה
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'סה"כ מוצרים', value: allProducts.length, icon: '📦' },
            { label: 'מוצרים מותאמים', value: customProducts.length, icon: '✨' },
            { label: 'קטגוריות', value: Object.keys(CAT_LABELS).length, icon: '🏷️' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-border text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-black text-dark">{s.value}</div>
              <div className="text-xs text-soft font-semibold">{s.label}</div>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {view === 'list' && (
            <motion.div key="list" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {/* Search + add */}
              <div className="flex gap-3 mb-4">
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="חיפוש מוצר..."
                  className="flex-1 border-2 border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange bg-white"
                />
                <button
                  onClick={() => setView('add')}
                  className="bg-orange hover:bg-deep-orange text-white font-black px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-orange/25"
                >
                  <Plus className="w-4 h-4" />
                  הוסף
                </button>
              </div>

              {/* Product list */}
              <div className="flex flex-col gap-2">
                {filtered.map(product => {
                  const isCustom = customProducts.some(p => p.id === product.id);
                  return (
                    <motion.div
                      key={product.id}
                      layout
                      className="bg-white rounded-2xl p-3 border border-border shadow-sm flex items-center gap-3"
                    >
                      {/* Thumb */}
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-orange-50 flex items-center justify-center text-2xl flex-shrink-0">
                        {product.mediaData && product.mediaType === 'image'
                          ? <img src={product.mediaData} alt="" className="w-full h-full object-cover" />
                          : (product.emoji || CAT_EMOJI[product.cat])}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="font-black text-dark text-sm truncate">{product.name}</span>
                          {isCustom && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">מותאם</span>
                          )}
                        </div>
                        <div className="text-xs text-soft">
                          {CAT_EMOJI[product.cat]} {CAT_LABELS[product.cat]}
                          {product.price ? ` · ₪${product.price}` : ''}
                        </div>
                      </div>

                      {isCustom && (
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleEdit(product)}
                            className="w-8 h-8 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="w-8 h-8 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center justify-center transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
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
                  onSave={handleSave}
                  onCancel={() => { setView('list'); setEditProduct(null); }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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

  if (authed === null) return null; // hydration guard

  return authed
    ? <Dashboard onLogout={logout} />
    : <LoginScreen onLogin={() => setAuthed(true)} />;
}
