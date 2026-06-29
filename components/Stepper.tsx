const STEPS = ['שירות', 'ספר', 'מועד', 'פרטים'];

export default function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-between mb-5 px-1">
      {STEPS.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition
                  ${active ? 'bg-orange text-white scale-110 shadow' : ''}
                  ${done ? 'bg-gold text-dark' : ''}
                  ${!active && !done ? 'bg-border text-soft' : ''}`}
              >
                {done ? '✓' : i + 1}
              </div>
              <span className={`text-[10px] ${active ? 'text-orange font-bold' : 'text-soft'}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 rounded ${done ? 'bg-gold' : 'bg-border'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
