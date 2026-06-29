import { useState } from 'react';
import { Barber, Service } from '@/types';
import { formatDateHe } from '@/lib/bookings';

interface Props {
  service: Service;
  barber: Barber;
  date: string;
  time: string;
  submitting?: boolean;
  onConfirm: (name: string, phone: string, email: string) => void;
  onBack: () => void;
}

export default function DetailsForm({ service, barber, date, time, submitting, onConfirm, onBack }: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const phoneOk = /^0\d{1,2}-?\d{7}$/.test(phone.replace(/\s/g, ''));
  const emailOk = email.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const valid = name.trim().length >= 2 && phoneOk && emailOk;

  return (
    <section>
      <button onClick={onBack} className="text-sm text-soft mb-3 hover:text-orange transition">
        ← חזרה
      </button>
      <h2 className="text-xl font-black text-dark mb-4">הפרטים שלך</h2>

      {/* סיכום ההזמנה */}
      <div className="bg-white rounded-2xl p-4 border-2 border-border mb-5 space-y-1.5 text-sm">
        <Row label="שירות" value={`${service.emoji} ${service.name}`} />
        <Row label="ספר" value={`${barber.emoji} ${barber.name}`} />
        <Row label="מועד" value={`${formatDateHe(date)} · ${time}`} />
        <div className="border-t border-border pt-1.5 flex justify-between font-black text-orange">
          <span>סה״כ</span>
          <span>₪{service.price} · {service.duration} דק׳</span>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-soft block mb-1">שם מלא</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ישראל ישראלי"
            className="w-full rounded-xl border-2 border-border bg-white px-4 py-3 text-dark outline-none focus:border-orange transition"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-soft block mb-1">טלפון נייד</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="050-1234567"
            inputMode="tel"
            dir="ltr"
            className="w-full rounded-xl border-2 border-border bg-white px-4 py-3 text-dark outline-none focus:border-orange transition text-right"
          />
          {phone.length > 0 && !phoneOk && (
            <p className="text-[11px] text-red-500 mt-1">מספר טלפון לא תקין</p>
          )}
        </div>
        <div>
          <label className="text-xs font-semibold text-soft block mb-1">
            אימייל <span className="font-normal">(לאישור ותזכורת – לא חובה)</span>
          </label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            inputMode="email"
            dir="ltr"
            className="w-full rounded-xl border-2 border-border bg-white px-4 py-3 text-dark outline-none focus:border-orange transition text-right"
          />
          {!emailOk && <p className="text-[11px] text-red-500 mt-1">כתובת אימייל לא תקינה</p>}
        </div>
      </div>

      <button
        disabled={!valid || submitting}
        onClick={() => onConfirm(name, phone, email)}
        className={`w-full mt-6 py-3.5 rounded-xl font-black text-white transition
          ${valid && !submitting ? 'bg-orange hover:bg-deep-orange shadow-lg' : 'bg-border cursor-not-allowed'}`}
      >
        {submitting ? 'קובע תור…' : 'אישור וקביעת התור 💈'}
      </button>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-soft">{label}</span>
      <span className="font-semibold text-dark">{value}</span>
    </div>
  );
}
