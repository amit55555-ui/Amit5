// ===== מודל הנתונים של מפת דיווחי נזילות מים =====

// סטטוס טיפול בדיווח:
// open – פתוח, in_progress – בטיפול (נקבע ע"י מנהל), resolved – טופל
export type LeakStatus = 'open' | 'in_progress' | 'resolved';

export const LEAK_STATUSES: LeakStatus[] = ['open', 'in_progress', 'resolved'];

export const STATUS_LABELS: Record<LeakStatus, string> = {
  open: 'פתוח',
  in_progress: 'בטיפול',
  resolved: 'טופל',
};

export function isLeakStatus(v: unknown): v is LeakStatus {
  return typeof v === 'string' && (LEAK_STATUSES as string[]).includes(v);
}

// הערה על דיווח – מתושב (אנונימי) או ממנהל
export interface LeakComment {
  id: string;
  leakId: string;
  text: string;
  author: 'public' | 'admin';
  // comment – הערה רגילה; status – רישום של שינוי סטטוס
  kind: 'comment' | 'status';
  createdAt: number;
}

// דיווח על נזילת מים במקום מסוים במפה
export interface Leak {
  id: string;
  lat: number;
  lng: number;
  description: string;
  // כתובת ה-URL של תמונת הנזילה (ריקה בתצוגה הציבורית כשהתמונה הוסתרה)
  photoUrl: string;
  photoHidden: boolean;
  status: LeakStatus;
  resolvedAt: number | null;
  // שכונה / אזור בעיר (מחושב אוטומטית לפי המיקום)
  area: string;
  createdAt: number;
  comments: LeakComment[];
}

// גוף בקשה ליצירת דיווח חדש (מה שהלקוח שולח)
export interface NewLeakInput {
  lat: number;
  lng: number;
  description: string;
  // תמונת הנזילה כ-data URL
  photo: string;
}
