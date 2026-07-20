export type Category =
  | 'tactical'
  | 'pokemon'
  | 'kids'
  | 'garden'
  | 'home'
  | 'cleaning'
  | 'bachelorette'
  | 'bachelor'
  | 'gadgets'
  | 'auto'
  | 'camping'
  | 'jewelry'
  | 'summer';

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
  tactical:     'ציוד טקטי',
  pokemon:      'פוקימון',
  kids:         'ילדים',
  garden:       'גינה',
  home:         'בית',
  cleaning:     'ניקיון',
  bachelorette: 'מסיבת רווקות',
  bachelor:     'מסיבת רווקים',
  gadgets:      'גאדטים וטכנולוגיה',
  auto:         'רכב ואביזרים',
  camping:      'טיולים וקמפינג',
  jewelry:      'תכשיטים',
  summer:       'קיץ',
};

export const CAT_EMOJI: Record<Category, string> = {
  tactical:     '🪖',
  pokemon:      '⚡',
  kids:         '🧸',
  garden:       '🪴',
  home:         '🏠',
  cleaning:     '🧹',
  bachelorette: '💍',
  bachelor:     '🍾',
  gadgets:      '📱',
  auto:         '🚗',
  camping:      '⛺',
  jewelry:      '💎',
  summer:       '☀️',
};

export const CAT_BG: Record<Category, string> = {
  tactical:     'linear-gradient(135deg,#e8ede0,#c7d0b8)',
  pokemon:      'linear-gradient(135deg,#fff9c4,#fff176)',
  kids:         'linear-gradient(135deg,#fce4ec,#f8bbd0)',
  garden:       'linear-gradient(135deg,#e8f5e9,#a5d6a7)',
  home:         'linear-gradient(135deg,#fff0e0,#ffd4a0)',
  cleaning:     'linear-gradient(135deg,#e0f7fa,#b2ebf2)',
  bachelorette: 'linear-gradient(135deg,#f3e5f5,#e1bee7)',
  bachelor:     'linear-gradient(135deg,#e3f2fd,#90caf9)',
  gadgets:      'linear-gradient(135deg,#e8eaf6,#c5cae9)',
  auto:         'linear-gradient(135deg,#e0f2f1,#b2dfdb)',
  camping:      'linear-gradient(135deg,#f1f8e9,#c8e6c9)',
  jewelry:      'linear-gradient(135deg,#fce4ec,#f48fb1)',
  summer:       'linear-gradient(135deg,#fff3e0,#ffcc80)',
};

export const BADGE_CONFIG: Record<string, { label: string; cls: string }> = {
  sale: { label: '🔥 מבצע',      cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  new:  { label: '🆕 חדש',       cls: 'bg-sky-100 text-sky-800 border-sky-200' },
  top:  { label: '⭐ הכי נמכר',  cls: 'bg-purple-100 text-purple-800 border-purple-200' },
  rec:  { label: '✅ ממליץ',     cls: 'bg-green-100 text-green-800 border-green-200' },
};
