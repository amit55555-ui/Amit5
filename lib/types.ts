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
  requireLocation: boolean; // חובה לאשר מיקום בכניסה וביציאה
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
  requireLocation: true,
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
