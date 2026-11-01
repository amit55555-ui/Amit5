// הגדרות מערכת (כולל החלפת סיסמת מנהל)
import { adminPasswordOk, hashPassword, isAdmin, loginAdmin } from '@/lib/auth';
import { store } from '@/lib/store';
import { body, fail, num, ok, str } from '@/lib/http';
import { publicSettings, type Settings } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const st = await store().settings();
  if (!(await isAdmin(st))) return fail('נדרשת כניסת מנהל', 401);
  return ok({ settings: publicSettings(st) });
}

export async function PUT(req: Request) {
  const st = await store().settings();
  if (!(await isAdmin(st))) return fail('נדרשת כניסת מנהל', 401);
  const b = await body(req);
  const next: Settings = {
    ...st,
    companyName: str(b.companyName, 80),
    stdHours: Math.min(24, Math.max(1, num(b.stdHours, st.stdHours))),
    otEnabled: Boolean(b.otEnabled),
    ot1Hours: Math.min(24, Math.max(0, num(b.ot1Hours, st.ot1Hours))),
    ot1Rate: Math.max(1, num(b.ot1Rate, st.ot1Rate)),
    ot2Rate: Math.max(1, num(b.ot2Rate, st.ot2Rate)),
    travelPerDay: Math.max(0, num(b.travelPerDay, st.travelPerDay)),
    allowEmployeeEdit: Boolean(b.allowEmployeeEdit),
    showPayToEmployees: Boolean(b.showPayToEmployees),
  };
  const newPw = typeof b.newAdminPassword === 'string' ? b.newAdminPassword : '';
  if (newPw) {
    if (newPw.length < 6) return fail('סיסמת מנהל: לפחות 6 תווים');
    if (typeof b.currentAdminPassword !== 'string' || !adminPasswordOk(b.currentAdminPassword, st)) return fail('הסיסמה הנוכחית שגויה');
    next.adminPassHash = hashPassword(newPw);
  }
  await store().saveSettings(next);
  if (newPw) await loginAdmin(next); // נשארים מחוברים אחרי החלפת סיסמה
  return ok({ settings: publicSettings(next) });
}
