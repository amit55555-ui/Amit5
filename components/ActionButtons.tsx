'use client';

interface Props {
  onNope:      () => void;
  onSuperLike: () => void;
  onLike:      () => void;
  disabled?: boolean;
}

export default function ActionButtons({ onNope, onSuperLike, onLike, disabled }: Props) {
  return (
    <div className="flex items-center justify-center gap-6">

      {/* SKIP */}
      <button
        onClick={onNope}
        disabled={disabled}
        className="w-[60px] h-[60px] rounded-full flex items-center justify-center transition-all active:scale-90
                   disabled:opacity-30 disabled:cursor-not-allowed btn-skip-glow"
        style={{ background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,255,255,0.18)', fontSize: '1.5rem' }}
        title="דלגי"
      >
        ✕
      </button>

      {/* SUPER LIKE */}
      <button
        onClick={onSuperLike}
        disabled={disabled}
        className="w-[50px] h-[50px] rounded-full flex items-center justify-center transition-all active:scale-90
                   disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ background: 'linear-gradient(135deg,#d4a843,#b8892e)', fontSize: '1.3rem',
                 boxShadow: '0 0 18px rgba(212,168,67,0.5), 0 4px 12px rgba(0,0,0,0.3)' }}
        title="חייבת! (למעלה)"
      >
        ⭐
      </button>

      {/* LIKE */}
      <button
        onClick={onLike}
        disabled={disabled}
        className="w-[60px] h-[60px] rounded-full flex items-center justify-center transition-all active:scale-90
                   disabled:opacity-30 disabled:cursor-not-allowed btn-like-glow"
        style={{ background: 'linear-gradient(135deg,#c14b7c,#9c3060)', fontSize: '1.5rem',
                 boxShadow: '0 0 22px rgba(193,75,124,0.5), 0 4px 15px rgba(0,0,0,0.3)' }}
        title="רוצה! (ימינה)"
      >
        💖
      </button>
    </div>
  );
}
