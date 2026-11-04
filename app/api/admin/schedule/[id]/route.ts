// עריכה ומחיקה של משמרת בסידור
import { isAdmin } from '@/lib/auth';
import { store } from '@/lib/store';
import { body, fail, ok } from '@/lib/http';
import { validatePlan } from '@/lib/plan';

export const dynamic = 'force-dynamic';
type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const st = await store().settings();
  if (!(await isAdmin(st))) return fail('נדרשת כניסת מנהל', 401);
  const { id } = await params;
  const cur = await store().planById(id);
  if (!cur) return fail('המשמרת לא נמצאה', 404);
  const v = await validatePlan(await body(req), st, id);
  if ('error' in v) return fail(v.error);
  const p = { ...cur, ...v, updatedAt: Date.now() };
  await store().savePlan(p);
  return ok({ plan: p });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await isAdmin())) return fail('נדרשת כניסת מנהל', 401);
  const { id } = await params;
  await store().deletePlan(id);
  return ok();
}
