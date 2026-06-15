export type Category =
  | 'beauty'
  | 'bachelorette'
  | 'bachelor'
  | 'garden'
  | 'balcony'
  | 'jewelry'
  | 'cleaning'
  | 'accessories'
  | 'home';

export type Badge = 'sale' | 'new' | 'top' | 'rec' | '';
export type SwipeDirection = 'right' | 'left' | 'up';

export interface Product {
  id: string;
  name: string;
  cat: Category;
  desc: string;
  price?: string;
  orig?: string;
  link: string;
  emoji?: string;
  badge?: Badge;
  stars: number;
  mediaData?: string | null;
  mediaType?: 'image' | 'video' | null;
}

export const CAT_LABELS: Record<Category, string> = {
  beauty:       'ביוטי',
  bachelorette: 'מסיבת רווקות',
  bachelor:     'מסיבת רווקים',
  garden:       'מוצרים לגינה',
  balcony:      'מוצרים למרפסת',
  jewelry:      'תכשיטים',
  cleaning:     'מוצרי ניקיון',
  accessories:  'אקססוריס',
  home:         'מוצרים לבית',
};

export const CAT_EMOJI: Record<Category, string> = {
  beauty:       '💄',
  bachelorette: '🌸',
  bachelor:     '🍺',
  garden:       '🌿',
  balcony:      '🌅',
  jewelry:      '💎',
  cleaning:     '🧹',
  accessories:  '👜',
  home:         '🏠',
};

export const CAT_BG: Record<Category, string> = {
  beauty:       'linear-gradient(145deg,#fce4ec,#f8bbd9,#f48fb1)',
  bachelorette: 'linear-gradient(145deg,#fce4f5,#f8b4de,#e879c0)',
  bachelor:     'linear-gradient(145deg,#e8f0fe,#bbdefb,#7baee8)',
  garden:       'linear-gradient(145deg,#e8f5e9,#c8e6c9,#81c784)',
  balcony:      'linear-gradient(145deg,#fff8e1,#ffecb3,#ffd54f)',
  jewelry:      'linear-gradient(145deg,#f9f3e8,#f0e0b8,#d4b06a)',
  cleaning:     'linear-gradient(145deg,#e0f7fa,#b2ebf2,#4dd0e1)',
  accessories:  'linear-gradient(145deg,#fce8f3,#f8c8e8,#e879c0)',
  home:         'linear-gradient(145deg,#fdf0e0,#fad9a8,#f0b860)',
};

export const BADGE_CONFIG: Record<string, { label: string; cls: string }> = {
  sale: { label: '🔥 מבצע',     cls: 'bg-amber-100 text-amber-800 border-amber-300' },
  new:  { label: '✨ חדש',      cls: 'bg-pink-100 text-pink-800 border-pink-300' },
  top:  { label: '⭐ הכי נמכר', cls: 'bg-purple-100 text-purple-800 border-purple-300' },
  rec:  { label: '💖 ממליצה',   cls: 'bg-rose-100 text-rose-700 border-rose-300' },
};
