// ===== העלאת תמונות ל-Vercel Blob =====
// מקבל תמונות כ-data URLs (מהלקוח), מעלה ל-Blob, ומחזיר כתובות ציבוריות.
// אם Blob לא מוגדר – מחזיר את הקלט כמו שהוא (לפיתוח מקומי).

import { put } from '@vercel/blob';

// מאתר את מפתח הכתיבה של Blob לא משנה איך נקרא המשתנה
// (BLOB_READ_WRITE_TOKEN, או עם קידומת של שם המאגר, וכו').
function blobToken(): string | undefined {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;
  for (const [k, v] of Object.entries(process.env)) {
    if (v && /READ_WRITE_TOKEN/i.test(k)) return v;
  }
  for (const v of Object.values(process.env)) {
    if (typeof v === 'string' && v.startsWith('vercel_blob_rw_')) return v;
  }
  return undefined;
}

export function hasBlob(): boolean {
  return Boolean(blobToken());
}

export async function uploadPhotos(photos: string[], refPrefix: string): Promise<string[]> {
  if (!photos || photos.length === 0) return [];
  const token = blobToken(); // אולי קיים, אולי לא — ב-Vercel לפעמים זמין אוטומטית

  const out: string[] = [];
  for (let i = 0; i < photos.length; i++) {
    const p = photos[i];
    if (typeof p !== 'string' || !p.startsWith('data:')) {
      out.push(p); // כבר כתובת – משאירים
      continue;
    }
    try {
      const comma = p.indexOf(',');
      const head = p.slice(0, comma);
      const b64 = p.slice(comma + 1);
      const mime = (head.match(/data:(.*?);/) || [])[1] || 'image/jpeg';
      const ext = (mime.split('/')[1] || 'jpg').replace(/[^a-z0-9]/gi, '');
      const buf = Buffer.from(b64, 'base64');
      const blob = await put(`reports/${refPrefix}-${Date.now()}-${i}.${ext}`, buf, {
        access: 'public',
        contentType: mime,
        ...(token ? { token } : {}),
      });
      out.push(blob.url);
    } catch {
      // אם ההעלאה ל-Blob לא זמינה – שומרים את התמונה עצמה (data URL) במסד
      out.push(p);
    }
  }
  return out;
}
