// כניסת מנהל: GET = האם מחובר, POST = כניסה עם סיסמה, DELETE = יציאה
import { adminPasswordOk, adminUsesDefault, isAdmin, loginAdmin, logoutAdmin } from '@/lib/auth';
import { store, usingDatabase } from '@/lib/store';
import { body, fail, ok } from '@/lib/http';

export const dynamic = 'force-dynamic';

export async function GET() {
  const st = await store().settings();
  return ok({ admin: await isAdmin(st), defaultPassword: adminUsesDefault(st), database: usingDatabase() });
}

export async function POST(req: Request) {
  const { password } = await body(req);
  const st = await store().settings();
  if (typeof password !== 'string' || !adminPasswordOk(password, st)) {
    await new Promise((r) => setTimeout(r, 600));
    return fail('סיסמת מנהל שגויה', 401);
  }
  await loginAdmin(st);
  return ok();
}

export async function DELETE() {
  await logoutAdmin();
  return ok();
}
