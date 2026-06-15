'use client';

import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CardStack from '@/components/CardStack';
import ActionButtons from '@/components/ActionButtons';
import AdminPanel from '@/components/AdminPanel';
import PinModal from '@/components/PinModal';
import WishlistPanel from '@/components/WishlistPanel';
import ConfettiHeart from '@/components/ConfettiHeart';
import { type SwipeCardHandle } from '@/components/SwipeCard';
import { PRODUCTS } from '@/data/products';
import { CAT_LABELS, CAT_EMOJI, type Category, type Product, type SwipeDirection } from '@/types';

const CATS = Object.keys(CAT_LABELS) as Category[];
const LS_KEY = 'catchit_custom_products';

/* ── Soft sound via Web Audio API ── */
function playSound(type: 'like' | 'nope' | 'super') {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (type === 'like') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(820, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    } else if (type === 'super') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
    }
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch { /* ignore if AudioContext not available */ }
}

export default function HomePage() {
  const [activeCat, setActiveCat]       = useState<Category | 'all'>('all');
  const [idx, setIdx]                   = useState(0);
  const [likedProducts, setLikedProducts] = useState<Product[]>([]);
  const [customProds, setCustomProds]   = useState<Product[]>([]);
  const [toast, setToast]               = useState('');
  const [showHint, setShowHint]         = useState(true);

  /* Admin – hidden behind 5 logo taps + PIN */
  const [logotaps, setLogotaps]         = useState(0);
  const [showPin, setShowPin]           = useState(false);
  const [adminOpen, setAdminOpen]       = useState(false);
  const tapTimer                        = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Wishlist panel */
  const [wishlistOpen, setWishlistOpen] = useState(false);

  /* Confetti */
  const [confettiTrigger, setConfettiTrigger] = useState(0);

  const topRef = useRef<SwipeCardHandle | null>(null);

  /* Load custom products */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setCustomProds(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  /* Hide hint after 4s */
  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 4000);
    return () => clearTimeout(t);
  }, []);

  const saveCustom = useCallback((prods: Product[]) => {
    setCustomProds(prods);
    localStorage.setItem(LS_KEY, JSON.stringify(prods));
  }, []);

  const allProducts = useMemo(() => [...PRODUCTS, ...customProds], [customProds]);
  const filtered    = useMemo(() =>
    activeCat === 'all' ? allProducts : allProducts.filter(p => p.cat === activeCat),
    [allProducts, activeCat]
  );
  const remaining = filtered.slice(idx);
  const done      = remaining.length === 0;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2400);
  };

  /* Logo tap handler – 5 taps → PIN */
  const handleLogoTap = () => {
    if (tapTimer.current) clearTimeout(tapTimer.current);
    const next = logotaps + 1;
    setLogotaps(next);
    tapTimer.current = setTimeout(() => setLogotaps(0), 2200);
    if (next >= 5) {
      setLogotaps(0);
      setShowPin(true);
    }
  };

  const handleSwipe = useCallback((dir: SwipeDirection) => {
    const product = remaining[0];
    if (!product) return;
    if (dir === 'right' || dir === 'up') {
      setLikedProducts(l => [...l, product]);
      setConfettiTrigger(t => t + 1);
      playSound(dir === 'up' ? 'super' : 'like');
      showToast('💖 פותחת לינק לרכישה...');
    } else {
      playSound('nope');
      showToast('👋 הבא!');
    }
    setIdx(i => i + 1);
  }, [remaining]);

  const changeCat = (cat: Category | 'all') => {
    setActiveCat(cat);
    setIdx(0);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#0f0410' }}>

      {/* ── HEADER ── */}
      <header className="flex-shrink-0 relative z-30"
        style={{ background: 'linear-gradient(180deg,#1a0816 0%,#150612 100%)' }}>
        <div className="max-w-lg mx-auto px-4 pt-4 pb-3 flex items-center justify-between gap-3">

          {/* Logo — tap 5× to open admin */}
          <button
            onClick={handleLogoTap}
            className="flex items-center gap-2.5 flex-shrink-0 relative active:scale-95 transition-transform"
          >
            {/* Tap ring effect */}
            {logotaps > 0 && (
              <span key={logotaps}
                className="absolute inset-0 rounded-2xl border-2 border-rose-500 logo-tap-ring pointer-events-none"
                style={{ zIndex: 10 }} />
            )}
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#c14b7c,#9c3060)',
                       boxShadow: '0 4px 15px rgba(193,75,124,0.5)' }}>
              💖
            </div>
            <div className="leading-tight">
              <div className="font-black text-lg leading-none shine-text tracking-wide">Catchit</div>
              <div className="text-[10px] leading-none mt-0.5 font-semibold"
                style={{ color: 'rgba(255,255,255,0.35)' }}>
                המוצרים שאני מאהבת
              </div>
            </div>
          </button>

          {/* Counter */}
          {!done && (
            <div className="text-xs font-bold flex-1 text-center"
              style={{ color: 'rgba(255,255,255,0.28)' }}>
              {remaining.length} מוצרים
            </div>
          )}

          {/* Wishlist button */}
          <button
            onClick={() => setWishlistOpen(true)}
            className="flex-shrink-0 relative flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full transition-all active:scale-95"
            style={{ background: 'rgba(193,75,124,0.15)', color: 'rgba(255,255,255,0.75)',
                     border: '1px solid rgba(193,75,124,0.3)' }}>
            <span>💖</span>
            <span>שמורים</span>
            {likedProducts.length > 0 && (
              <span className="absolute -top-1 -end-1 w-5 h-5 rounded-full text-white text-[10px] font-black flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#c14b7c,#9c3060)' }}>
                {likedProducts.length}
              </span>
            )}
          </button>
        </div>

        {/* Category chips */}
        <div className="cat-scroll overflow-x-auto border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex gap-2 px-4 py-2.5 w-max">
            <button onClick={() => changeCat('all')}
              className="px-4 py-1.5 rounded-full text-xs font-black transition-all whitespace-nowrap"
              style={activeCat === 'all'
                ? { background: 'linear-gradient(135deg,#c14b7c,#9c3060)', color: '#fff',
                    boxShadow: '0 4px 14px rgba(193,75,124,0.4)' }
                : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)',
                    border: '1px solid rgba(255,255,255,0.1)' }}>
              ✨ הכל
            </button>
            {CATS.map(cat => (
              <button key={cat} onClick={() => changeCat(cat)}
                className="px-4 py-1.5 rounded-full text-xs font-black transition-all whitespace-nowrap"
                style={activeCat === cat
                  ? { background: 'linear-gradient(135deg,#c14b7c,#9c3060)', color: '#fff',
                      boxShadow: '0 4px 14px rgba(193,75,124,0.4)' }
                  : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)',
                      border: '1px solid rgba(255,255,255,0.1)' }}>
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
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex-shrink-0 flex items-center justify-center gap-4 py-2">
            <span className="text-[10px] font-bold flex items-center gap-1 pulse-soft"
              style={{ color: 'rgba(255,255,255,0.32)' }}>
              <span>←</span> דלגי
            </span>
            <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 10 }}>|</span>
            <span className="text-[10px] font-bold flex items-center gap-1 pulse-soft"
              style={{ color: 'rgba(193,75,124,0.75)' }}>
              💖 החלקי ימינה לרכישה <span>→</span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CARD AREA ── */}
      <div className="flex-1 flex items-center justify-center px-5 min-h-0">
        {done ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
            className="text-center px-6 py-10 rounded-3xl w-full max-w-sm"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-black text-white mb-2">ראית הכל!</h2>
            <p className="text-sm mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
              אהבת <span className="text-rose-400 font-black">{likedProducts.length}</span> מוצרים מתוך {filtered.length}
            </p>
            {likedProducts.length > 0 && (
              <button onClick={() => setWishlistOpen(true)}
                className="mt-3 text-sm font-black px-6 py-2.5 rounded-full border transition-all active:scale-95"
                style={{ borderColor: '#c14b7c', color: '#c14b7c' }}>
                💖 ראי את הרשימה שלך
              </button>
            )}
            <button onClick={() => setIdx(0)}
              className="mt-3 w-full font-black px-8 py-3.5 rounded-full text-white transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg,#c14b7c,#9c3060)',
                       boxShadow: '0 6px 20px rgba(193,75,124,0.4)' }}>
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
          <p className="text-center text-[10px] font-semibold mt-2.5"
            style={{ color: 'rgba(255,255,255,0.18)' }}>
            ✕ דלגי &nbsp;·&nbsp; ⭐ חייבת! &nbsp;·&nbsp; 💖 רוצה!
          </p>
        </div>
      )}

      {/* ── TOAST ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast + Date.now()}
            initial={{ opacity: 0, y: 30, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed bottom-28 left-1/2 -translate-x-1/2 text-white text-sm font-black px-6 py-3 rounded-full z-40 whitespace-nowrap"
            style={{ background: 'linear-gradient(135deg,#c14b7c,#9c3060)',
                     boxShadow: '0 8px 25px rgba(193,75,124,0.5)' }}>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CONFETTI ── */}
      <ConfettiHeart trigger={confettiTrigger} />

      {/* ── WISHLIST PANEL ── */}
      <AnimatePresence>
        {wishlistOpen && (
          <WishlistPanel
            products={likedProducts}
            onClose={() => setWishlistOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── PIN MODAL ── */}
      <AnimatePresence>
        {showPin && (
          <PinModal
            onSuccess={() => { setShowPin(false); setAdminOpen(true); }}
            onCancel={() => setShowPin(false)}
          />
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
