'use client';

import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CardStack from '@/components/CardStack';
import ActionButtons from '@/components/ActionButtons';
import AdminPanel from '@/components/AdminPanel';
import { type SwipeCardHandle } from '@/components/SwipeCard';
import { PRODUCTS } from '@/data/products';
import { CAT_LABELS, CAT_EMOJI, type Category, type Product, type SwipeDirection } from '@/types';

const CATS = Object.keys(CAT_LABELS) as Category[];
const LS_KEY = 'sheli_custom_products';

export default function HomePage() {
  const [activeCat, setActiveCat]     = useState<Category | 'all'>('all');
  const [idx, setIdx]                 = useState(0);
  const [liked, setLiked]             = useState<string[]>([]);
  const [adminOpen, setAdminOpen]     = useState(false);
  const [customProds, setCustomProds] = useState<Product[]>([]);
  const [toast, setToast]             = useState('');
  const [showHint, setShowHint]       = useState(true);
  const topRef = useRef<SwipeCardHandle | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setCustomProds(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 3500);
    return () => clearTimeout(t);
  }, []);

  const saveCustom = useCallback((prods: Product[]) => {
    setCustomProds(prods);
    localStorage.setItem(LS_KEY, JSON.stringify(prods));
  }, []);

  const allProducts = useMemo(() => [...PRODUCTS, ...customProds], [customProds]);

  const filtered = useMemo(() =>
    activeCat === 'all' ? allProducts : allProducts.filter(p => p.cat === activeCat),
    [allProducts, activeCat]
  );

  const remaining = filtered.slice(idx);
  const done = remaining.length === 0;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const handleSwipe = useCallback((dir: SwipeDirection) => {
    const product = remaining[0];
    if (!product) return;
    if (dir === 'right' || dir === 'up') {
      setLiked(l => [...l, product.id]);
      showToast('💖 פותחת לינק לרכישה...');
    } else {
      showToast('👋 הבא!');
    }
    setIdx(i => i + 1);
  }, [remaining]);

  const changeCat = (cat: Category | 'all') => {
    setActiveCat(cat);
    setIdx(0);
  };

  const reset = () => setIdx(0);

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#0f0410' }}>

      {/* ── HEADER ── */}
      <header className="flex-shrink-0 relative z-30" style={{ background: 'linear-gradient(180deg,#1a0816 0%,#150612 100%)' }}>
        {/* Top bar */}
        <div className="max-w-lg mx-auto px-4 pt-4 pb-3 flex items-center justify-between gap-3">

          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 shadow-lg"
              style={{ background: 'linear-gradient(135deg,#c14b7c,#9c3060)', boxShadow: '0 4px 15px rgba(193,75,124,0.5)' }}>
              💖
            </div>
            <div className="leading-tight">
              <div className="font-black text-lg leading-none shine-text tracking-wide">Sheli</div>
              <div className="text-[10px] leading-none mt-0.5 font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>
                המוצרים שאני מאהבת
              </div>
            </div>
          </div>

          {/* Counter */}
          {!done && (
            <div className="text-xs font-bold flex-1 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {remaining.length} מוצרים
            </div>
          )}

          {/* Admin button */}
          <button
            onClick={() => setAdminOpen(true)}
            className="flex-shrink-0 flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full transition-all active:scale-95"
            style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <span>⚙️</span>
            <span>ניהול</span>
          </button>
        </div>

        {/* Category chips */}
        <div className="cat-scroll overflow-x-auto border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex gap-2 px-4 py-2.5 w-max">
            <button
              onClick={() => changeCat('all')}
              className="px-4 py-1.5 rounded-full text-xs font-black transition-all whitespace-nowrap"
              style={activeCat === 'all'
                ? { background: 'linear-gradient(135deg,#c14b7c,#9c3060)', color: '#fff', boxShadow: '0 4px 14px rgba(193,75,124,0.4)' }
                : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
              ✨ הכל
            </button>
            {CATS.map(cat => (
              <button key={cat}
                onClick={() => changeCat(cat)}
                className="px-4 py-1.5 rounded-full text-xs font-black transition-all whitespace-nowrap"
                style={activeCat === cat
                  ? { background: 'linear-gradient(135deg,#c14b7c,#9c3060)', color: '#fff', boxShadow: '0 4px 14px rgba(193,75,124,0.4)' }
                  : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {CAT_EMOJI[cat]} {CAT_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── SWIPE HINT ── */}
      <AnimatePresence>
        {showHint && !done && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex-shrink-0 flex items-center justify-center gap-4 py-2"
          >
            <span className="text-[10px] font-bold flex items-center gap-1 pulse-soft" style={{ color: 'rgba(255,255,255,0.35)' }}>
              <span>←</span> דלגי
            </span>
            <span className="text-[10px] font-bold flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
            <span className="text-[10px] font-bold flex items-center gap-1 pulse-soft" style={{ color: 'rgba(193,75,124,0.7)' }}>
              💖 החלקי ימינה לרכישה <span>→</span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CARD AREA ── */}
      <div className="flex-1 flex items-center justify-center px-5 min-h-0">
        {done ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center px-6 py-10 rounded-3xl w-full max-w-sm"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-black text-white mb-2">ראית הכל!</h2>
            <p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
              אהבת <span className="text-rose-400 font-bold">{liked.length}</span> מוצרים מתוך {filtered.length}
            </p>
            <button
              onClick={reset}
              className="mt-5 font-black px-8 py-3.5 rounded-full text-white transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg,#c14b7c,#9c3060)', boxShadow: '0 6px 20px rgba(193,75,124,0.4)' }}>
              🔄 התחלי מחדש
            </button>
          </motion.div>
        ) : (
          <div className="relative w-full max-w-sm" style={{ height: 'min(70vh, 530px)' }}>
            <CardStack products={remaining} onSwipe={handleSwipe} topRef={topRef} />
          </div>
        )}
      </div>

      {/* ── ACTION BUTTONS ── */}
      {!done && (
        <div className="flex-shrink-0 pb-6 pt-2">
          <ActionButtons
            disabled={done}
            onNope={()      => topRef.current?.swipe('left')}
            onSuperLike={()  => topRef.current?.swipe('up')}
            onLike={()       => topRef.current?.swipe('right')}
          />
          <p className="text-center text-[10px] font-semibold mt-2.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
            ✕ דלגי &nbsp;·&nbsp; ⭐ חייבת! &nbsp;·&nbsp; 💖 רוצה!
          </p>
        </div>
      )}

      {/* ── TOAST ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast + Date.now()}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed bottom-28 left-1/2 -translate-x-1/2 text-white text-sm font-black px-6 py-3 rounded-full z-40 whitespace-nowrap"
            style={{
              background: 'linear-gradient(135deg,#c14b7c,#9c3060)',
              boxShadow: '0 8px 25px rgba(193,75,124,0.5), 0 2px 8px rgba(0,0,0,0.4)',
            }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ADMIN PANEL ── */}
      {adminOpen && (
        <AdminPanel
          onClose={() => setAdminOpen(false)}
          onSave={saveCustom}
          customProducts={customProds}
        />
      )}
    </div>
  );
}
