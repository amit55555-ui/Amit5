// אחסון: Postgres (Neon) כשמוגדר DATABASE_URL, אחרת קובץ JSON מקומי לפיתוח.
import 'server-only';
import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { DEFAULT_SETTINGS, migrateSettings, type Avail, type Plan, type Settings, type Shift, type User } from './types';

type Q = { userId?: string; from?: number; to?: number };

interface Store {
  users(): Promise<User[]>;
  userById(id: string): Promise<User | null>;
  userByUsername(username: string): Promise<User | null>;
  saveUser(u: User): Promise<void>;
  deleteUser(id: string): Promise<void>;
  shifts(q: Q): Promise<Shift[]>;
  shiftById(id: string): Promise<Shift | null>;
  activeShifts(userId?: string): Promise<Shift[]>;
  saveShift(s: Shift): Promise<void>;
  deleteShift(id: string): Promise<void>;
  settings(): Promise<Settings>;
  saveSettings(s: Settings): Promise<void>;
  plans(q: { from: string; to: string; userId?: string }): Promise<Plan[]>; // to = כולל
  planById(id: string): Promise<Plan | null>;
  savePlan(p: Plan): Promise<void>;
  deletePlan(id: string): Promise<void>;
  avail(q: { week: string; userId?: string }): Promise<Avail[]>;
  saveAvail(a: Avail): Promise<void>;
  published(weeks: string[]): Promise<Record<string, number>>; // שבוע → זמן פרסום
  setPublished(week: string, at: number | null): Promise<void>;
}

function connectionString() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING;
}

export const usingDatabase = () => Boolean(connectionString());

