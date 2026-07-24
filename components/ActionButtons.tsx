'use client';

import { X, Heart, Check } from 'lucide-react';

interface Props {
  onSkip:     () => void;
  onFavorite: () => void;
  onBuy:      () => void;
  disabled?: boolean;
}

export default function ActionButtons({ onSkip, onFavorite, onBuy, disabled }: Props) {
  return (
    <div className="flex items-center justify-center gap-5 pb-2">
      {/* SKIP */}
      <button
        onClick={onSkip}
        disabled={disabled}
        aria-label="דלג"
        className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-red-500
                   shadow-lg border-2 border-red-100 transition-all active:scale-90
                   hover:bg-red-50 hover:border-red-300 hover:shadow-red-200/60 hover:shadow-xl
                   disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <X className="w-7 h-7 stroke-[2.5]" />
      </button>

      {/* FAVORITE — save for later, no link */}
      <button
        onClick={onFavorite}
        disabled={disabled}
        aria-label="שמור למועדפים"
        className="rounded-full bg-white flex items-center justify-center text-pink-500
                   shadow-lg border-2 border-pink-100 transition-all active:scale-90
                   hover:bg-pink-50 hover:border-pink-300 hover:shadow-pink-200/60 hover:shadow-xl
                   disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ width: 52, height: 52 }}
      >
        <Heart className="w-5 h-5 stroke-[2.5]" />
      </button>

      {/* BUY — opens the affiliate link */}
      <button
        onClick={onBuy}
        disabled={disabled}
        aria-label="לקנייה"
        className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-green-500
                   shadow-lg border-2 border-green-100 transition-all active:scale-90
                   hover:bg-green-50 hover:border-green-300 hover:shadow-green-200/60 hover:shadow-xl
                   disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Check className="w-7 h-7 stroke-[2.5]" />
      </button>
    </div>
  );
}
