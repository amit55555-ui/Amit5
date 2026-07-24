'use client';

import { Check, Heart, Star } from 'lucide-react';

interface Props {
  onNope:      () => void;
  onSuperLike: () => void;
  onLike:      () => void;
  disabled?: boolean;
}

export default function ActionButtons({ onNope, onSuperLike, onLike, disabled }: Props) {
  return (
    <div className="flex items-center justify-center gap-5 pb-2">
      {/* LIKE (green check — opens the product link, like swiping right) */}
      <button
        onClick={onNope}
        disabled={disabled}
        aria-label="אהבתי"
        className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-green-500
                   shadow-lg border-2 border-green-100 transition-all active:scale-90
                   hover:bg-green-50 hover:border-green-300 hover:shadow-green-200/60 hover:shadow-xl
                   disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Check className="w-7 h-7 stroke-[2.5]" />
      </button>

      {/* SUPER LIKE */}
      <button
        onClick={onSuperLike}
        disabled={disabled}
        aria-label="סופר לייק"
        className="w-13 h-13 rounded-full bg-white flex items-center justify-center text-blue-500
                   shadow-lg border-2 border-blue-100 transition-all active:scale-90
                   hover:bg-blue-50 hover:border-blue-300 hover:shadow-blue-200/60 hover:shadow-xl
                   disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ width: 52, height: 52 }}
      >
        <Star className="w-5 h-5 stroke-[2.5]" />
      </button>

      {/* LIKE */}
      <button
        onClick={onLike}
        disabled={disabled}
        aria-label="אהבתי"
        className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-orange
                   shadow-lg border-2 border-orange-100 transition-all active:scale-90
                   hover:bg-orange-50 hover:border-orange-300 hover:shadow-orange-200/60 hover:shadow-xl
                   disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Heart className="w-7 h-7 stroke-[2.5]" />
      </button>
    </div>
  );
}
