// Municipality routing data for abandoned vehicle reports.
// Channels are ordered by preference: email > whatsapp > form > phone.
// To update with verified data, replace with contents of abandoned_vehicle_routing.json.
// IMPORTANT: Never add email addresses or WhatsApp numbers without verification.

import type { Municipality } from '@/types';

export const MUNICIPALITIES: Municipality[] = [
  // ── מחוז ירושלים ──
  {
    id: 'jerusalem',
    name: 'ירושלים',
    district: 'מחוז ירושלים',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'beit-shemesh',
    name: 'בית שמש',
    district: 'מחוז ירושלים',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'beitar-illit',
    name: 'ביתר עילית',
    district: 'מחוז ירושלים',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'maale-adumim',
    name: 'מעלה אדומים',
    district: 'מחוז ירושלים',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'mevaseret-zion',
    name: 'מבשרת ציון',
    district: 'מחוז ירושלים',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },

  // ── מחוז תל אביב ──
  {
    id: 'tel-aviv',
    name: 'תל אביב-יפו',
    district: 'מחוז תל אביב',
    channels: [
      // TODO: verify this WhatsApp number before production use
      // TODO: verify this number before production — format: 972 + local without leading 0
      { type: 'whatsapp', value: '972546106106', label: 'WhatsApp עירייה' },
      { type: 'phone',    value: '106',           label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'bat-yam',
    name: 'בת ים',
    district: 'מחוז תל אביב',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'bnei-brak',
    name: 'בני ברק',
    district: 'מחוז תל אביב',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'givatayim',
    name: 'גבעתיים',
    district: 'מחוז תל אביב',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'holon',
    name: 'חולון',
    district: 'מחוז תל אביב',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'yehud',
    name: 'יהוד-מונוסון',
    district: 'מחוז תל אביב',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'kiryat-ono',
    name: 'קריית אונו',
    district: 'מחוז תל אביב',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'ramat-gan',
    name: 'רמת גן',
    district: 'מחוז תל אביב',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'or-yehuda',
    name: 'אור יהודה',
    district: 'מחוז תל אביב',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },

  // ── מחוז חיפה ──
  {
    id: 'haifa',
    name: 'חיפה',
    district: 'מחוז חיפה',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'tirat-carmel',
    name: 'טירת כרמל',
    district: 'מחוז חיפה',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'nesher',
    name: 'נשר',
    district: 'מחוז חיפה',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'kiryat-ata',
    name: 'קריית אתא',
    district: 'מחוז חיפה',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'kiryat-bialik',
    name: 'קריית ביאליק',
    district: 'מחוז חיפה',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'kiryat-yam',
    name: 'קריית ים',
    district: 'מחוז חיפה',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'kiryat-motzkin',
    name: 'קריית מוצקין',
    district: 'מחוז חיפה',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },

  // ── מחוז השרון ──
  {
    id: 'hod-hasharon',
    name: 'הוד השרון',
    district: 'מחוז השרון',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'herzliya',
    name: 'הרצליה',
    district: 'מחוז השרון',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'kfar-saba',
    name: 'כפר סבא',
    district: 'מחוז השרון',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'netanya',
    name: 'נתניה',
    district: 'מחוז השרון',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'ramat-hasharon',
    name: 'רמת השרון',
    district: 'מחוז השרון',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'raanana',
    name: 'רעננה',
    district: 'מחוז השרון',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },

  // ── מחוז מרכז ──
  {
    id: 'gedera',
    name: 'גדרה',
    district: 'מחוז מרכז',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'yavne',
    name: 'יבנה',
    district: 'מחוז מרכז',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'lod',
    name: 'לוד',
    district: 'מחוז מרכז',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'modiin',
    name: 'מודיעין-מכבים-רעות',
    district: 'מחוז מרכז',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'nes-ziona',
    name: 'נס ציונה',
    district: 'מחוז מרכז',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'petah-tikva',
    name: 'פתח תקווה',
    district: 'מחוז מרכז',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'rishon-lezion',
    name: 'ראשון לציון',
    district: 'מחוז מרכז',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'rehovot',
    name: 'רחובות',
    district: 'מחוז מרכז',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'ramla',
    name: 'רמלה',
    district: 'מחוז מרכז',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },

  // ── מחוז דרום ──
  {
    id: 'eilat',
    name: 'אילת',
    district: 'מחוז דרום',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'ashdod',
    name: 'אשדוד',
    district: 'מחוז דרום',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'ashkelon',
    name: 'אשקלון',
    district: 'מחוז דרום',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'beer-sheva',
    name: 'באר שבע',
    district: 'מחוז דרום',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'dimona',
    name: 'דימונה',
    district: 'מחוז דרום',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'arad',
    name: 'ערד',
    district: 'מחוז דרום',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'kiryat-gat',
    name: 'קריית גת',
    district: 'מחוז דרום',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'netivot',
    name: 'נתיבות',
    district: 'מחוז דרום',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'ofakim',
    name: 'אופקים',
    district: 'מחוז דרום',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },

  // ── מחוז צפון ──
  {
    id: 'umm-al-fahm',
    name: 'אום אל-פחם',
    district: 'מחוז צפון',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'akko',
    name: 'עכו',
    district: 'מחוז צפון',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'afula',
    name: 'עפולה',
    district: 'מחוז צפון',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'tiberias',
    name: 'טבריה',
    district: 'מחוז צפון',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'karmiel',
    name: 'כרמיאל',
    district: 'מחוז צפון',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'nahariya',
    name: 'נהריה',
    district: 'מחוז צפון',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'nazareth',
    name: 'נצרת',
    district: 'מחוז צפון',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'safed',
    name: 'צפת',
    district: 'מחוז צפון',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'kiryat-shmona',
    name: 'קריית שמונה',
    district: 'מחוז צפון',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
  {
    id: 'shfaram',
    name: 'שפרעם',
    district: 'מחוז צפון',
    channels: [
      { type: 'phone', value: '106', label: 'מוקד עירוני 106' },
    ],
  },
];

export function getMunicipalityById(id: string): Municipality | undefined {
  return MUNICIPALITIES.find(m => m.id === id);
}
