'use client';

import { useState, useRef } from 'react';
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

export default function AdminPanel({ onClose, onSave, customProducts }: Props) {
  const [tab, setTab]               = useState<'list' | 'add'>('list');
  const [form, setForm]             = useState<Omit<Product, 'id'>>(EMPTY);
  const [editId, setEditId]         = useState<string | null>(null);
  const [stars, setStars]           = useState(5);
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

  const cats = (Object.keys(CAT_LABELS) as Category[]);

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
          <p className="text-xs text-gray-500 mt-0.5">הוסיפי מוצרים עם תמונה/סרטון, מחיר ולינק רכישה</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 mb-5 gap-1">
          {([['list', `📋 המוצרים שלי (${customProducts.length})`], ['add', editId ? '✏️ עריכה' : '➕ מוצר חדש']] as const).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors -mb-px ${
                tab === t
                  ? 'border-rose-500 text-rose-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* ── LIST TAB ── */}
        {tab === 'list' && (
          <div>
            {customProducts.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-5xl mb-3">🛍️</div>
                <p className="text-gray-500 text-sm font-semibold">עדיין אין מוצרים מותאמים אישית</p>
                <p className="text-gray-400 text-xs mt-1">לחצי על הכפתור למטה להוספת המוצר הראשון</p>
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
                        className="text-xs font-bold px-3 py-1.5 rounded-xl transition-colors"
                        style={{ background: '#fce8f3', color: '#c14b7c' }}>
                        ערוך
                      </button>
                      <button onClick={() => del(p.id)}
                        className="text-xs font-bold px-3 py-1.5 rounded-xl bg-red-50 text-red-600 transition-colors hover:bg-red-100">
                        מחק
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => { resetForm(); setTab('add'); }}
              className="w-full text-white font-black py-3.5 rounded-2xl transition-all active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg,#c14b7c,#9c3060)' }}>
              ➕ הוסיפי מוצר חדש
            </button>
          </div>
        )}

        {/* ── ADD/EDIT TAB ── */}
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
              {/* Product name */}
              <div className="col-span-2">
                <label className="text-xs font-bold text-gray-500 mb-1 block">שם המוצר *</label>
                <input value={form.name} onChange={e => field('name', e.target.value)}
                  className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none transition-colors"
                  style={{ borderColor: '#f5d0e8', background: '#fdf8fb' }}
                  onFocus={e => e.target.style.borderColor = '#c14b7c'}
                  onBlur={e => e.target.style.borderColor = '#f5d0e8'}
                  placeholder="למשל: סרום פנים עם ויטמין C" />
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">קטגוריה *</label>
                <select value={form.cat} onChange={e => field('cat', e.target.value as Category)}
                  className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                  style={{ borderColor: '#f5d0e8', background: '#fdf8fb' }}>
                  {cats.map(c => <option key={c} value={c}>{CAT_EMOJI[c]} {CAT_LABELS[c]}</option>)}
                </select>
              </div>

              {/* Badge */}
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

              {/* Price */}
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">מחיר (₪)</label>
                <input value={form.price || ''} onChange={e => field('price', e.target.value)}
                  className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                  style={{ borderColor: '#f5d0e8', background: '#fdf8fb' }}
                  placeholder="49" />
              </div>

              {/* Orig price */}
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">מחיר מקורי (₪)</label>
                <input value={form.orig || ''} onChange={e => field('orig', e.target.value)}
                  className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                  style={{ borderColor: '#f5d0e8', background: '#fdf8fb' }}
                  placeholder="89" />
              </div>

              {/* Link */}
              <div className="col-span-2">
                <label className="text-xs font-bold text-gray-500 mb-1 block">🔗 לינק לרכישה *</label>
                <input value={form.link} onChange={e => field('link', e.target.value)}
                  className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none"
                  style={{ borderColor: '#f5d0e8', background: '#fdf8fb' }}
                  placeholder="https://..." />
              </div>

              {/* Description */}
              <div className="col-span-2">
                <label className="text-xs font-bold text-gray-500 mb-1 block">תיאור קצר</label>
                <textarea value={form.desc || ''} onChange={e => field('desc', e.target.value)}
                  className="w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none resize-none"
                  style={{ borderColor: '#f5d0e8', background: '#fdf8fb' }}
                  rows={2} placeholder="ספרי קצת על המוצר..." />
              </div>

              {/* Stars */}
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
                className="px-5 bg-gray-100 text-gray-500 font-semibold py-3.5 rounded-2xl hover:bg-gray-200 transition-colors">
                ביטול
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
