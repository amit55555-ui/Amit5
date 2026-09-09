// ===== מודל הנתונים של אפליקציית ניהול הבניין =====

// סטטוס הטיפול בפנייה
export type ReportStatus = 'open' | 'in_progress' | 'closed';

// רמת דחיפות
export type Priority = 'normal' | 'urgent';

// מי כתב הודעה בשרשור הפנייה
export type Author = 'resident' | 'committee';

// קטגוריית התקלה
export interface Category {
  id: string;
  label: string;
  emoji: string;
}

// הודעה בודדת בשרשור התכתובת של פנייה
export interface ReportMessage {
  id: string;
  author: Author;
  authorName: string;
  text: string;
  createdAt: number;
}

// פנייה / דיווח תקלה
export interface Report {
  id: string;
  // מספר רץ ידידותי להצגה (#104)
  ref: number;

  categoryId: string;
  title: string;
  description: string;

  // מיקום בבניין הארוך
  entrance: string;   // מספר הכניסה / מספר הבניין
  floor: string;      // קומה (אופציונלי)

  // פרטי המדווח
  reporterName: string;
  reporterPhone: string;
  reporterEmail?: string;
  // טוקן אנונימי שמזהה את הדפדפן של המדווח (לצורך "הפניות שלי")
  reporterToken: string;

  priority: Priority;
  status: ReportStatus;

  // תמונות של התקלה (data URLs)
  photos?: string[];

  // שרשור ההתכתבות בין הדייר לוועד
  messages: ReportMessage[];

  createdAt: number;
  updatedAt: number;
}

// גוף בקשה ליצירת פנייה חדשה (מה שהלקוח שולח)
export interface NewReportInput {
  categoryId: string;
  title: string;
  description: string;
  entrance: string;
  floor: string;
  reporterName: string;
  reporterPhone: string;
  reporterEmail?: string;
  reporterToken: string;
  priority: Priority;
  photos?: string[];
}

export const STATUS_LABELS: Record<ReportStatus, string> = {
  open: 'פתוח',
  in_progress: 'בטיפול',
  closed: 'סגור',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  normal: 'רגיל',
  urgent: 'דחוף',
};

// ===== מערכת נוכחות (שעון עבודה) =====

// רשומת נוכחות בודדת (כניסה ↔ יציאה)
export interface AttendanceEntry {
  id: string;
  clockIn: number;            // חותמת זמן (מ"ש) של הכניסה
  clockOut: number | null;    // חותמת זמן של היציאה, או null אם עדיין בעבודה
  note: string;
  // true אם הרשומה נוצרה או נערכה ע"י מנהל (עריכה ידנית של שעות / הוספה לתאריך אחר)
  editedByAdmin: boolean;
  createdAt: number;
  updatedAt: number;
}

// גוף בקשה ליצירת רשומת כניסה רגילה (עובד, ללא הרשאת מנהל)
export interface NewAttendanceInput {
  note?: string;
}

// גוף בקשה ליצירת רשומה ע"י מנהל (תאריך/שעה חופשיים)
export interface NewAdminAttendanceInput {
  clockIn: number;
  clockOut: number | null;
  note?: string;
}
