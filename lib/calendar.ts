// ===== פעולות יומן ברמה גבוהה (צד שרת) =====

import { Booking, Service } from '@/types';
import { SERVICES, BARBER } from '@/data/services';
import { BusyInterval, timeToMinutes } from '@/lib/slots';
import { CALENDAR_ID, TIME_ZONE, getCalendar } from '@/lib/google';

// מזהה שמסמן אירוע שנוצר על ידי האפליקציה (לסינון בפאנל הניהול)
const APP_TAG = 'barber-app';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

// בונה timestamp ISO מקומי (ללא Z) – אזור הזמן מוגדר בנפרד באירוע
function localISO(date: string, time: string, addMinutes = 0): string {
  const start = new Date(`${date}T${time}:00`);
  start.setMinutes(start.getMinutes() + addMinutes);
  return `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}T${pad(
    start.getHours(),
  )}:${pad(start.getMinutes())}:00`;
}

// יוצר אירוע ביומן הספר; מוסיף את הלקוח כמוזמן כדי ש-Google ישלח אישור/תזכורת
export async function createEvent(booking: Booking): Promise<string> {
  const calendar = getCalendar();
  if (!calendar) throw new Error('calendar-not-configured');

  const service = SERVICES.find((s) => s.id === booking.serviceId);
  const name = service?.name ?? 'תור';
  const duration = service?.duration ?? 30;

  const attendees = booking.customerEmail
    ? [{ email: booking.customerEmail, displayName: booking.customerName }]
    : undefined;

  const res = await calendar.events.insert({
    calendarId: CALENDAR_ID,
    sendUpdates: 'all', // שולח ללקוח מייל הזמנה/אישור
    requestBody: {
      summary: `${service?.emoji ?? '💈'} ${name} — ${booking.customerName}`,
      description:
        `תור שנקבע דרך אפליקציית המספרה\n\n` +
        `👤 לקוח: ${booking.customerName}\n` +
        `📞 טלפון: ${booking.customerPhone}\n` +
        `✂️ שירות: ${name} (${duration} דק׳)\n` +
        `💰 לתשלום במקום: ₪${service?.price ?? ''}`,
      start: { dateTime: localISO(booking.date, booking.time), timeZone: TIME_ZONE },
      end: { dateTime: localISO(booking.date, booking.time, duration), timeZone: TIME_ZONE },
      attendees,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 60 },
          { method: 'email', minutes: 24 * 60 },
        ],
      },
      extendedProperties: {
        private: {
          app: APP_TAG,
          serviceId: booking.serviceId,
          phone: booking.customerPhone,
        },
      },
    },
  });

  return res.data.id as string;
}

// מבטל (מוחק) אירוע; sendUpdates=all שולח ללקוח מייל ביטול
export async function deleteEvent(eventId: string): Promise<void> {
  const calendar = getCalendar();
  if (!calendar) throw new Error('calendar-not-configured');
  await calendar.events.delete({
    calendarId: CALENDAR_ID,
    eventId,
    sendUpdates: 'all',
  });
}

// מחזיר את הקטעים התפוסים ביום נתון (כל מה שביומן, לא רק תורים מהאפליקציה)
export async function getBusyIntervals(iso: string): Promise<BusyInterval[]> {
  const calendar = getCalendar();
  if (!calendar) return [];

  const timeMin = new Date(`${iso}T00:00:00`).toISOString();
  const timeMax = new Date(`${iso}T23:59:59`).toISOString();

  const res = await calendar.freebusy.query({
    requestBody: {
      timeMin,
      timeMax,
      timeZone: TIME_ZONE,
      items: [{ id: CALENDAR_ID }],
    },
  });

  const busy = res.data.calendars?.[CALENDAR_ID]?.busy ?? [];
  return busy.map((b) => ({
    start: minutesFromMidnight(b.start as string, iso),
    end: minutesFromMidnight(b.end as string, iso),
  }));
}

// ממיר timestamp לאזור הזמן של המספרה, ומחזיר דקות מחצות באותו יום
function minutesFromMidnight(ts: string, iso: string): number {
  const d = new Date(ts);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
  const dayStr = `${get('year')}-${get('month')}-${get('day')}`;
  const minutes = Number(get('hour')) * 60 + Number(get('minute'));
  // אם האירוע מתחיל ביום קודם/הבא – קצץ לגבולות היום
  if (dayStr < iso) return 0;
  if (dayStr > iso) return 24 * 60;
  return minutes;
}

// מחזיר את התורים העתידיים מהיומן (לפאנל הניהול)
export async function listUpcoming(): Promise<Booking[]> {
  const calendar = getCalendar();
  if (!calendar) return [];

  const res = await calendar.events.list({
    calendarId: CALENDAR_ID,
    timeMin: new Date().toISOString(),
    maxResults: 100,
    singleEvents: true,
    orderBy: 'startTime',
    privateExtendedProperty: [`app=${APP_TAG}`],
  });

  const events = res.data.items ?? [];
  return events
    .filter((e) => e.start?.dateTime)
    .map((e) => {
      const start = new Date(e.start!.dateTime as string);
      const serviceId = e.extendedProperties?.private?.serviceId ?? '';
      const date = isoInTz(start);
      const time = hhmmInTz(start);
      const attendee = e.attendees?.[0];
      return {
        id: e.id as string,
        serviceId,
        barberId: BARBER.id,
        date,
        time,
        customerName: attendee?.displayName ?? (e.summary?.split('—')[1]?.trim() ?? 'לקוח'),
        customerPhone: e.extendedProperties?.private?.phone ?? '',
        customerEmail: attendee?.email ?? undefined,
        createdAt: e.created ? new Date(e.created).getTime() : Date.now(),
      } as Booking;
    });
}

function isoInTz(d: Date): string {
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
  return p; // en-CA נותן YYYY-MM-DD
}

function hhmmInTz(d: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

// מוודא שאין כבר אירוע חופף לאותו זמן (מירוץ בין שני לקוחות)
export async function isSlotFree(booking: Booking): Promise<boolean> {
  const service = SERVICES.find((s) => s.id === booking.serviceId);
  const duration = service?.duration ?? 30;
  const start = timeToMinutes(booking.time);
  const end = start + duration;
  const busy = await getBusyIntervals(booking.date);
  return !busy.some((b) => start < b.end && end > b.start);
}
