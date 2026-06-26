export type Category =
  | 'home'
  | 'cleaning'
  | 'kids'
  | 'bachelorette'
  | 'pokemon'
  | 'gadgets'
  | 'auto'
  | 'camping'
  | 'storage';

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
  home:         'בית',
  cleaning:     'ניקיון',
  kids:         'ילדים',
  bachelorette: 'מסיבת רווקות',
  pokemon:      'פוקימון',
  gadgets:      'גאדג\'טים וטכנולוגיה',
  auto:         'רכב ואביזרים',
  camping:      'טיול וקמפינג',
  storage:      'בית ואחסון',
};

export const CAT_EMOJI: Record<Category, string> = {
  home:         '🏠',
  cleaning:     '🧹',
  kids:         '🧸',
  bachelorette: '💍',
  pokemon:      '⚡',
  gadgets:      '📱',
  auto:         '🚗',
  camping:      '⛺',
  storage:      '📦',
};

export const CAT_BG: Record<Category, string> = {
  home:         'linear-gradient(135deg,#fff0e0,#ffd4a0)',
  cleaning:     'linear-gradient(135deg,#e0f7fa,#b2ebf2)',
  kids:         'linear-gradient(135deg,#fce4ec,#f8bbd0)',
  bachelorette: 'linear-gradient(135deg,#f3e5f5,#e1bee7)',
  pokemon:      'linear-gradient(135deg,#fff9c4,#fff176)',
  gadgets:      'linear-gradient(135deg,#e8eaf6,#c5cae9)',
  auto:         'linear-gradient(135deg,#e0f2f1,#b2dfdb)',
  camping:      'linear-gradient(135deg,#e8f5e9,#c8e6c9)',
  storage:      'linear-gradient(135deg,#fff8e1,#ffecb3)',
};

export const BADGE_CONFIG: Record<string, { label: string; cls: string }> = {
  sale: { label: '🔥 מבצע',      cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  new:  { label: '🆕 חדש',       cls: 'bg-sky-100 text-sky-800 border-sky-200' },
  top:  { label: '⭐ הכי נמכר',  cls: 'bg-purple-100 text-purple-800 border-purple-200' },
  rec:  { label: '✅ ממליץ',     cls: 'bg-green-100 text-green-800 border-green-200' },
};
