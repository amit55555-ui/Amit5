'use client';

import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, animate, type PanInfo } from 'framer-motion';
import { Volume2, VolumeX, Share2 } from 'lucide-react';
import { CAT_BG, CAT_EMOJI, CAT_LABELS, BADGE_CONFIG, type Product, type SwipeDirection } from '@/types';
import { shareProduct } from '@/lib/share';
import { trackClick, trackShare } from '@/lib/analytics';

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
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const likeOpacity  = useTransform(x, [30, 120], [0, 1]);
  const nopeOpacity  = useTransform(x, [-30, -120], [0, 1]);
  const superOpacity = useTransform(y, [-30, -120], [0, 1]);

  const doSwipe = async (dir: SwipeDirection) => {
    if (dir !== 'left' && product.link) {
      trackClick(product.id);
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

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackShare(product.id);
    shareProduct(product);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMuted(m => {
      if (videoRef.current) videoRef.current.muted = !m;
      return !m;
    });
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
        className="absolute inset-0 z-10 flex items-center justify-end pe-8 rounded-3xl pointer-events-none"
        style={{ opacity: likeOpacity, background: 'rgba(34,197,94,0.82)' }}
      >
        <div className="text-white font-black text-3xl border-4 border-white rounded-2xl px-4 py-2 rotate-[-15deg] shadow-lg">
          ❤️ אהבתי!
        </div>
      </motion.div>

      {/* NOPE overlay */}
      <motion.div
        className="absolute inset-0 z-10 flex items-center ps-8 rounded-3xl pointer-events-none"
        style={{ opacity: nopeOpacity, background: 'rgba(239,68,68,0.82)' }}
      >
        <div className="text-white font-black text-3xl border-4 border-white rounded-2xl px-4 py-2 rotate-[15deg] shadow-lg">
          ✕ דלג
        </div>
      </motion.div>

      {/* SUPER LIKE overlay */}
      <motion.div
        className="absolute inset-0 z-10 flex items-start justify-center pt-10 rounded-3xl pointer-events-none"
        style={{ opacity: superOpacity, background: 'rgba(59,130,246,0.82)' }}
      >
        <div className="text-white font-black text-3xl border-4 border-white rounded-2xl px-4 py-2 shadow-lg">
          ⭐ סופר לייק!
        </div>
      </motion.div>

      {/* Card body */}
      <div className="w-full h-full rounded-3xl overflow-hidden bg-white flex flex-col"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>

        {/* Media */}
        <div className="relative flex-[3] overflow-hidden" style={{ background: bg }}>
          {product.mediaData ? (
            product.mediaType === 'video' ? (
              <>
                <video
                  ref={videoRef}
                  src={product.mediaData}
                  className="w-full h-full object-cover"
                  autoPlay loop muted={muted} playsInline
                />
                {/* Mute/Unmute button */}
                <button
                  onClick={toggleMute}
                  className="absolute bottom-3 start-3 z-20 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                  {muted
                    ? <VolumeX className="w-4 h-4" />
                    : <Volume2 className="w-4 h-4" />}
                </button>
              </>
            ) : (
              <img src={product.mediaData} alt={product.name} className="w-full h-full object-cover" />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[5rem]">{emoji}</div>
          )}

          {/* Top chips */}
          <div className="absolute top-3 start-3 bg-gradient-to-r from-red-600 to-orange-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg">
            🛒 AliExpress
          </div>
          {badge && (
            <div className={`absolute top-3 end-3 text-xs font-black px-3 py-1 rounded-full border shadow-sm ${badge.cls}`}>
              {badge.label}
            </div>
          )}

          {/* Share button */}
          {isTop && (
            <button
              onClick={handleShare}
              onPointerDown={e => e.stopPropagation()}
              className={`absolute end-3 z-20 w-9 h-9 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center text-dark hover:bg-white shadow-md transition-colors ${badge ? 'top-14' : 'top-3'}`}
              aria-label="שתף מוצר"
            >
              <Share2 className="w-4 h-4" />
            </button>
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
