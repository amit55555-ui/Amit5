// ===== העלאת תמונות ל-Vercel Blob =====
// מקבל תמונות כ-data URLs (מהלקוח), מעלה ל-Blob, ומחזיר כתובות ציבוריות.
// אם Blob לא מוגדר – מחזיר את הקלט כמו שהוא (לפיתוח מקומי).

import { put } from '@vercel/blob';

export function hasBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function uploadPhotos(photos: string[], refPrefix: string): Promise<string[]> {
  if (!photos || photos.length === 0) return [];
  if (!hasBlob()) return photos;

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
      });
      out.push(blob.url);
    } catch {
      // אם העלאה נכשלה – מדלגים על התמונה במקום להפיל את כל הפנייה
    }
  }
  return out;
}
