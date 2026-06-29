import { Barber } from '@/types';

interface Props {
  barbers: Barber[];
  selected: string | null;
  onSelect: (id: string) => void;
  onBack: () => void;
}

export default function BarberPicker({ barbers, selected, onSelect, onBack }: Props) {
  return (
    <section>
      <button onClick={onBack} className="text-sm text-soft mb-3 hover:text-orange transition">
        ← חזרה
      </button>
      <h2 className="text-xl font-black text-dark mb-1">בחר ספר</h2>
      <p className="text-sm text-soft mb-4">אצל מי תרצה להסתפר?</p>

      <div className="grid grid-cols-3 gap-3">
        {barbers.map((b) => (
          <button
            key={b.id}
            onClick={() => onSelect(b.id)}
            className={`bg-white rounded-2xl p-4 border-2 transition shadow-sm hover:shadow-md flex flex-col items-center gap-1
              ${selected === b.id ? 'border-orange' : 'border-border'}`}
          >
            <span className="text-4xl">{b.emoji}</span>
            <div className="font-bold text-dark text-sm">{b.name}</div>
            <div className="text-[10px] text-soft text-center">{b.title}</div>
          </button>
        ))}
      </div>
    </section>
  );
}
