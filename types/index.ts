// ===== מודל הנתונים של אפליקציית קביעת התורים =====

export interface Service {
  id: string;
  name: string;
  desc: string;
  price: number;      // מחיר בש"ח
  duration: number;   // משך בדקות
  emoji: string;
}

export interface Barber {
  id: string;
  name: string;
  title: string;
  emoji: string;
}

export interface Booking {
  id: string;
  serviceId: string;
  barberId: string;
  date: string;        // YYYY-MM-DD
  time: string;        // HH:MM
  customerName: string;
  customerPhone: string;
  createdAt: number;
}

// שעות פעילות המספרה (0=ראשון ... 6=שבת)
export interface DayHours {
  open: string | null;   // null = סגור
  close: string | null;
}

export const WEEK_HOURS: Record<number, DayHours> = {
  0: { open: '09:00', close: '20:00' }, // ראשון
  1: { open: '09:00', close: '20:00' }, // שני
  2: { open: '09:00', close: '20:00' }, // שלישי
  3: { open: '09:00', close: '20:00' }, // רביעי
  4: { open: '09:00', close: '20:00' }, // חמישי
  5: { open: '08:00', close: '14:00' }, // שישי
  6: { open: null,    close: null    }, // שבת – סגור
};

export const SLOT_MINUTES = 30; // מרווח בין תורים
