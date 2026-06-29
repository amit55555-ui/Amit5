'use client';

import { useEffect, useMemo, useState } from 'react';
import { SERVICES, BARBERS } from '@/data/services';
import { Booking } from '@/types';
import {
  addBooking,
  getSlotsForDay,
  getUpcomingDays,
  loadBookings,
} from '@/lib/bookings';
import Stepper from '@/components/Stepper';
import ServicePicker from '@/components/ServicePicker';
import BarberPicker from '@/components/BarberPicker';
import DateTimePicker from '@/components/DateTimePicker';
import DetailsForm from '@/components/DetailsForm';
import Confirmation from '@/components/Confirmation';
import AdminPanel from '@/components/AdminPanel';

type Step = 0 | 1 | 2 | 3 | 4;

export default function Home() {
  const [step, setStep] = useState<Step>(0);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [barberId, setBarberId] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [confirmed, setConfirmed] = useState<Booking | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    setBookings(loadBookings());
  }, []);

  const service = useMemo(() => SERVICES.find((s) => s.id === serviceId) ?? null, [serviceId]);
  const barber = useMemo(() => BARBERS.find((b) => b.id === barberId) ?? null, [barberId]);
  const days = useMemo(() => getUpcomingDays(14), []);

  const slots = useMemo(() => {
    if (!date || !barberId || !service) return [];
    return getSlotsForDay(date, barberId, service.duration, bookings);
  }, [date, barberId, service, bookings]);

  function reset() {
    setStep(0);
    setServiceId(null);
    setBarberId(null);
    setDate(null);
    setTime(null);
    setConfirmed(null);
  }

  function handleConfirm(name: string, phone: string) {
    if (!service || !barber || !date || !time) return;
    const booking: Booking = {
      id: `bk-${Date.now()}`,
      serviceId: service.id,
      barberId: barber.id,
      date,
      time,
      customerName: name.trim(),
      customerPhone: phone.trim(),
      createdAt: Date.now(),
    };
    setBookings(addBooking(booking));
    setConfirmed(booking);
    setStep(4);
  }

  return (
    <main className="h-full overflow-y-auto bg-cream">
      {/* כותרת */}
      <header className="sticky top-0 z-10 bg-dark text-cream px-5 py-4 shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-3xl">💈</span>
          <div>
            <h1 className="text-lg font-black leading-tight">מספרת השכונה</h1>
            <p className="text-[11px] text-gold">קביעת תור אונליין</p>
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
        {step < 4 && <Stepper step={step} />}

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

        {step === 1 && (
          <BarberPicker
            barbers={BARBERS}
            selected={barberId}
            onSelect={(id) => {
              setBarberId(id);
              setStep(2);
            }}
            onBack={() => setStep(0)}
          />
        )}

        {step === 2 && service && (
          <DateTimePicker
            days={days}
            date={date}
            time={time}
            slots={slots}
            onPickDate={(iso) => {
              setDate(iso);
              setTime(null);
            }}
            onPickTime={(t) => {
              setTime(t);
              setStep(3);
            }}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && service && barber && date && time && (
          <DetailsForm
            service={service}
            barber={barber}
            date={date}
            time={time}
            onConfirm={handleConfirm}
            onBack={() => setStep(2)}
          />
        )}

        {step === 4 && confirmed && service && barber && (
          <Confirmation
            booking={confirmed}
            service={service}
            barber={barber}
            onDone={reset}
          />
        )}
      </div>

      {showAdmin && (
        <AdminPanel
          bookings={bookings}
          onClose={() => setShowAdmin(false)}
          onChange={setBookings}
        />
      )}
    </main>
  );
}
