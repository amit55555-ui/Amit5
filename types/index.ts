export type Category = 'kitchen' | 'spices' | 'snacks' | 'drinks' | 'baking' | 'bbq';
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
  kitchen: 'כלי מטבח',
  spices:  'תבלינים',
  snacks:  'חטיפים',
  drinks:  'שתייה',
  baking:  'אפייה',
  bbq:     'גריל',
};

export const CAT_EMOJI: Record<Category, string> = {
  kitchen: '🍳',
  spices:  '🌶️',
  snacks:  '🍿',
  drinks:  '☕',
  baking:  '🧁',
  bbq:     '🔥',
};

export const CAT_BG: Record<Category, string> = {
  kitchen: 'linear-gradient(135deg,#fff0e0,#ffd4a0)',
  spices:  'linear-gradient(135deg,#ffe8e0,#ffb8a0)',
  snacks:  'linear-gradient(135deg,#fff8d0,#ffe090)',
  drinks:  'linear-gradient(135deg,#e0f4ff,#b0d8f5)',
  baking:  'linear-gradient(135deg,#f5e0ff,#ddb0ff)',
  bbq:     'linear-gradient(135deg,#ffe4d0,#ff9060)',
};

export const BADGE_CONFIG: Record<string, { label: string; cls: string }> = {
  sale: { label: '🔥 מבצע',      cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  new:  { label: '🆕 חדש',       cls: 'bg-sky-100 text-sky-800 border-sky-200' },
  top:  { label: '⭐ הכי נמכר',  cls: 'bg-purple-100 text-purple-800 border-purple-200' },
  rec:  { label: '✅ ממליץ',     cls: 'bg-green-100 text-green-800 border-green-200' },
};
