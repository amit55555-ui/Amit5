import type { Municipality } from '@/types';
import { CHANNEL_META } from '@/types';

interface Props {
  municipality: Municipality;
}

const SUBMIT_LABELS: Record<string, string> = {
  email:    'שלח דיווח במייל',
  whatsapp: 'שלח בוואטסאפ',
  form:     'עבור לטופס העירייה',
  phone:    'הצג מספר לשיחה',
};

export default function ChannelCard({ municipality }: Props) {
  const primary = municipality.channels[0];
  const extras  = municipality.channels.slice(1);
  const meta    = CHANNEL_META[primary.type];

  return (
    <div className={`rounded-xl border p-4 ${meta.bgClass} ${meta.borderClass}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{meta.icon}</span>
        <span className={`font-bold text-sm ${meta.textClass}`}>
          ערוץ הדיווח: {meta.label}
        </span>
      </div>
      <p className={`text-xs ${meta.textClass} opacity-80`}>
        {primary.label}
        {primary.type === 'whatsapp' && ` — ${primary.value}`}
        {primary.type === 'phone'    && ` — ${primary.value}`}
      </p>
      <p className={`mt-2 text-xs font-semibold ${meta.textClass}`}>
        לחצן ה&quot;שלח&quot; בשלב הסיכום יבצע: {SUBMIT_LABELS[primary.type]}
      </p>

      {extras.length > 0 && (
        <div className="mt-3 pt-3 border-t border-current border-opacity-20">
          <p className={`text-xs ${meta.textClass} opacity-70 mb-1`}>ערוצים נוספים:</p>
          <div className="flex flex-wrap gap-1">
            {extras.map((ch, i) => {
              const em = CHANNEL_META[ch.type];
              return (
                <span key={i} className={`text-xs px-2 py-0.5 rounded-full border ${em.bgClass} ${em.textClass} ${em.borderClass}`}>
                  {em.icon} {ch.label}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
