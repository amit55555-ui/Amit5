// הגדרות מערכת (כולל החלפת סיסמת מנהל)
import { adminPasswordOk, hashPassword, isAdmin, loginAdmin } from '@/lib/auth';
import { store } from '@/lib/store';
import { body, fail, num, ok, str } from '@/lib/http';
import { publicSettings, type Settings } from '@/lib/types';

export const dynamic = 'force-dynamic';

const T = /^\d{2}:\d{2}$/;
function parseSlots(v: unknown, cur: Settings['slots']): Settings['slots'] {
  if (!Array.isArray(v)) return cur;
  const out: Settings['slots'] = [];
  for (const x of v.slice(0, 12)) {
    if (!x || typeof x !== 'object') continue;
    const o = x as Record<string, unknown>;
    const name = str(o.name, 30), start = String(o.start || ''), end = String(o.end || '');
    if (!name || !T.test(start) || !T.test(end) || end <= start) continue;
    const days = Array.isArray(o.days) ? [...new Set(o.days.map(Number).filter((d) => d >= 0 && d <= 6))].sort() : [];
    const id = typeof o.id === 'string' && /^[\w-]{1,24}$/.test(o.id) ? o.id : Math.random().toString(36).slice(2, 8);
    out.push({ id, name, start, end, days });
  }
  return out;
}
function parseHours(v: unknown, cur: Settings['businessHours']): Settings['businessHours'] {
  if (!Array.isArray(v) || v.length !== 7) return cur;
  return v.map((d) => {
    if (!d || typeof d !== 'object') return null;
    const { open, close } = d as Record<string, unknown>;
    if (typeof open !== 'string' || typeof close !== 'string' || !T.test(open) || !T.test(close) || close <= open) return null;
    return { open, close };
  });
}

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
    requireLocation: Boolean(b.requireLocation),
    businessHours: parseHours(b.businessHours, st.businessHours),
    slots: parseSlots(b.slots, st.slots),
    submitDay: Math.min(6, Math.max(0, Math.round(num(b.submitDay, st.submitDay)))),
    submitTime: typeof b.submitTime === 'string' && T.test(b.submitTime) ? b.submitTime : st.submitTime,
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
