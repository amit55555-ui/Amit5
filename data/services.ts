import { Service, Barber } from '@/types';

export const SERVICES: Service[] = [
  { id: 'cut',      name: 'תספורת גבר',       desc: 'מספריים + מכונה, כולל שטיפה',        price: 60,  duration: 30, emoji: '✂️' },
  { id: 'cut-kids', name: 'תספורת ילדים',     desc: 'עד גיל 12, בסבלנות ובחיוך',          price: 45,  duration: 30, emoji: '🧒' },
  { id: 'beard',    name: 'עיצוב זקן',        desc: 'חיתוך, עיצוב ושמן זקן',              price: 40,  duration: 30, emoji: '🧔' },
  { id: 'combo',    name: 'תספורת + זקן',     desc: 'הקומבו המנצח, חבילה משתלמת',          price: 90,  duration: 60, emoji: '💈' },
  { id: 'shave',    name: 'גילוח מסורתי',     desc: 'תער חם, מגבת ואפטר-שייב',            price: 50,  duration: 30, emoji: '🪒' },
  { id: 'color',    name: 'צביעת שיער',       desc: 'כיסוי שיבה או גוון חדש',             price: 120, duration: 60, emoji: '🎨' },
];

export const BARBERS: Barber[] = [
  { id: 'avi',   name: 'אבי',   title: 'הספר הראשי',  emoji: '💈' },
  { id: 'dani',  name: 'דני',   title: 'מומחה זקנים', emoji: '🧔' },
  { id: 'moshe', name: 'משה',   title: 'סטייליסט',    emoji: '✂️' },
];
