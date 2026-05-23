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
  const rotate = useTransform(x, [-260, 260], [-20, 20]);

  const likeOpacity  = useTransform(x, [30, 120], [0, 1]);
  const nopeOpacity  = useTransform(x, [-30, -120], [0, 1]);
  const superOpacity = useTransform(y, [-30, -120], [0, 1]);

  const doSwipe = async (dir: SwipeDirection) => {
    if (dir !== 'left' && product.link) {
      window.open(product.link, '_blank', 'noopener,noreferrer');
    }
    if (dir === 'right')     await animate(x, 700,  { duration: 0.28 });
    else if (dir === 'left') await animate(x, -700, { duration: 0.28 });
    else                     await animate(y, -800, { duration: 0.28 });
    onSwipe(dir);
  };

  useImperativeHandle(ref, () => ({ swipe: doSwipe }));

  const handleDragEnd = async (_: PointerEvent, info: PanInfo) => {
    const { offset } = info;
    if      (offset.x >  100) await doSwipe('right');
    else if (offset.x < -100) await doSwipe('left');
    else if (offset.y < -100) await doSwipe('up');
    else {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 35 });
      animate(y, 0, { type: 'spring', stiffness: 400, damping: 35 });
    }
  };

  const badge = product.badge ? BADGE_CONFIG[product.badge] : null;
  const bg = CAT_BG[product.cat];
  const emoji = product.emoji || CAT_EMOJI[product.cat];
  const discount = product.price && product.orig && parseFloat(product.orig) > parseFloat(product.price)
    ? Math.round((1 - parseFloat(product.price) / parseFloat(product.orig)) * 100)
    : null;

  return (
    <motion.div
      className="absolute inset-0 no-select"
      style={{ x, y, rotate, touchAction: 'none', cursor: isTop ? 'grab' : 'default' }}
      drag={isTop}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: 'grabbing' }}
    >
      {/* LIKE overlay */}
      <motion.div
        className="absolute inset-0 z-10 flex items-center justify-end pe-8 rounded-3xl bg-green-500/80 pointer-events-none"
        style={{ opacity: likeOpacity }}
      >
        <div className="text-white font-black text-3xl border-4 border-white rounded-2xl px-4 py-2 rotate-[-15deg]">
          ❤️ אהבתי!
        </div>
      </motion.div>

      {/* NOPE overlay */}
      <motion.div
        className="absolute inset-0 z-10 flex items-center ps-8 rounded-3xl bg-red-500/80 pointer-events-none"
        style={{ opacity: nopeOpacity }}
      >
        <div className="text-white font-black text-3xl border-4 border-white rounded-2xl px-4 py-2 rotate-[15deg]">
          ✕ דלג
        </div>
      </motion.div>

      {/* SUPER LIKE overlay */}
      <motion.div
        className="absolute inset-0 z-10 flex items-start justify-center pt-10 rounded-3xl bg-blue-500/80 pointer-events-none"
        style={{ opacity: superOpacity }}
      >
        <div className="text-white font-black text-3xl border-4 border-white rounded-2xl px-4 py-2">
          ⭐ סופר לייק!
        </div>
      </motion.div>

      {/* Card body */}
      <div className="w-full h-full rounded-3xl overflow-hidden bg-white flex flex-col"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>

        {/* Media */}
        <div className="relative flex-[3] overflow-hidden" style={{ background: bg }}>
          {product.mediaData ? (
            product.mediaType === 'video'
              ? <video src={product.mediaData} className="w-full h-full object-cover" autoPlay loop muted playsInline />
              : <img src={product.mediaData} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[5rem]">{emoji}</div>
          )}

          {/* Chips on image */}
          <div className="absolute top-3 start-3 bg-gradient-to-r from-red-600 to-orange-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg">
            🛒 AliExpress
          </div>
          {badge && (
            <div className={`absolute top-3 end-3 text-xs font-black px-3 py-1 rounded-full border shadow-sm ${badge.cls}`}>
              {badge.label}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-[2] p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-yellow-400 text-sm tracking-wide">
                {'★'.repeat(product.stars)}{'☆'.repeat(5 - product.stars)}
              </span>
              <span className="text-xs text-soft bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full font-semibold">
                {CAT_EMOJI[product.cat]} {CAT_LABELS[product.cat]}
              </span>
            </div>
            <h2 className="text-lg font-black text-dark leading-snug">{product.name}</h2>
            {product.desc && (
              <p className="text-xs text-soft mt-1 line-clamp-2 leading-relaxed">{product.desc}</p>
            )}
          </div>

          <div className="flex items-end gap-2 mt-2">
            {product.price && (
              <span className="text-2xl font-black text-dark">₪{product.price}</span>
            )}
            {product.orig && (
              <span className="text-sm text-gray-400 line-through mb-0.5">₪{product.orig}</span>
            )}
            {discount && (
              <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full mb-0.5">
                חיסכון {discount}%
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});
