import { useEffect, useMemo, useState } from 'react';
import { Booking } from '@/types';
import { SERVICES } from '@/data/services';
import { formatDateHe, toISODate } from '@/lib/bookings';
import { listBookings } from '@/lib/client';

interface Props {
  onClose: () => void;
  onCancel: (id: string) => Promise<void>;
}

export default function AdminPanel({ onClose, onCancel }: Props) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const today = toISODate(new Date());

  useEffect(() => {
    listBookings().then((b) => {
      setBookings(b);
      setLoading(false);
    });
  }, []);

  const upcoming = useMemo(
    () =>
      bookings
        .filter((b) => b.date >= today)
        .sort((a, b) =>
          a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date),
        ),
    [bookings, today],
  );

  async function cancel(id: string) {
    setBusyId(id);
    await onCancel(id);
    const fresh = await listBookings();
    setBookings(fresh);
    setBusyId(null);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
      <div className="bg-cream w-full max-w-md max-h-[85vh] rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col">
        <div className="bg-dark text-cream px-5 py-4 flex items-center justify-between">
          <h2 className="font-black">📋 ניהול תורים</h2>
          <button onClick={onClose} className="text-xl leading-none">✕</button>
        </div>

        <div className="p-4 overflow-y-auto">
          {loading ? (
            <p className="text-center text-soft text-sm py-10">טוען תורים…</p>
          ) : (
            <>
              <p className="text-xs text-soft mb-3">{upcoming.length} תורים קרובים</p>
              {upcoming.length === 0 ? (
                <p className="text-center text-soft text-sm py-10">אין תורים קרובים</p>
              ) : (
                <div className="space-y-2">
                  {upcoming.map((b) => {
                    const service = SERVICES.find((s) => s.id === b.serviceId);
                    return (
                      <div
                        key={b.id}
                        className="bg-white rounded-xl p-3 border-2 border-border flex items-center gap-3"
                      >
                        <div className="text-center shrink-0 bg-orange/10 rounded-lg px-2 py-1">
                          <div className="text-sm font-black text-orange leading-none">{b.time}</div>
                          <div className="text-[9px] text-soft mt-0.5">
                            {formatDateHe(b.date).split(',')[1]}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-dark text-sm truncate">{b.customerName}</div>
                          <div className="text-[11px] text-soft truncate" dir="ltr">{b.customerPhone}</div>
                          <div className="text-[11px] text-soft truncate">
                            {service?.emoji} {service?.name}
                          </div>
                        </div>
                        <button
                          onClick={() => cancel(b.id)}
                          disabled={busyId === b.id}
                          className="text-xs text-red-500 hover:text-red-700 shrink-0 px-2 disabled:opacity-50"
                        >
                          {busyId === b.id ? '…' : 'ביטול'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
