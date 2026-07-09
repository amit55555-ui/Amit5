// ===== הגדרות הבניין והקטגוריות =====
// אפשר לשנות את שם הבניין ואת רשימת הכניסות (מספרי הבניין) כאן,
// או דרך משתני סביבה (NEXT_PUBLIC_BUILDING_NAME, NEXT_PUBLIC_ENTRANCES).

import { Category } from '@/types';

export const BUILDING_NAME =
  process.env.NEXT_PUBLIC_BUILDING_NAME || 'רחוב צה״ל';

// בניין ארוך עם מספר כניסות (מספרי בניין) המחוברים יחדיו.
// ניתן להגדיר רשימה מופרדת בפסיקים ב-NEXT_PUBLIC_ENTRANCES, למשל: "12,14,16,18"
export const ENTRANCES: string[] = (
  process.env.NEXT_PUBLIC_ENTRANCES || '12,14,16,18'
)
  .split(',')
  .map((e) => e.trim())
  .filter(Boolean);

// קטגוריות התקלות שדייר יכול לדווח עליהן
export const CATEGORIES: Category[] = [
  { id: 'lightbulb', label: 'נורה שרופה', emoji: '💡' },
  { id: 'garbage', label: 'אשפה', emoji: '🗑️' },
  { id: 'cleaning', label: 'ניקיון', emoji: '🧹' },
  { id: 'elevator', label: 'מעלית', emoji: '🛗' },
  { id: 'water', label: 'נזילה / אינסטלציה', emoji: '🚿' },
  { id: 'electricity', label: 'חשמל', emoji: '⚡' },
  { id: 'intercom', label: 'אינטרקום / דלת כניסה', emoji: '🔔' },
  { id: 'garden', label: 'גינון / חצר', emoji: '🌳' },
  { id: 'parking', label: 'חניה / רחבת חניה', emoji: '🅿️' },
  { id: 'safety', label: 'בטיחות', emoji: '🚨' },
  { id: 'other', label: 'אחר', emoji: '🔧' },
];

export function categoryById(id: string): Category {
  return (
    CATEGORIES.find((c) => c.id === id) || {
      id: 'other',
      label: 'אחר',
      emoji: '🔧',
    }
  );
}
