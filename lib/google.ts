// ===== חיבור מאומת ל-Gmail (צד שרת בלבד) =====
// משתמש ב-OAuth2 עם refresh token של חשבון הבניין/הוועד.
// אם משתני הסביבה לא הוגדרו – מחזיר null, והאפליקציה עובדת בלי שליחת מיילים.

import { google } from 'googleapis';

// כתובת המייל של הוועד שאליה נשלחים הדיווחים
export const COMMITTEE_EMAIL = process.env.COMMITTEE_EMAIL || '';

export function isMailConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN &&
      COMMITTEE_EMAIL,
  );
}

export function getGmail() {
  if (!isMailConfigured()) return null;

  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

  return google.gmail({ version: 'v1', auth });
}
