// שיבוץ משמרת חדשה
import crypto from 'crypto';
import { isAdmin } from '@/lib/auth';
import { store } from '@/lib/store';
import { body, fail, ok } from '@/lib/http';
import { validatePlan } from '@/lib/plan';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const st = await store().settings();
  if (!(await isAdmin(st))) return fail('נדרשת כניסת מנהל', 401);
  const v = await validatePlan(await body(req), st);
  if ('error' in v) return fail(v.error);
  const p = { id: crypto.randomUUID(), ...v, updatedAt: Date.now() };
  await store().savePlan(p);
  return ok({ plan: p });
}
