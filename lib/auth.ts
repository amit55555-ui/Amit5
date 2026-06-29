// ===== בדיקת גישת ועד (צד שרת) =====
// קוד הגישה מוגדר ב-COMMITTEE_PASSCODE. אם לא הוגדר – ברירת מחדל "1234"
// (למצב דמו בלבד; בפרודקשן הגדירו קוד משלכם).

import { NextRequest } from 'next/server';

export function committeePasscode(): string {
  return process.env.COMMITTEE_PASSCODE || '1234';
}

export function isCommittee(req: NextRequest): boolean {
  const provided =
    req.headers.get('x-committee-passcode') ||
    new URL(req.url).searchParams.get('passcode') ||
    '';
  return provided === committeePasscode();
}
