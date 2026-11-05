'use client';
// הסידור השבועי של כל הצוות, כפי שהמנהל פרסם
import { useState } from 'react';
import { addDays, DAYNAMES, hmShort, planMs, shortDate, weekdayOf, weekTitle } from '@/lib/calc';
import type { DayHours, Plan } from '@/lib/types';

export type TeamData = { plans: Plan[]; names: Record<string, string>; me: string; businessHours: DayHours[]; published: Record<string, number> };

export function TeamSchedule({ data, from, today }: { data: TeamData | null; from: string; today: string }) {
  const [weekIdx, setWeekIdx] = useState(0);
  const [onlyMine, setOnlyMine] = useState(false);
  if (!data) return <p className="muted">טוען…</p>;
  const week = addDays(from, weekIdx * 7);
  const published = !!data.published[week];
  const days = Array.from({ length: 7 }, (_, i) => addDays(week, i));
  const mine = data.plans.filter((p) => p.userId === data.me && p.day >= week && p.day <= addDays(week, 6));
  const myTotal = mine.reduce((a, p) => a + planMs(p), 0);

  return (
    <>
      <div className="seg wide" role="tablist">
        <button type="button" className={weekIdx === 0 ? 'on' : ''} onClick={() => setWeekIdx(0)}>השבוע</button>
        <button type="button" className={weekIdx === 1 ? 'on' : ''} onClick={() => setWeekIdx(1)}>שבוע הבא</button>
      </div>
      <div className="bar">
        <h2>{weekTitle(week)}</h2>
        {published ? (
          <label className="toggle" htmlFor="onlyMine"><input id="onlyMine" type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} /> רק שלי</label>
        ) : null}
      </div>

      {!published ? (
        <div className="card empty"><strong>הסידור לשבוע הזה עוד לא פורסם</strong><span className="muted">כשהמנהל יפרסם אותו, הוא יופיע כאן.</span></div>
      ) : (
        <>
          <div className="card"><span>המשמרות שלך השבוע: <b>{mine.length}</b> · סה״כ <b>{hmShort(myTotal)}</b></span></div>
          {days.map((d) => {
            const open = data.businessHours?.[weekdayOf(d)];
            const list = data.plans.filter((p) => p.day === d && (!onlyMine || p.userId === data.me))
              .sort((a, b) => (a.start < b.start ? -1 : 1));
            if (!open && !list.length) return null;
            return (
              <section key={d} className={`card daycard${d === today ? ' today' : ''}`}>
                <h3>יום {DAYNAMES[weekdayOf(d)]} <span className="num muted" style={{ fontWeight: 500 }}>{shortDate(d)}</span>{d === today ? <span className="tag live" style={{ marginInlineStart: 8 }}>היום</span> : null}</h3>
                {list.length === 0 ? <span className="muted">{onlyMine ? 'אין לך משמרת ביום הזה' : 'אין משמרות'}</span> : (
                  <div className="list">
                    {list.map((p) => (
                      <div key={p.id} className={`teamrow${p.userId === data.me ? ' me' : ''}`}>
                        <span className="num">{p.start}–{p.end}</span>
                        <span className="tname">{data.names[p.userId] || '—'}{p.userId === data.me ? ' (את/ה)' : ''}</span>
                        {p.note ? <span className="note">{p.note}</span> : null}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </>
      )}
      <p className="hint" style={{ textAlign: 'center' }}>הסידור נקבע על ידי המנהל. לשינויים פנו אליו.</p>
    </>
  );
}
