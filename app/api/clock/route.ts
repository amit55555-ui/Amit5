// שעון נוכחות: action = in | out | break
import crypto from 'crypto';
import { currentUser } from '@/lib/auth';
import { store } from '@/lib/store';
import { body, fail, ok } from '@/lib/http';
import { onBreak } from '@/lib/calc';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const u = await currentUser();
  if (!u) return fail('יש להתחבר מחדש', 401);
  const { action } = await body(req);
  const now = Date.now();
  const active = (await store().activeShifts(u.id))[0] || null;

  if (action === 'in') {
    if (active) return fail('כבר נרשמה כניסה למשמרת', 409);
    const s = { id: crypto.randomUUID(), userId: u.id, start: now, end: null, breaks: [], breakMin: 0, note: '', editedBy: null, updatedAt: now };
    await store().saveShift(s);
    return ok({ active: s });
  }
  if (!active) return fail('אין משמרת פעילה', 409);

  if (action === 'out') {
    const s = { ...active, end: now, breaks: active.breaks.map((b) => (b.e == null ? { ...b, e: now } : b)), updatedAt: now };
    await store().saveShift(s);
    return ok({ active: null, closed: s });
  }
  if (action === 'break') {
    const breaks = [...active.breaks];
    if (onBreak(active)) breaks[breaks.length - 1] = { ...breaks[breaks.length - 1], e: now };
    else breaks.push({ s: now, e: null });
    const s = { ...active, breaks, updatedAt: now };
    await store().saveShift(s);
    return ok({ active: s });
  }
  return fail('פעולה לא מוכרת');
}
