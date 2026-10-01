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

// ===== ניהול משימות =====

// סטטוס משימה
export type TaskStatus = 'todo' | 'in_progress' | 'done';

// איש צוות שאפשר לשייך לו משימות
export interface Member {
  id: string;
  name: string;
  email: string;
  createdAt: number;
}

// משימה
export interface Task {
  id: string;
  // מספר רץ ידידותי להצגה (#12)
  ref: number;
  title: string;
  description: string;
  assigneeId: string | null;
  priority: Priority;
  status: TaskStatus;
  // תאריך יעד בפורמט YYYY-MM-DD (אופציונלי)
  dueDate: string;
  createdAt: number;
  updatedAt: number;
}

export interface NewTaskInput {
  title: string;
  description: string;
  assigneeId: string | null;
  priority: Priority;
  dueDate: string;
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'לביצוע',
  in_progress: 'בעבודה',
  done: 'הושלם',
};
