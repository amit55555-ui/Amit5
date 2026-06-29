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
  apartment: string;  // מספר דירה (אופציונלי)

  // פרטי המדווח
  reporterName: string;
  reporterPhone: string;
  reporterEmail?: string;
  // טוקן אנונימי שמזהה את הדפדפן של המדווח (לצורך "הפניות שלי")
  reporterToken: string;

  priority: Priority;
  status: ReportStatus;

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
  apartment: string;
  reporterName: string;
  reporterPhone: string;
  reporterEmail?: string;
  reporterToken: string;
  priority: Priority;
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
