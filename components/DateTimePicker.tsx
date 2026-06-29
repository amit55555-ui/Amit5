import { DayOption, Slot } from '@/lib/bookings';

interface Props {
  days: DayOption[];
  date: string | null;
  time: string | null;
  slots: Slot[];
  onPickDate: (iso: string) => void;
  onPickTime: (time: string) => void;
  onBack: () => void;
}

export default function DateTimePicker({
  days,
  date,
  slots,
  onPickDate,
  onPickTime,
  onBack,
}: Props) {
  const hasAvailable = slots.some((s) => s.available);

  return (
    <section>
      <button onClick={onBack} className="text-sm text-soft mb-3 hover:text-orange transition">
        ← חזרה
      </button>
      <h2 className="text-xl font-black text-dark mb-1">בחר מועד</h2>
      <p className="text-sm text-soft mb-4">תאריך ושעה פנויים</p>

      {/* בורר תאריכים אופקי */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {days.map((d) => (
          <button
            key={d.iso}
            disabled={d.isClosed}
            onClick={() => onPickDate(d.iso)}
            className={`shrink-0 w-16 rounded-xl py-2 border-2 transition text-center
              ${date === d.iso ? 'border-orange bg-orange text-white' : 'border-border bg-white text-dark'}
              ${d.isClosed ? 'opacity-40 cursor-not-allowed' : 'hover:border-orange'}`}
          >
            <div className="text-[11px] font-semibold">{d.dayName}</div>
            <div className="text-lg font-black leading-none">{d.dayNum}</div>
            <div className="text-[10px] opacity-80">{d.isClosed ? 'סגור' : d.monthName}</div>
          </button>
        ))}
      </div>

      {/* חלונות זמן */}
      {date && (
        <div className="mt-5">
          {!hasAvailable ? (
            <p className="text-center text-soft text-sm py-8">
              אין תורים פנויים ביום זה 😕<br />נסה תאריך אחר
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {slots.map((s) => (
                <button
                  key={s.time}
                  disabled={!s.available}
                  onClick={() => onPickTime(s.time)}
                  className={`py-2 rounded-lg text-sm font-bold border-2 transition
                    ${s.available
                      ? 'border-border bg-white text-dark hover:border-orange hover:bg-orange/10'
                      : 'border-transparent bg-border/40 text-soft/50 line-through cursor-not-allowed'}`}
                >
                  {s.time}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
