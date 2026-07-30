'use client';

import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Search, X } from 'lucide-react';
import CardStack from '@/components/CardStack';
import ActionButtons from '@/components/ActionButtons';
import LikedDrawer from '@/components/LikedDrawer';
import OnboardingOverlay from '@/components/OnboardingOverlay';
import { type SwipeCardHandle } from '@/components/SwipeCard';
import { PRODUCTS } from '@/data/products';
import { CAT_LABELS, CAT_EMOJI, type Category, type Product, type SwipeDirection } from '@/types';
import { trackView, trackLike, getAnalytics } from '@/lib/analytics';
import { fetchCatalog } from '@/lib/catalog';

const CATS = Object.keys(CAT_LABELS) as Category[];

// Badge desirability weights — "top sellers" and "sales" convert best.
const BADGE_WEIGHT: Record<string, number> = { top: 40, sale: 35, rec: 20, new: 15 };

// Score a product for the "smart order" of the main stack. Higher = shown earlier.
// Combines discount depth, badge strength, star rating and (device-local) real
// engagement so the most tempting offers rise to the top — across categories.
function productScore(p: Product, stat?: { likes: number; clicks: number }): number {
  let score = 0;
  const price = parseFloat(p.price || '');
  const orig  = parseFloat(p.orig || '');
  if (orig > price && orig > 0) score += Math.round((1 - price / orig) * 100); // discount %
  if (p.badge) score += BADGE_WEIGHT[p.badge] || 0;
  score += (p.stars || 0) * 6;
  if (stat) score += stat.clicks * 12 + stat.likes * 4; // proven engagement
  return score;
}

const LS_CUSTOM    = 'shuk_custom_products';
const LS_LIKED     = 'shuk_liked_ids';
const LS_OVERRIDES = 'shuk_overrides';
const LS_HIDDEN    = 'shuk_hidden';

