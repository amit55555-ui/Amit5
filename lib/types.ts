export type User = {
  id: string;
  username: string;
  name: string;
  passHash: string;
  wage: number; // שכר לשעה
  travel: number | null; // דמי נסיעה ליום; null = ברירת המחדל מההגדרות
  active: boolean;
  createdAt: number;
};

export type PublicUser = Omit<User, 'passHash'>;

export type Brk = { s: number; e: number | null };

/** מיקום שנרשם בלחיצה על כניסה/יציאה */
export type Loc = { lat: number; lng: number; acc: number; t: number };

export type Shift = {
  id: string;
  userId: string;
  start: number;
  end: number | null; // null = משמרת פעילה
  breaks: Brk[]; // הפסקות שנרשמו בשעון
  breakMin: number; // הפסקה שהוזנה ידנית (דקות)
  note: string;
  editedBy: 'admin' | 'user' | null; // מי תיקן ידנית
  inLoc?: Loc | null;
  outLoc?: Loc | null;
  updatedAt: number;
};

/** שעות פעילות ליום בשבוע; null = סגור */
export type DayHours = { open: string; close: string } | null;

/** משמרת מתוכננת בסידור העבודה */
export type Plan = {
  id: string;
  userId: string;
  day: string; // YYYY-MM-DD
  start: string; // HH:MM
  end: string; // HH:MM
  note: string;
  updatedAt: number;
};

export type Settings = {
  companyName: string;
  stdHours: number; // שעות תקן ליום
  otEnabled: boolean;
  ot1Hours: number; // כמה שעות נוספות בתעריף הראשון
  ot1Rate: number;
  ot2Rate: number;
  travelPerDay: number;
  allowEmployeeEdit: boolean; // עובד יכול להוסיף/לתקן משמרות בעצמו
  showPayToEmployees: boolean;
  businessHours: DayHours[]; // 0=ראשון … 6=שבת
  requireLocation: boolean; // רישום מיקום בכניסה וביציאה (כבוי = לא מבקשים מיקום בכלל)
  adminPassHash?: string;
};

export const DEFAULT_SETTINGS: Settings = {
  companyName: '',
  stdHours: 8.4,
  otEnabled: true,
  ot1Hours: 2,
  ot1Rate: 1.25,
  ot2Rate: 1.5,
  travelPerDay: 0,
  allowEmployeeEdit: false,
  showPayToEmployees: true,
  requireLocation: false,
  businessHours: [
    { open: '09:00', close: '21:00' }, // ראשון
    { open: '09:00', close: '21:00' },
    { open: '09:00', close: '21:00' },
    { open: '09:00', close: '21:00' },
    { open: '09:00', close: '21:00' }, // חמישי
    { open: '09:00', close: '13:30' }, // שישי
    null, // שבת
  ],
};

export type PublicSettings = Omit<Settings, 'adminPassHash'>;

export function publicUser(u: User): PublicUser {
  const { passHash: _p, ...rest } = u;
  return rest;
}

export function publicSettings(s: Settings): PublicSettings {
  const { adminPassHash: _h, ...rest } = s;
  return rest;
}
