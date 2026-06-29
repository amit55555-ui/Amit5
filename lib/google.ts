// ===== חיבור מאומת ל-Google Calendar (צד שרת בלבד) =====
// משתמש ב-OAuth2 עם refresh token של חשבון הספר.
// אם משתני הסביבה לא הוגדרו – מחזיר null, והאפליקציה נופלת בחזרה למצב דמו.

import { google } from 'googleapis';

export const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';
export const TIME_ZONE = process.env.BARBER_TIMEZONE || 'Asia/Jerusalem';

export function isCalendarConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN,
  );
}

export function getCalendar() {
  if (!isCalendarConfigured()) return null;

  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

  return google.calendar({ version: 'v3', auth });
}
