// ===== בדיקת גישת מנהל למערכת הנוכחות (צד שרת) =====
// קוד הגישה מוגדר ב-ATTENDANCE_ADMIN_PASSCODE. אם לא הוגדר – ברירת מחדל
// "1234" (למצב דמו בלבד; בפרודקשן הגדירו קוד משלכם).

import { NextRequest } from 'next/server';

export function attendanceAdminPasscode(): string {
  return process.env.ATTENDANCE_ADMIN_PASSCODE || '1836';
}

export function isAttendanceAdmin(req: NextRequest): boolean {
  const provided =
    req.headers.get('x-attendance-admin-passcode') ||
    new URL(req.url).searchParams.get('passcode') ||
    '';
  return provided === attendanceAdminPasscode();
}