/* ---------- Postgres ---------- */
function pgStore(): Store {
  const sql: NeonQueryFunction<false, false> = neon(connectionString()!);
  let ready: Promise<unknown> | null = null;
  const init = () => (ready ||= (async () => {
    await sql`CREATE TABLE IF NOT EXISTS att_users (
      id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, name TEXT NOT NULL, pass_hash TEXT NOT NULL,
      wage DOUBLE PRECISION NOT NULL DEFAULT 0, travel DOUBLE PRECISION, active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at BIGINT NOT NULL)`;
    await sql`CREATE TABLE IF NOT EXISTS att_shifts (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, start_at BIGINT NOT NULL, end_at BIGINT,
      breaks JSONB NOT NULL DEFAULT '[]'::jsonb, break_min INTEGER NOT NULL DEFAULT 0, note TEXT NOT NULL DEFAULT '',
      edited_by TEXT, updated_at BIGINT NOT NULL)`;
    await sql`ALTER TABLE att_shifts ADD COLUMN IF NOT EXISTS in_loc JSONB`;
    await sql`ALTER TABLE att_shifts ADD COLUMN IF NOT EXISTS out_loc JSONB`;
    await sql`CREATE INDEX IF NOT EXISTS att_shifts_user_start ON att_shifts (user_id, start_at)`;
    await sql`CREATE INDEX IF NOT EXISTS att_shifts_start ON att_shifts (start_at)`;
    await sql`CREATE TABLE IF NOT EXISTS att_settings (k TEXT PRIMARY KEY, v JSONB NOT NULL)`;
    await sql`CREATE TABLE IF NOT EXISTS att_plans (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, day TEXT NOT NULL, start_t TEXT NOT NULL, end_t TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '', updated_at BIGINT NOT NULL)`;
    await sql`CREATE INDEX IF NOT EXISTS att_plans_day ON att_plans (day)`;
    await sql`CREATE TABLE IF NOT EXISTS att_avail (
      user_id TEXT NOT NULL, week TEXT NOT NULL, marks JSONB NOT NULL DEFAULT '{}'::jsonb, note TEXT NOT NULL DEFAULT '',
      submitted_at BIGINT NOT NULL, PRIMARY KEY (user_id, week))`;
    await sql`CREATE TABLE IF NOT EXISTS att_weeks (week TEXT PRIMARY KEY, published_at BIGINT)`;
  })().catch((e) => { ready = null; throw e; }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toUser = (r: any): User => ({
    id: r.id, username: r.username, name: r.name, passHash: r.pass_hash, wage: Number(r.wage),
    travel: r.travel == null ? null : Number(r.travel), active: r.active, createdAt: Number(r.created_at),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toShift = (r: any): Shift => ({
    id: r.id, userId: r.user_id, start: Number(r.start_at), end: r.end_at == null ? null : Number(r.end_at),
    breaks: r.breaks || [], breakMin: Number(r.break_min), note: r.note || '', editedBy: r.edited_by, updatedAt: Number(r.updated_at),
    inLoc: r.in_loc || null, outLoc: r.out_loc || null,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toPlan = (r: any): Plan => ({
    id: r.id, userId: r.user_id, day: r.day, start: r.start_t, end: r.end_t, note: r.note || '', updatedAt: Number(r.updated_at),
  });

  return {
    async users() { await init(); return (await sql`SELECT * FROM att_users ORDER BY name`).map(toUser); },
    async userById(id) { await init(); const r = await sql`SELECT * FROM att_users WHERE id=${id}`; return r[0] ? toUser(r[0]) : null; },
    async userByUsername(u) { await init(); const r = await sql`SELECT * FROM att_users WHERE lower(username)=lower(${u})`; return r[0] ? toUser(r[0]) : null; },
    async saveUser(u) {
      await init();
      await sql`INSERT INTO att_users (id, username, name, pass_hash, wage, travel, active, created_at)
        VALUES (${u.id}, ${u.username}, ${u.name}, ${u.passHash}, ${u.wage}, ${u.travel}, ${u.active}, ${u.createdAt})
        ON CONFLICT (id) DO UPDATE SET username=EXCLUDED.username, name=EXCLUDED.name, pass_hash=EXCLUDED.pass_hash,
        wage=EXCLUDED.wage, travel=EXCLUDED.travel, active=EXCLUDED.active`;
    },
    async deleteUser(id) { await init(); await sql`DELETE FROM att_shifts WHERE user_id=${id}`; await sql`DELETE FROM att_plans WHERE user_id=${id}`; await sql`DELETE FROM att_avail WHERE user_id=${id}`; await sql`DELETE FROM att_users WHERE id=${id}`; },
    async shifts({ userId, from, to }) {
      await init();
      const f = from ?? 0, t = to ?? 8.64e15;
      const r = userId
        ? await sql`SELECT * FROM att_shifts WHERE user_id=${userId} AND start_at>=${f} AND start_at<${t} ORDER BY start_at`
        : await sql`SELECT * FROM att_shifts WHERE start_at>=${f} AND start_at<${t} ORDER BY start_at`;
      return r.map(toShift);
    },
    async shiftById(id) { await init(); const r = await sql`SELECT * FROM att_shifts WHERE id=${id}`; return r[0] ? toShift(r[0]) : null; },
    async activeShifts(userId) {
      await init();
      const r = userId
        ? await sql`SELECT * FROM att_shifts WHERE end_at IS NULL AND user_id=${userId}`
        : await sql`SELECT * FROM att_shifts WHERE end_at IS NULL`;
      return r.map(toShift);
    },
    async saveShift(s) {
      await init();
      const inLoc = s.inLoc ? JSON.stringify(s.inLoc) : null, outLoc = s.outLoc ? JSON.stringify(s.outLoc) : null;
      await sql`INSERT INTO att_shifts (id, user_id, start_at, end_at, breaks, break_min, note, edited_by, updated_at, in_loc, out_loc)
        VALUES (${s.id}, ${s.userId}, ${s.start}, ${s.end}, ${JSON.stringify(s.breaks)}::jsonb, ${s.breakMin}, ${s.note}, ${s.editedBy}, ${s.updatedAt}, ${inLoc}::jsonb, ${outLoc}::jsonb)
        ON CONFLICT (id) DO UPDATE SET user_id=EXCLUDED.user_id, start_at=EXCLUDED.start_at, end_at=EXCLUDED.end_at,
        breaks=EXCLUDED.breaks, break_min=EXCLUDED.break_min, note=EXCLUDED.note, edited_by=EXCLUDED.edited_by, updated_at=EXCLUDED.updated_at,
        in_loc=EXCLUDED.in_loc, out_loc=EXCLUDED.out_loc`;
    },
    async deleteShift(id) { await init(); await sql`DELETE FROM att_shifts WHERE id=${id}`; },
    async settings() {
      await init();
      const r = await sql`SELECT v FROM att_settings WHERE k='main'`;
      return migrateSettings({ ...DEFAULT_SETTINGS, ...(r[0]?.v || {}) });
    },
    async saveSettings(s) {
      await init();
      await sql`INSERT INTO att_settings (k, v) VALUES ('main', ${JSON.stringify(s)}::jsonb) ON CONFLICT (k) DO UPDATE SET v=EXCLUDED.v`;
    },
    async plans({ from, to, userId }) {
      await init();
      const r = userId
        ? await sql`SELECT * FROM att_plans WHERE day>=${from} AND day<=${to} AND user_id=${userId} ORDER BY day, start_t`
        : await sql`SELECT * FROM att_plans WHERE day>=${from} AND day<=${to} ORDER BY day, start_t`;
      return r.map(toPlan);
    },
    async planById(id) { await init(); const r = await sql`SELECT * FROM att_plans WHERE id=${id}`; return r[0] ? toPlan(r[0]) : null; },
    async savePlan(p) {
      await init();
      await sql`INSERT INTO att_plans (id, user_id, day, start_t, end_t, note, updated_at)
        VALUES (${p.id}, ${p.userId}, ${p.day}, ${p.start}, ${p.end}, ${p.note}, ${p.updatedAt})
        ON CONFLICT (id) DO UPDATE SET user_id=EXCLUDED.user_id, day=EXCLUDED.day, start_t=EXCLUDED.start_t,
        end_t=EXCLUDED.end_t, note=EXCLUDED.note, updated_at=EXCLUDED.updated_at`;
    },
    async deletePlan(id) { await init(); await sql`DELETE FROM att_plans WHERE id=${id}`; },
    async avail({ week, userId }) {
      await init();
      const r = userId
        ? await sql`SELECT * FROM att_avail WHERE week=${week} AND user_id=${userId}`
        : await sql`SELECT * FROM att_avail WHERE week=${week}`;
      return r.map((x) => ({ userId: x.user_id, week: x.week, marks: x.marks || {}, note: x.note || '', submittedAt: Number(x.submitted_at) }));
    },
    async saveAvail(a) {
      await init();
      await sql`INSERT INTO att_avail (user_id, week, marks, note, submitted_at) VALUES (${a.userId}, ${a.week}, ${JSON.stringify(a.marks)}::jsonb, ${a.note}, ${a.submittedAt})
        ON CONFLICT (user_id, week) DO UPDATE SET marks=EXCLUDED.marks, note=EXCLUDED.note, submitted_at=EXCLUDED.submitted_at`;
    },
    async published(weeks) {
      await init();
      if (!weeks.length) return {};
      const r = await sql`SELECT week, published_at FROM att_weeks WHERE week = ANY(${weeks}) AND published_at IS NOT NULL`;
      return Object.fromEntries(r.map((x) => [x.week, Number(x.published_at)]));
    },
    async setPublished(week, at) {
      await init();
      await sql`INSERT INTO att_weeks (week, published_at) VALUES (${week}, ${at}) ON CONFLICT (week) DO UPDATE SET published_at=EXCLUDED.published_at`;
    },
  };
}

/* ---------- קובץ JSON (פיתוח מקומי) ---------- */
type FileData = { users: User[]; shifts: Shift[]; settings: Partial<Settings>; plans?: Plan[]; avail?: Avail[]; weeks?: Record<string, number | null> };
function fileStore(): Store {
  const file = path.join(process.env.DATA_DIR || path.join(os.tmpdir(), 'attendance'), 'data.json');
  let queue: Promise<unknown> = Promise.resolve();
  async function load(): Promise<FileData> {
    try { return JSON.parse(await fs.readFile(file, 'utf8')); } catch { return { users: [], shifts: [], settings: {} }; }
  }
  // כתיבות בתור אחד כדי שלא ידרסו זו את זו
  function mutate(fn: (d: FileData) => void) {
    const run = queue.then(async () => {
      const d = await load(); fn(d);
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, JSON.stringify(d));
    });
    queue = run.catch(() => {});
    return run;
  }
  const upsert = <T extends { id: string }>(arr: T[], x: T) => { const i = arr.findIndex((a) => a.id === x.id); if (i >= 0) arr[i] = x; else arr.push(x); };
  return {
    async users() { return (await load()).users.sort((a, b) => a.name.localeCompare(b.name, 'he')); },
    async userById(id) { return (await load()).users.find((u) => u.id === id) || null; },
    async userByUsername(n) { return (await load()).users.find((u) => u.username.toLowerCase() === n.toLowerCase()) || null; },
    async saveUser(u) { await mutate((d) => upsert(d.users, u)); },
    async deleteUser(id) { await mutate((d) => { d.users = d.users.filter((u) => u.id !== id); d.shifts = d.shifts.filter((s) => s.userId !== id); d.plans = (d.plans || []).filter((p) => p.userId !== id); d.avail = (d.avail || []).filter((a) => a.userId !== id); }); },
    async shifts({ userId, from, to }) {
      return (await load()).shifts
        .filter((s) => (!userId || s.userId === userId) && s.start >= (from ?? 0) && s.start < (to ?? 8.64e15))
        .sort((a, b) => a.start - b.start);
    },
    async shiftById(id) { return (await load()).shifts.find((s) => s.id === id) || null; },
    async activeShifts(userId) { return (await load()).shifts.filter((s) => s.end == null && (!userId || s.userId === userId)); },
    async saveShift(s) { await mutate((d) => upsert(d.shifts, s)); },
    async deleteShift(id) { await mutate((d) => { d.shifts = d.shifts.filter((s) => s.id !== id); }); },
    async settings() { return migrateSettings({ ...DEFAULT_SETTINGS, ...(await load()).settings }); },
    async saveSettings(s) { await mutate((d) => { d.settings = s; }); },
    async plans({ from, to, userId }) {
      return ((await load()).plans || [])
        .filter((p) => p.day >= from && p.day <= to && (!userId || p.userId === userId))
        .sort((a, b) => (a.day + a.start < b.day + b.start ? -1 : 1));
    },
    async planById(id) { return ((await load()).plans || []).find((p) => p.id === id) || null; },
    async savePlan(p) { await mutate((d) => { d.plans ||= []; upsert(d.plans, p); }); },
    async deletePlan(id) { await mutate((d) => { d.plans = (d.plans || []).filter((p) => p.id !== id); }); },
    async avail({ week, userId }) { return ((await load()).avail || []).filter((a) => a.week === week && (!userId || a.userId === userId)); },
    async saveAvail(a) {
      await mutate((d) => {
        d.avail = (d.avail || []).filter((x) => !(x.userId === a.userId && x.week === a.week));
        d.avail.push(a);
      });
    },
    async published(weeks) {
      const w = (await load()).weeks || {};
      return Object.fromEntries(weeks.filter((k) => w[k]).map((k) => [k, w[k] as number]));
    },
    async setPublished(week, at) { await mutate((d) => { d.weeks ||= {}; d.weeks[week] = at; }); },
  };
}

let instance: Store | null = null;
export function store(): Store {
  return (instance ||= usingDatabase() ? pgStore() : fileStore());
}
