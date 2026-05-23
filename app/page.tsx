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
const LS_KEY = 'shuk_custom_products';

export default function HomePage() {
  const [activeCat, setActiveCat]       = useState<Category | 'all'>('all');
  const [idx, setIdx]                   = useState(0);
  const [liked, setLiked]               = useState<string[]>([]);
  const [adminOpen, setAdminOpen]       = useState(false);
  const [customProds, setCustomProds]   = useState<Product[]>([]);
  const [toast, setToast]               = useState('');
  const topRef = useRef<SwipeCardHandle | null>(null);

  // Load custom products from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setCustomProds(JSON.parse(raw));
    } catch { /* ignore */ }
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
    setTimeout(() => setToast(''), 2200);
  };

  const handleSwipe = useCallback((dir: SwipeDirection) => {
    const product = remaining[0];
    if (!product) return;
    if (dir === 'right' || dir === 'up') {
      setLiked(l => [...l, product.id]);
      showToast('❤️ פותח לינק מאלי אקספרס...');
    } else {
      showToast('👋 דלגת');
    }
    setIdx(i => i + 1);
  }, [remaining]);

  const changeCat = (cat: Category | 'all') => {
    setActiveCat(cat);
    setIdx(0);
  };

  const reset = () => setIdx(0);

  return (
    <div className="flex flex-col h-screen bg-cream overflow-hidden">

      {/* ── HEADER ── */}
      <header className="bg-dark flex-shrink-0 shadow-lg">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#ff6b35,#f9a825)' }}>
              🍽️
            </div>
            <div className="leading-tight">
              <div className="text-white font-black text-base leading-none">
                שוק <span className="text-gold">הטעמים</span>
              </div>
              <div className="text-white/40 text-[10px] leading-none mt-0.5">AliExpress</div>
            </div>
          </div>

          {/* Counter */}
          <div className="text-white/50 text-xs font-semibold flex-shrink-0">
            {!done && <span>{remaining.length} מוצרים</span>}
          </div>

          {/* Admin */}
          <button onClick={() => setAdminOpen(true)}
            className="bg-orange hover:bg-deep-orange text-white text-xs font-bold px-4 py-2 rounded-full transition-colors flex-shrink-0">
            ⚙️ ניהול
          </button>
        </div>

        {/* Category filter */}
        <div className="overflow-x-auto border-t border-white/10">
          <div className="flex gap-1 px-4 py-2 w-max">
            <button
              onClick={() => changeCat('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap
                ${activeCat === 'all' ? 'bg-orange text-white shadow' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>
              ✨ הכל
            </button>
            {CATS.map(cat => (
              <button key={cat}
                onClick={() => changeCat(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap
                  ${activeCat === cat ? 'bg-orange text-white shadow' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}>
                {CAT_EMOJI[cat]} {CAT_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── HINT (first visit) ── */}
      <div className="flex-shrink-0 text-center py-2 text-xs text-soft/60 select-none">
        ← החלק שמאל לדלג &nbsp;|&nbsp; החלק ימינה / למעלה לקנייה →
      </div>

      {/* ── CARD AREA ── */}
      <div className="flex-1 flex items-center justify-center px-4 min-h-0">
        {done ? (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-8"
          >
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-black text-dark mb-2">ראית הכל!</h2>
            <p className="text-soft text-sm mb-2">
              אהבת {liked.length} מוצרים מתוך {filtered.length}
            </p>
            <button
              onClick={reset}
              className="mt-4 bg-orange hover:bg-deep-orange text-white font-bold px-8 py-3 rounded-full transition-colors shadow-lg">
              🔄 התחל מחדש
            </button>
          </motion.div>
        ) : (
          /* Card stack */
          <div className="relative w-full max-w-sm" style={{ height: 'min(72vh, 520px)' }}>
            <CardStack products={remaining} onSwipe={handleSwipe} topRef={topRef} />
          </div>
        )}
      </div>

      {/* ── ACTION BUTTONS ── */}
      <div className="flex-shrink-0 pb-4 pt-2">
        <ActionButtons
          disabled={done}
          onNope={() => topRef.current?.swipe('left')}
          onSuperLike={() => topRef.current?.swipe('up')}
          onLike={() => topRef.current?.swipe('right')}
        />
      </div>

      {/* ── TOAST ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast + Date.now()}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-dark text-white text-sm font-bold px-5 py-2.5 rounded-full shadow-xl z-40 whitespace-nowrap"
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
