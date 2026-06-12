'use client';

import { forwardRef, useImperativeHandle } from 'react';
import { motion, useMotionValue, useTransform, animate, type PanInfo } from 'framer-motion';
import { CAT_BG, CAT_EMOJI, CAT_LABELS, BADGE_CONFIG, type Product, type SwipeDirection } from '@/types';

export interface SwipeCardHandle {
  swipe: (dir: SwipeDirection) => Promise<void>;
}

interface Props {
  product: Product;
  isTop: boolean;
  onSwipe: (dir: SwipeDirection) => void;
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

  const badge   = product.badge ? BADGE_CONFIG[product.badge] : null;
  const bg      = CAT_BG[product.cat];
  const emoji   = product.emoji || CAT_EMOJI[product.cat];
  const discount = product.price && product.orig && parseFloat(product.orig) > parseFloat(product.price)
    ? Math.round((1 - parseFloat(product.price) / parseFloat(product.orig)) * 100)
    : null;

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
      <motion.div
        className="absolute inset-0 z-20 flex items-center justify-end pe-8 rounded-3xl pointer-events-none overflow-hidden"
        style={{ opacity: likeOpacity }}
      >
        <div className="absolute inset-0 bg-gradient-to-l from-rose-500/70 to-transparent" />
        <div className="relative text-white font-black text-2xl border-[3px] border-white rounded-2xl px-4 py-2"
          style={{ transform: 'rotate(-12deg)', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
          💖 רוצה!
        </div>
      </motion.div>

      {/* NOPE overlay */}
      <motion.div
        className="absolute inset-0 z-20 flex items-center ps-8 rounded-3xl pointer-events-none overflow-hidden"
        style={{ opacity: nopeOpacity }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-gray-700/70 to-transparent" />
        <div className="relative text-white font-black text-2xl border-[3px] border-white rounded-2xl px-4 py-2"
          style={{ transform: 'rotate(12deg)', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
          ✕ דלגי
        </div>
      </motion.div>

      {/* SUPER LIKE overlay */}
      <motion.div
        className="absolute inset-0 z-20 flex items-start justify-center pt-10 rounded-3xl pointer-events-none overflow-hidden"
        style={{ opacity: superOpacity }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-amber-400/70 to-transparent" />
        <div className="relative text-white font-black text-2xl border-[3px] border-white rounded-2xl px-5 py-2"
          style={{ textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
          ⭐ חייבת!
        </div>
      </motion.div>

      {/* ── CARD ── */}
      <div className="w-full h-full rounded-3xl overflow-hidden relative"
        style={{ boxShadow: '0 25px 65px rgba(0,0,0,0.45), 0 8px 20px rgba(0,0,0,0.3)' }}>

        {/* Background / Media */}
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

        {/* Full gradient overlay from bottom */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(20,4,15,0.96) 0%, rgba(20,4,15,0.65) 35%, rgba(20,4,15,0.1) 60%, transparent 80%)' }} />

        {/* TOP chips */}
        <div className="absolute top-4 start-4 end-4 flex items-start justify-between gap-2 z-10">
          {/* Category badge */}
          <div className="glass text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <span>{CAT_EMOJI[product.cat]}</span>
            <span>{CAT_LABELS[product.cat]}</span>
          </div>

          {/* Badge */}
          {badge && (
            <div className={`text-xs font-black px-3 py-1.5 rounded-full border ${badge.cls}`}>
              {badge.label}
            </div>
          )}
        </div>

        {/* BOTTOM content */}
        <div className="absolute bottom-0 start-0 end-0 p-5 z-10">
          {/* Stars */}
          <div className="flex items-center gap-0.5 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={`text-sm ${i < product.stars ? 'text-amber-400' : 'text-white/20'}`}>★</span>
            ))}
          </div>

          {/* Product name */}
          <h2 className="text-white font-black text-[1.2rem] leading-snug mb-1.5 line-clamp-2"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
            {product.name}
          </h2>

          {/* Description */}
          {product.desc && (
            <p className="text-white/65 text-xs leading-relaxed line-clamp-2 mb-3">
              {product.desc}
            </p>
          )}

          {/* Price row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              {product.price && (
                <span className="text-white font-black text-2xl">₪{product.price}</span>
              )}
              {product.orig && (
                <span className="text-white/40 text-sm line-through">₪{product.orig}</span>
              )}
              {discount && (
                <span className="text-xs font-black px-2 py-0.5 rounded-full"
                  style={{ background: 'linear-gradient(135deg,#d4a843,#b8892e)', color: '#fff' }}>
                  -{discount}%
                </span>
              )}
            </div>

            {/* CTA hint */}
            <div className="text-white/50 text-[10px] font-bold flex items-center gap-1">
              <span>החלקי ימינה</span>
              <span>→</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
