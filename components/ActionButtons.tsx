'use client';

interface Props {
  onNope:      () => void;
  onSuperLike: () => void;
  onLike:      () => void;
  disabled?: boolean;
}

export default function ActionButtons({ onNope, onSuperLike, onLike, disabled }: Props) {
  return (
    <div className="flex items-center justify-center gap-5 pb-2">
      {/* NOPE */}
      <button
        onClick={onNope}
        disabled={disabled}
        className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-red-500 text-2xl font-black
                   shadow-lg border-2 border-red-100 transition-all active:scale-90
                   hover:bg-red-50 hover:border-red-300 hover:shadow-red-200/60 hover:shadow-xl
                   disabled:opacity-40 disabled:cursor-not-allowed"
        title="דלג (שמאל)"
      >
        ✕
      </button>

      {/* SUPER LIKE */}
      <button
        onClick={onSuperLike}
        disabled={disabled}
        className="w-13 h-13 rounded-full bg-white flex items-center justify-center text-blue-500 text-xl
                   shadow-lg border-2 border-blue-100 transition-all active:scale-90
                   hover:bg-blue-50 hover:border-blue-300 hover:shadow-blue-200/60 hover:shadow-xl
                   disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ width: 52, height: 52 }}
        title="סופר לייק (למעלה)"
      >
        ⭐
      </button>

      {/* LIKE */}
      <button
        onClick={onLike}
        disabled={disabled}
        className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-2xl
                   shadow-lg border-2 border-orange-100 transition-all active:scale-90
                   hover:bg-orange-50 hover:border-orange-300 hover:shadow-orange-200/60 hover:shadow-xl
                   disabled:opacity-40 disabled:cursor-not-allowed"
        title="אהבתי – פתח לינק (ימין)"
      >
        ❤️
      </button>
    </div>
  );
}
