'use client';

import { useState, useRef } from 'react';
import { CAT_LABELS, CAT_EMOJI, type Product, type Category, type Badge } from '@/types';

interface Props {
  onClose: () => void;
  onSave: (products: Product[]) => void;
  customProducts: Product[];
}

const EMPTY: Omit<Product, 'id'> = {
  name: '', cat: 'kitchen', desc: '', price: '', orig: '',
  link: '', emoji: '', badge: '', stars: 5,
  mediaData: null, mediaType: null,
};

export default function AdminPanel({ onClose, onSave, customProducts }: Props) {
  const [tab, setTab] = useState<'list' | 'add'>('list');
  const [form, setForm] = useState<Omit<Product, 'id'>>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [stars, setStars] = useState(5);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
    if (!form.link.trim()) { alert('נא להכניס לינק אפיליאציה'); return; }
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
    if (!confirm('למחוק?')) return;
    onSave(customProducts.filter(p => p.id !== id));
  };

  const resetForm = () => {
    setForm(EMPTY); setEditId(null); setStars(5);
    setMediaPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const cats = (Object.keys(CAT_LABELS) as Category[]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 overflow-y-auto"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 relative my-auto">
        <button onClick={onClose}
          className="absolute top-4 start-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-bold">
          ✕
        </button>

        <h2 className="text-xl font-black text-dark mb-1">⚙️ ניהול מוצרים</h2>
        <p className="text-sm text-soft mb-5">הוסף מוצרים עם תמונה/סרטון ולינק אפיליאציה מאלי אקספרס</p>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-5 gap-1">
          {([['list', `📋 המוצרים שלי (${customProducts.length})`], ['add', editId ? '✏️ עריכה' : '➕ הוסף']] as const).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors -mb-px ${tab === t ? 'border-orange text-orange' : 'border-transparent text-soft'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* LIST TAB */}
        {tab === 'list' && (
          <div>
            {customProducts.length === 0 ? (
              <p className="text-center text-soft py-8 text-sm">אין מוצרים מותאמים עדיין.</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-72 overflow-y-auto mb-4">
                {customProducts.map(p => (
                  <div key={p.id} className="flex items-center gap-3 bg-cream rounded-xl p-3 border border-border">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-orange-50 flex items-center justify-center text-xl flex-shrink-0">
                      {p.mediaData
                        ? <img src={p.mediaData} className="w-full h-full object-cover" alt="" />
                        : (p.emoji || CAT_EMOJI[p.cat])}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-dark truncate">{p.name}</div>
                      <div className="text-xs text-soft">{CAT_LABELS[p.cat]}{p.price ? ` · ₪${p.price}` : ''}</div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => edit(p)} className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-lg font-bold">ערוך</button>
                      <button onClick={() => del(p.id)} className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded-lg font-bold">מחק</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => { resetForm(); setTab('add'); }}
              className="w-full bg-orange text-white font-bold py-3 rounded-xl hover:bg-deep-orange transition-colors">
              ➕ הוסף מוצר חדש
            </button>
          </div>
        )}

        {/* ADD/EDIT TAB */}
        {tab === 'add' && (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-bold text-soft mb-1 block">שם המוצר *</label>
                <input value={form.name} onChange={e => field('name', e.target.value)}
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange"
                  placeholder="למשל: מסחטת לימון חשמלית" />
              </div>

              <div>
                <label className="text-xs font-bold text-soft mb-1 block">קטגוריה *</label>
                <select value={form.cat} onChange={e => field('cat', e.target.value as Category)}
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange">
                  {cats.map(c => <option key={c} value={c}>{CAT_EMOJI[c]} {CAT_LABELS[c]}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-soft mb-1 block">תגית</label>
                <select value={form.badge || ''} onChange={e => field('badge', e.target.value as Badge)}
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange">
                  <option value="">ללא</option>
                  <option value="sale">🔥 מבצע</option>
                  <option value="new">🆕 חדש</option>
                  <option value="top">⭐ הכי נמכר</option>
                  <option value="rec">✅ ממליץ</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-soft mb-1 block">מחיר (₪)</label>
                <input value={form.price || ''} onChange={e => field('price', e.target.value)}
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange"
                  placeholder="49" />
              </div>

              <div>
                <label className="text-xs font-bold text-soft mb-1 block">מחיר מקורי (₪)</label>
                <input value={form.orig || ''} onChange={e => field('orig', e.target.value)}
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange"
                  placeholder="89" />
              </div>

              <div className="col-span-2">
                <label className="text-xs font-bold text-soft mb-1 block">🔗 לינק אפיליאציה מאלי אקספרס *</label>
                <input value={form.link} onChange={e => field('link', e.target.value)}
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange"
                  placeholder="https://s.click.aliexpress.com/e/..." />
              </div>

              <div className="col-span-2">
                <label className="text-xs font-bold text-soft mb-1 block">תיאור קצר</label>
                <textarea value={form.desc || ''} onChange={e => field('desc', e.target.value)}
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange resize-none"
                  rows={2} placeholder="ספר קצת על המוצר..." />
              </div>

              {/* Media upload */}
              <div className="col-span-2">
                <label className="text-xs font-bold text-soft mb-1 block">📸 תמונה / סרטון</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:border-orange transition-colors"
                >
                  <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleFile} className="hidden" />
                  {mediaPreview ? (
                    <div className="relative">
                      {form.mediaType === 'video'
                        ? <video src={mediaPreview} className="max-h-32 mx-auto rounded-lg" controls />
                        : <img src={mediaPreview} className="max-h-32 mx-auto rounded-lg object-cover" alt="" />}
                      <button onClick={e => { e.stopPropagation(); setMediaPreview(null); setForm(f => ({ ...f, mediaData: null, mediaType: null })); }}
                        className="absolute top-1 end-1 bg-white rounded-full w-6 h-6 text-xs text-gray-500 shadow font-bold">✕</button>
                    </div>
                  ) : (
                    <div className="text-soft">
                      <div className="text-2xl mb-1">📷</div>
                      <div className="text-sm font-semibold">לחץ להעלאת תמונה או סרטון</div>
                      <div className="text-xs text-gray-400 mt-1">עד 15MB</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Stars */}
              <div className="col-span-2">
                <label className="text-xs font-bold text-soft mb-2 block">דירוג</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} type="button" onClick={() => setStars(n)}
                      className={`text-2xl transition-transform active:scale-90 ${n <= stars ? 'text-yellow-400' : 'text-gray-200'}`}>
                      ★
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-1">
              <button onClick={save}
                className="flex-1 bg-orange text-white font-bold py-3 rounded-xl hover:bg-deep-orange transition-colors">
                💾 שמור מוצר
              </button>
              <button onClick={() => { resetForm(); setTab('list'); }}
                className="px-5 bg-gray-100 text-soft font-semibold py-3 rounded-xl hover:bg-gray-200 transition-colors">
                ביטול
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
