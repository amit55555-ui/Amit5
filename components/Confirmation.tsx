import { Barber, Booking, Service } from '@/types';
import { formatDateHe } from '@/lib/bookings';

interface Props {
  booking: Booking;
  service: Service;
  barber: Barber;
  onDone: () => void;
}

export default function Confirmation({ booking, service, barber, onDone }: Props) {
  return (
    <section className="text-center pt-6">
      <div className="text-6xl mb-3 animate-bounce">✅</div>
      <h2 className="text-2xl font-black text-dark mb-1">התור נקבע!</h2>
      <p className="text-soft text-sm mb-6">נתראה במספרה, {booking.customerName.split(' ')[0]} 👋</p>

      <div className="bg-white rounded-2xl p-5 border-2 border-gold shadow-lg text-right space-y-2 mb-6">
        <Row label="שירות" value={`${service.emoji} ${service.name}`} />
        <Row label="ספר" value={`${barber.emoji} ${barber.name}`} />
        <Row label="תאריך" value={formatDateHe(booking.date)} />
        <Row label="שעה" value={booking.time} />
        <div className="border-t border-border pt-2 flex justify-between font-black text-orange">
          <span>לתשלום במקום</span>
          <span>₪{service.price}</span>
        </div>
      </div>

      <p className="text-xs text-soft mb-4">
        {booking.customerEmail
          ? 'מייל אישור ותזכורת יישלחו לכתובת שהזנת.'
          : 'נתראה בקרוב!'}
        <br />
        לביטול ניתן להתקשר 03-1234567.
      </p>

      <button
        onClick={onDone}
        className="w-full py-3.5 rounded-xl font-black text-white bg-dark hover:bg-soft transition"
      >
        קביעת תור נוסף
      </button>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-soft">{label}</span>
      <span className="font-semibold text-dark">{value}</span>
    </div>
  );
}
