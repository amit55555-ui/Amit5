// ===== עזרי תאריך/שעה למערכת הנוכחות =====

export const WEEKDAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
export const MONTHS = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר',
];

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function fmtTime(ts: number): string {
  const d = new Date(ts);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function dateKeyFromTs(ts: number): string {
  return dateKey(new Date(ts));
}

export function fmtDuration(ms: number): string {
  if (ms < 0) ms = 0;
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}:${pad2(m)}`;
}

export function fmtHoursDecimal(ms: number): string {
  return (ms / 3600000).toFixed(2);
}

export function fmtDayLabel(d: Date): string {
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ב${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// ---- המרות בין תאריך+שעה (input[type=date] / input[type=time]) לחותמת זמן ----

export function toDateInputValue(ts: number): string {
  return dateKeyFromTs(ts);
}

export function toTimeInputValue(ts: number): string {
  const d = new Date(ts);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function fromDateTimeInputs(dateStr: string, timeStr: string): number | null {
  if (!dateStr || !timeStr) return null;
  const ts = new Date(`${dateStr}T${timeStr}:00`).getTime();
  return Number.isNaN(ts) ? null : ts;
}
