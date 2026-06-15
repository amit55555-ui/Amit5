'use client';

import { forwardRef, useImperativeHandle, useMemo } from 'react';
import { motion, useMotionValue, useTransform, animate, type PanInfo } from 'framer-motion';
import { CAT_BG, CAT_EMOJI, CAT_LABELS, BADGE_CONFIG, type Product, type SwipeDirection } from '@/types';

export interface SwipeCardHandle { swipe: (dir: SwipeDirection) => Promise<void>; }

interface Props { product: Product; isTop: boolean; onSwipe: (dir: SwipeDirection) => void; }

/* Deterministic social-proof number from product ID */
function socialProof(id: string): number {
  const h = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return 18 + (h % 180);
}

export const SwipeCard = forwardRef<SwipeCardHandle, Props>(function SwipeCard(
  { product, isTop, onSwipe }, ref
) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-260, 260], [-18, 18]);

  const likeOpacity  = useTransform(x, [40, 130], [0, 1]);
  const nopeOpacity  = useTransform(x, [-40, -130], [0, 1]);
  const superOpacity = useTransform(y, [-40, -130], [0, 1]);

  const doSwipe = async (dir: SwipeDirection) => {
    if (dir !== 'left' && product.link) {
      window.open(product.link, '_blank', 'noopener,noreferrer');
    }
    if      (dir === 'right') await animate(x, 750,  { duration: 0.3, ease: 'easeIn' });
    else if (dir === 'left')  await animate(x, -750, { duration: 0.3, ease: 'easeIn' });
    else                      await animate(y, -900, { duration: 0.3, ease: 'easeIn' });
    onSwipe(dir);
  };

  useImperativeHandle(ref, () => ({ swipe: doSwipe }));

  const handleDragEnd = async (_: PointerEvent, info: PanInfo) => {
    const { offset } = info;
    if      (offset.x >  110) await doSwipe('right');
    else if (offset.x < -110) await doSwipe('left');
    else if (offset.y < -110) await doSwipe('up');
    else {
      animate(x, 0, { type: 'spring', stiffness: 380, damping: 32 });
      animate(y, 0, { type: 'spring', stiffness: 380, damping: 32 });
    }
  };

  const badge    = product.badge ? BADGE_CONFIG[product.badge] : null;
  const bg       = CAT_BG[product.cat];
  const emoji    = product.emoji || CAT_EMOJI[product.cat];
  const discount = product.price && product.orig && parseFloat(product.orig) > parseFloat(product.price)
    ? Math.round((1 - parseFloat(product.price) / parseFloat(product.orig)) * 100) : null;
  const proof    = useMemo(() => socialProof(product.id), [product.id]);

  const waShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `ראיתי את זה ומחשבת לקנות 👀\n*${product.name}*${product.price ? ` – ₪${product.price}` : ''}\n${product.link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.div
      className="absolute inset-0 no-select"
      style={{ x, y, rotate, touchAction: 'none', cursor: isTop ? 'grab' : 'default' }}
      drag={isTop}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.75}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: 'grabbing' }}
    >
      {/* LIKE overlay */}
      <motion.div className="absolute inset-0 z-20 flex items-center justify-end pe-8 rounded-3xl pointer-events-none overflow-hidden" style={{ opacity: likeOpacity }}>
        <div className="absolute inset-0 bg-gradient-to-l from-rose-500/70 to-transparent" />
        <div className="relative text-white font-black text-2xl border-[3px] border-white rounded-2xl px-4 py-2" style={{ transform: 'rotate(-12deg)', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>💖 רוצה!</div>
      </motion.div>

      {/* NOPE overlay */}
      <motion.div className="absolute inset-0 z-20 flex items-center ps-8 rounded-3xl pointer-events-none overflow-hidden" style={{ opacity: nopeOpacity }}>
        <div className="absolute inset-0 bg-gradient-to-r from-gray-700/70 to-transparent" />
        <div className="relative text-white font-black text-2xl border-[3px] border-white rounded-2xl px-4 py-2" style={{ transform: 'rotate(12deg)', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>✕ דלגי</div>
      </motion.div>

      {/* SUPER overlay */}
      <motion.div className="absolute inset-0 z-20 flex items-start justify-center pt-10 rounded-3xl pointer-events-none overflow-hidden" style={{ opacity: superOpacity }}>
        <div className="absolute inset-0 bg-gradient-to-b from-amber-400/70 to-transparent" />
        <div className="relative text-white font-black text-2xl border-[3px] border-white rounded-2xl px-5 py-2" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>⭐ חייבת!</div>
      </motion.div>

      {/* ── CARD ── */}
      <div className="w-full h-full rounded-3xl overflow-hidden relative"
        style={{ boxShadow: '0 30px 70px rgba(0,0,0,0.5), 0 8px 20px rgba(0,0,0,0.35)' }}>

        {/* BG */}
        <div className="absolute inset-0" style={{ background: bg }}>
          {product.mediaData ? (
            product.mediaType === 'video'
              ? <video src={product.mediaData} className="w-full h-full object-cover" autoPlay loop muted playsInline />
              : <img src={product.mediaData} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span style={{ fontSize: '7rem', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.15))' }}>{emoji}</span>
            </div>
          )}
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(20,4,15,0.97) 0%, rgba(20,4,15,0.65) 38%, rgba(20,4,15,0.08) 62%, transparent 82%)' }} />

        {/* TOP chips */}
        <div className="absolute top-4 start-4 end-4 flex items-start justify-between gap-2 z-10">
          <div className="glass text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <span>{CAT_EMOJI[product.cat]}</span>
            <span>{CAT_LABELS[product.cat]}</span>
          </div>
          {badge && (
            <div className={`text-xs font-black px-3 py-1.5 rounded-full border ${badge.cls}`}>{badge.label}</div>
          )}
        </div>

        {/* WhatsApp share button */}
        {isTop && (
          <button onClick={waShare}
            className="absolute top-16 end-4 z-10 w-9 h-9 rounded-full flex items-center justify-center text-base transition-all active:scale-90"
            style={{ background: 'rgba(37,211,102,0.85)', boxShadow: '0 4px 12px rgba(37,211,102,0.4)' }}
            title="שתפי ב-WhatsApp">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </button>
        )}

        {/* BOTTOM content */}
        <div className="absolute bottom-0 start-0 end-0 p-5 z-10">
          {/* Stars + social proof */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={`text-sm ${i < product.stars ? 'text-amber-400' : 'text-white/20'}`}>★</span>
              ))}
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.45)' }}>
              <span>❤️</span>
              <span>{proof} מעוניינות</span>
            </div>
          </div>

          {/* Name */}
          <h2 className="text-white font-black text-[1.2rem] leading-snug mb-1.5 line-clamp-2"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
            {product.name}
          </h2>

          {/* Desc */}
          {product.desc && (
            <p className="text-white/60 text-xs leading-relaxed line-clamp-2 mb-3">{product.desc}</p>
          )}

          {/* Price row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              {product.price && <span className="text-white font-black text-2xl">₪{product.price}</span>}
              {product.orig  && <span className="text-white/40 text-sm line-through">₪{product.orig}</span>}
              {discount && (
                <span className="text-xs font-black px-2 py-0.5 rounded-full"
                  style={{ background: 'linear-gradient(135deg,#d4a843,#b8892e)', color: '#fff' }}>
                  -{discount}%
                </span>
              )}
            </div>
            <div className="text-white/40 text-[10px] font-bold flex items-center gap-1">
              <span>החלקי ימינה</span><span>→</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