export default function HomePage() {
  const [activeCat, setActiveCat]     = useState<Category | 'all'>('all');
  const [idx, setIdx]                 = useState(0);
  const [liked, setLiked]             = useState<string[]>([]);
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [customProds, setCustomProds] = useState<Product[]>([]);
  const [overrides, setOverrides]     = useState<Record<string, Product>>({});
  const [hidden, setHidden]           = useState<string[]>([]);
  const [toast, setToast]             = useState('');
  const [search, setSearch]           = useState('');
  const [searchOpen, setSearchOpen]   = useState(false);
  const topRef = useRef<SwipeCardHandle | null>(null);

  useEffect(() => {
    // Liked history stays per-device (localStorage)
    try { const r = localStorage.getItem(LS_LIKED); if (r) setLiked(JSON.parse(r)); } catch { /**/ }

    // Load the shared catalog from the server; fall back to local cache if offline.
    (async () => {
      const cat = await fetchCatalog();
      if (cat) {
        setCustomProds(cat.custom);
        setOverrides(cat.overrides);
        setHidden(cat.hidden);
        try {
          localStorage.setItem(LS_CUSTOM, JSON.stringify(cat.custom));
          localStorage.setItem(LS_OVERRIDES, JSON.stringify(cat.overrides));
          localStorage.setItem(LS_HIDDEN, JSON.stringify(cat.hidden));
        } catch { /**/ }
      } else {
        try { const r = localStorage.getItem(LS_CUSTOM);    if (r) setCustomProds(JSON.parse(r)); } catch { /**/ }
        try { const r = localStorage.getItem(LS_OVERRIDES); if (r) setOverrides(JSON.parse(r)); }    catch { /**/ }
        try { const r = localStorage.getItem(LS_HIDDEN);    if (r) setHidden(JSON.parse(r)); }       catch { /**/ }
      }
    })();
  }, []);

  // Merge: built-ins (minus hidden, with overrides) + custom
  const allProducts = useMemo<Product[]>(() => {
    const builtins = PRODUCTS
      .filter(p => !hidden.includes(p.id))
      .map(p => overrides[p.id] ?? p);
    return [...builtins, ...customProds];
  }, [overrides, hidden, customProds]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = activeCat === 'all' ? allProducts : allProducts.filter(p => p.cat === activeCat);
    if (q) {
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.desc && p.desc.toLowerCase().includes(q)) ||
        CAT_LABELS[p.cat].toLowerCase().includes(q)
      );
    }
    // Smart ordering: when browsing "all" without a search, surface the most
    // compelling products first (best deals / top-rated / most engaged), even
    // if that interleaves different categories. This lifts conversions by
    // putting the strongest offers at the top of the stack.
    if (activeCat === 'all' && !q) {
      const stats = getAnalytics();
      list = [...list].sort((a, b) => productScore(b, stats[b.id]) - productScore(a, stats[a.id]));
    }
    return list;
  }, [allProducts, activeCat, search]);

  const remaining = filtered.slice(idx);
  const done = remaining.length === 0;

  // Track a view whenever a new product reaches the top of the stack.
  useEffect(() => {
    if (remaining[0]) trackView(remaining[0].id);
  }, [remaining[0]?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lock body scrolling only on this swipe screen; restore on unmount.
  useEffect(() => {
    document.body.classList.add('lock-scroll');
    return () => document.body.classList.remove('lock-scroll');
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  }, []);

  const handleSwipe = useCallback((dir: SwipeDirection) => {
    const product = remaining[0];
    if (!product) return;
    if (dir === 'right' || dir === 'up') {
      trackLike(product.id);
      if (!liked.includes(product.id)) {
        const newLiked = [...liked, product.id];
        setLiked(newLiked);
        localStorage.setItem(LS_LIKED, JSON.stringify(newLiked));
      }
      showToast(dir === 'right' ? '🛒 פותח לינק...' : '❤️ נשמר למועדפים');
    } else {
      showToast('👋 דלגת');
    }
    setIdx(i => i + 1);
  }, [remaining, liked, showToast]);

  const changeCat = (cat: Category | 'all') => {
    setActiveCat(cat);
    setIdx(0);
  };

  const reset = () => setIdx(0);

  return (
    <div className="flex flex-col h-screen bg-cream overflow-hidden">

      <OnboardingOverlay />

      {/* ── HEADER ── */}
      <header className="bg-dark flex-shrink-0 shadow-lg">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#ff6b35,#f9a825)' }}>
              🛍️
            </div>
            <div className="leading-tight">
              <div className="text-white font-black text-base leading-none">
                שוק <span className="text-gold">הטעמים</span>
              </div>
              <div className="text-white/40 text-[10px] leading-none mt-0.5">גלה מוצרים מדהימים</div>
            </div>
          </div>

          <div className="text-white/50 text-xs font-semibold flex-1 text-center">
            {!done && <span>{remaining.length} מוצרים</span>}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => { setSearchOpen(o => !o); if (searchOpen) { setSearch(''); setIdx(0); } }}
              className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              aria-label="חיפוש"
            >
              <Search className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={() => setDrawerOpen(true)}
              className="relative w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
            >
              <Heart className="w-4 h-4 text-white" />
              {liked.length > 0 && (
                <span className="absolute -top-1 -end-1 w-4 h-4 bg-orange rounded-full text-[9px] font-black text-white flex items-center justify-center">
                  {liked.length > 9 ? '9+' : liked.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── CATEGORY TABS ── */}
        <div className="overflow-x-auto border-t border-white/10">
          <div className="flex gap-1 px-4 py-2 w-max">
            <button
              onClick={() => changeCat('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap
                ${activeCat === 'all'
                  ? 'bg-orange text-white shadow-lg shadow-orange/40'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
            >
              🔥 הכל
            </button>
            {CATS.map(cat => (
              <button
                key={cat}
                onClick={() => changeCat(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap
                  ${activeCat === cat
                    ? 'bg-orange text-white shadow-lg shadow-orange/40'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
              >
                {CAT_EMOJI[cat]} {CAT_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* ── SEARCH BAR ── */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-white/10"
            >
              <div className="px-4 py-2 max-w-lg mx-auto">
                <div className="relative">
                  <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-white/40" />
                  <input
                    autoFocus
                    value={search}
                    onChange={e => { setSearch(e.target.value); setIdx(0); }}
                    placeholder="חפש מוצר..."
                    className="w-full bg-white/10 text-white placeholder-white/40 rounded-full ps-9 pe-9 py-2 text-sm focus:outline-none focus:bg-white/20 transition-colors"
                  />
                  {search && (
                    <button
                      onClick={() => { setSearch(''); setIdx(0); }}
                      className="absolute top-1/2 -translate-y-1/2 end-3 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── SWIPE HINT ── */}
      <div className="flex-shrink-0 flex items-center justify-center gap-3 py-2 px-4 text-[11px] text-soft/60 select-none">
        <span>← שמאל לדלג</span>
        <span className="text-border">|</span>
        <span>↑ למעלה לשמור</span>
        <span className="text-border">|</span>
        <span>ימינה לקנייה →</span>
      </div>

      {/* ── CARD AREA ── */}
      <div className="flex-1 flex items-center justify-center px-4 min-h-0">
        {done ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-8"
          >
            <div className="text-6xl mb-4">{search ? '🔍' : '🎉'}</div>
            <h2 className="text-2xl font-black text-dark mb-2">
              {search ? 'לא נמצאו מוצרים' : 'ראית הכל!'}
            </h2>
            <p className="text-soft text-sm mb-1">
              {search
                ? `נסה חיפוש אחר עבור "${search}"`
                : `אהבת ${liked.length} מוצרים מתוך ${filtered.length}`}
            </p>
            {liked.length > 0 && (
              <button onClick={() => setDrawerOpen(true)} className="mt-2 text-orange text-sm font-bold underline underline-offset-2">
                ← צפה במוצרים שאהבתי
              </button>
            )}
            <br />
            <button
              onClick={reset}
              className="mt-4 bg-orange hover:bg-deep-orange text-white font-bold px-8 py-3 rounded-full transition-colors shadow-lg"
            >
              🔄 התחל מחדש
            </button>
          </motion.div>
        ) : (
          <div className="relative w-full max-w-sm" style={{ height: 'min(72vh, 520px)' }}>
            <CardStack products={remaining} onSwipe={handleSwipe} topRef={topRef} />
          </div>
        )}
      </div>

      {/* ── ACTION BUTTONS ── */}
      <div className="flex-shrink-0 pb-4 pt-2">
        <ActionButtons
          disabled={done}
          onSkip={() => topRef.current?.swipe('left')}
          onFavorite={() => topRef.current?.swipe('up')}
          onBuy={() => topRef.current?.swipe('right')}
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

      <LikedDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        likedIds={liked}
        customProducts={customProds}
        overrides={overrides}
      />
    </div>
  );
}
