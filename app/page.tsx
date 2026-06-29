'use client';

import { useEffect, useMemo, useState } from 'react';
import { SERVICES, BARBER } from '@/data/services';
import { Booking } from '@/types';
import { Slot } from '@/lib/slots';
import { getUpcomingDays } from '@/lib/bookings';
import { cancelBooking, createBooking, getAvailability } from '@/lib/client';
import Stepper from '@/components/Stepper';
import ServicePicker from '@/components/ServicePicker';
import DateTimePicker from '@/components/DateTimePicker';
import DetailsForm from '@/components/DetailsForm';
import Confirmation from '@/components/Confirmation';
import AdminPanel from '@/components/AdminPanel';

type Step = 0 | 1 | 2 | 3;

export default function Home() {
  const [step, setStep] = useState<Step>(0);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [confirmed, setConfirmed] = useState<Booking | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);

  const service = useMemo(() => SERVICES.find((s) => s.id === serviceId) ?? null, [serviceId]);
  const days = useMemo(() => getUpcomingDays(14), []);

  // טעינת שעות פנויות בכל בחירת תאריך (מהיומן או מקומית)
  useEffect(() => {
    if (!date || !service) return;
    let cancelled = false;
    setSlotsLoading(true);
    getAvailability(date, service.duration).then((s) => {
      if (!cancelled) {
        setSlots(s);
        setSlotsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [date, service]);

  function reset() {
    setStep(0);
    setServiceId(null);
    setDate(null);
    setTime(null);
    setSlots([]);
    setConfirmed(null);
    setNotice(null);
  }

  async function handleConfirm(name: string, phone: string, email: string) {
    if (!service || !date || !time) return;
    setSubmitting(true);
    setNotice(null);
    const booking: Booking = {
      id: `bk-${Date.now()}`,
      serviceId: service.id,
      barberId: BARBER.id,
      date,
      time,
      customerName: name.trim(),
      customerPhone: phone.trim(),
      customerEmail: email.trim() || undefined,
      createdAt: Date.now(),
    };
    const result = await createBooking(booking);
    setSubmitting(false);

    if (result.ok) {
      setConfirmed(result.booking);
      setStep(3);
    } else if (result.reason === 'taken') {
      // התור נתפס בינתיים – חזרה לבחירת מועד עם רענון
      setNotice('אופס, השעה הזו נתפסה בדיוק עכשיו. בחר/י שעה אחרת 🙏');
      setTime(null);
      setStep(1);
      const refreshed = await getAvailability(date, service.duration);
      setSlots(refreshed);
    } else {
      setNotice('משהו השתבש בקביעת התור. נסה/י שוב.');
    }
  }

  return (
    <main className="h-full overflow-y-auto bg-cream">
      <header className="sticky top-0 z-10 bg-dark text-cream px-5 py-4 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-3xl">💈</span>
          <div>
            <h1 className="text-lg font-black leading-tight">מספרת השכונה</h1>
            <p className="text-[11px] text-gold">קביעת תור אצל {BARBER.name}</p>
          </div>
        </div>
        <button
          onClick={() => setShowAdmin(true)}
          className="text-xs bg-soft/40 hover:bg-soft/60 px-3 py-1.5 rounded-full transition"
        >
          ניהול 🗂️
        </button>
      </header>

      <div className="max-w-md mx-auto px-4 pb-24 pt-4">
        {step < 3 && <Stepper step={step} />}

        {notice && (
          <div className="mb-4 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 text-sm px-4 py-2.5">
            {notice}
          </div>
        )}

        {step === 0 && (
          <ServicePicker
            services={SERVICES}
            selected={serviceId}
            onSelect={(id) => {
              setServiceId(id);
              setStep(1);
            }}
          />
        )}

        {step === 1 && service && (
          <DateTimePicker
            days={days}
            date={date}
            time={time}
            slots={slots}
            loading={slotsLoading}
            onPickDate={(iso) => {
              setDate(iso);
              setTime(null);
            }}
            onPickTime={(t) => {
              setTime(t);
              setStep(2);
            }}
            onBack={() => setStep(0)}
          />
        )}

        {step === 2 && service && date && time && (
          <DetailsForm
            service={service}
            barber={BARBER}
            date={date}
            time={time}
            submitting={submitting}
            onConfirm={handleConfirm}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && confirmed && service && (
          <Confirmation
            booking={confirmed}
            service={service}
            barber={BARBER}
            onDone={reset}
          />
        )}
      </div>

      {showAdmin && (
        <AdminPanel onClose={() => setShowAdmin(false)} onCancel={cancelBooking} />
      )}
    </main>
  );
}
