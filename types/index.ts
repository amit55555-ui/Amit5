// ===== מודל הנתונים של מפת דיווחי נזילות מים =====

// דיווח על נזילת מים במקום מסוים במפה
export interface Leak {
  id: string;
  lat: number;
  lng: number;
  description: string;
  // כתובת ה-URL של תמונת הנזילה
  photoUrl: string;
  createdAt: number;
}

// גוף בקשה ליצירת דיווח חדש (מה שהלקוח שולח)
export interface NewLeakInput {
  lat: number;
  lng: number;
  description: string;
  // תמונת הנזילה כ-data URL
  photo: string;
}
