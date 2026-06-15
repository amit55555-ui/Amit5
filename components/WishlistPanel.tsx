'use client';

import { motion } from 'framer-motion';
import { CAT_EMOJI, CAT_LABELS, type Product } from '@/types';

interface Props { products: Product[]; onClose: () => void; }

export default function WishlistPanel({ products, onClose }: Props) {
  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-30"
        style={{ background: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        className="fixed inset-x-0 bottom-0 z-40 rounded-t-3xl flex flex-col"
        style={{ background: 'linear-gradient(180deg,#1d0a1a 0%,#130410 100%)', maxHeight: '75vh' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
          <div>
            <h3 className="text-white font-black text-lg leading-none">הרשימה שלי 💖</h3>
            <p className="text-white/40 text-xs mt-0.5">
              {products.length === 0 ? 'עוד לא אהבת מוצרים' : `${products.length} מוצרים שאהבת`}
            </p>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/60 text-sm font-bold"
            style={{ background: 'rgba(255,255,255,0.08)' }}>✕</button>
        </div>

        {/* Divider */}
        <div className="h-px mx-5 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }} />

        {/* List */}
        <div className="overflow-y-auto flex-1 px-4 py-3 pb-8">
          {products.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">💝</div>
              <p className="text-white/50 text-sm font-semibold">החלקי ימינה על מוצרים שאת אוהבת</p>
              <p className="text-white/30 text-xs mt-1">הם יופיעו כאן לרכישה מאוחרת</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {products.map(p => (
                <a key={p.id} href={p.link} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-2xl p-3 transition-all active:scale-[0.98]"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.07)' }}>
                    {p.mediaData
                      ? <img src={p.mediaData} className="w-full h-full object-cover" alt="" />
                      : (p.emoji || CAT_EMOJI[p.cat])}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-black text-sm truncate">{p.name}</div>
                    <div className="text-white/40 text-xs">
                      {CAT_EMOJI[p.cat]} {CAT_LABELS[p.cat]}{p.price ? ` · ₪${p.price}` : ''}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl text-white"
                    style={{ background: 'linear-gradient(135deg,#c14b7c,#9c3060)' }}>
                    קני →
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
