'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Heart } from 'lucide-react';
import { PRODUCTS } from '@/data/products';
import { CAT_EMOJI, CAT_LABELS, type Product } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  likedIds: string[];
  customProducts: Product[];
  overrides?: Record<string, Product>;
}

export default function LikedDrawer({ open, onClose, likedIds, customProducts, overrides = {} }: Props) {
  const allProducts = [
    ...PRODUCTS.map(p => overrides[p.id] ?? p),
    ...customProducts,
  ];
  const liked = likedIds
    .map(id => allProducts.find(p => p.id === id))
    .filter(Boolean) as Product[];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl"
            style={{ maxHeight: '82vh' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-orange fill-orange" />
                <h2 className="text-lg font-black text-dark">מוצרים שאהבתי</h2>
                {liked.length > 0 && (
                  <span className="bg-orange text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {liked.length}
                  </span>
                )}
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto px-4 py-3" style={{ maxHeight: 'calc(82vh - 90px)' }}>
              {liked.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-3">💔</div>
                  <p className="text-soft font-semibold">עוד לא אהבת מוצרים</p>
                  <p className="text-xs text-gray-400 mt-1">החלק ימינה על מוצר שמעניין אותך</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 pb-4">
                  {[...liked].reverse().map(product => (
                    <LikedItem key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function LikedItem({ product }: { product: Product }) {
  const discount = product.price && product.orig && parseFloat(product.orig) > parseFloat(product.price)
    ? Math.round((1 - parseFloat(product.price) / parseFloat(product.orig)) * 100)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 bg-cream rounded-2xl p-3 border border-border"
    >
      <div className="w-14 h-14 rounded-xl overflow-hidden bg-orange-50 flex items-center justify-center text-2xl flex-shrink-0">
        {product.mediaData && product.mediaType === 'image'
          ? <img src={product.mediaData} alt={product.name} className="w-full h-full object-cover" />
          : (product.emoji || CAT_EMOJI[product.cat])}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-xs text-soft font-semibold mb-0.5">
          {CAT_EMOJI[product.cat]} {CAT_LABELS[product.cat]}
        </div>
        <div className="font-black text-dark text-sm leading-snug line-clamp-2">{product.name}</div>
        <div className="flex items-center gap-2 mt-1">
          {product.price && <span className="text-base font-black text-dark">₪{product.price}</span>}
          {product.orig && <span className="text-xs text-gray-400 line-through">₪{product.orig}</span>}
          {discount && (
            <span className="text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">
              -{discount}%
            </span>
          )}
        </div>
      </div>

      <a
        href={product.link}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-shrink-0 bg-orange hover:bg-deep-orange text-white rounded-xl px-3 py-2 flex items-center gap-1 transition-colors shadow-sm"
      >
        <ShoppingCart className="w-4 h-4" />
        <span className="text-xs font-black">קנה</span>
      </a>
    </motion.div>
  );
}
