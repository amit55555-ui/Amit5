import { Service } from '@/types';

interface Props {
  services: Service[];
  selected: string | null;
  onSelect: (id: string) => void;
}

export default function ServicePicker({ services, selected, onSelect }: Props) {
  return (
    <section>
      <h2 className="text-xl font-black text-dark mb-1">בחר שירות</h2>
      <p className="text-sm text-soft mb-4">מה תרצה לעשות היום?</p>

      <div className="grid grid-cols-1 gap-3">
        {services.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`text-right bg-white rounded-2xl p-4 border-2 transition shadow-sm hover:shadow-md flex items-center gap-4
              ${selected === s.id ? 'border-orange' : 'border-border'}`}
          >
            <span className="text-3xl shrink-0">{s.emoji}</span>
            <div className="flex-1">
              <div className="font-bold text-dark">{s.name}</div>
              <div className="text-xs text-soft">{s.desc}</div>
            </div>
            <div className="text-left shrink-0">
              <div className="font-black text-orange">₪{s.price}</div>
              <div className="text-[11px] text-soft">{s.duration} דק׳</div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
