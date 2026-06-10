'use client';

import { useState } from 'react';
import CitySelector from '@/components/CitySelector';
import ChannelCard  from '@/components/ChannelCard';
import { MUNICIPALITIES, getMunicipalityById } from '@/data/municipalities';
import {
  VEHICLE_LABELS, DAMAGE_LABELS, CHANNEL_META,
  type VehicleType, type DamageLevel, type VehicleReport,
} from '@/types';

// ── helpers ────────────────────────────────────────────────────────────────

function daysSince(dateStr: string): number {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildWAMessage(report: VehicleReport): string {
  const days = daysSince(report.firstSeen);
  const lines = [
    `*דיווח רכב נטוש – ${report.municipalityName}*`,
    '',
    `📍 *כתובת:* ${report.street} ${report.houseNumber}${report.neighborhood ? ` — ${report.neighborhood}` : ''}`,
    `🚗 *סוג:* ${VEHICLE_LABELS[report.vehicleType]}`,
    report.vehicleColor  ? `🎨 *צבע:* ${report.vehicleColor}`          : null,
    report.licensePlate  ? `🔑 *לוחית:* ${report.licensePlate}`         : null,
    `📅 *נראה מ:* ${new Date(report.firstSeen).toLocaleDateString('he-IL')} (${days} ימים)`,
    days >= 60           ? `⏳ *משך: ${days} ימים — עשוי להיות זכאי לגרוטה*` : null,
    `⚠️ *מצב:* ${DAMAGE_LABELS[report.damageLevel]}`,
    `🚧 *חוסם מעבר:* ${report.isBlocking ? 'כן' : 'לא'}`,
    report.description   ? `💬 *הערות:* ${report.description}`          : null,
    '',
    report.reporterName  ? `👤 *מדווח:* ${report.reporterName}`         : null,
    report.reporterPhone ? `📞 ${report.reporterPhone}`                  : null,
  ].filter(Boolean).join('\n');

  return encodeURIComponent(lines);
}

// ── types ──────────────────────────────────────────────────────────────────

type FormData = Omit<VehicleReport, 'vehicleType' | 'damageLevel'> & {
  vehicleType: VehicleType | '';
  damageLevel: DamageLevel | '';
};

type SubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'done'; channel: string }
  | { status: 'error'; message: string };

const EMPTY: FormData = {
  municipalityId: '', municipalityName: '',
  street: '', houseNumber: '', neighborhood: '',
  vehicleType: '', licensePlate: '', vehicleColor: '',
  firstSeen: '', damageLevel: '', isBlocking: false, description: '',
  reporterName: '', reporterPhone: '', reporterEmail: '',
};

// ── sub-components ─────────────────────────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-semibold text-slate-700 mb-1">
      {children} {required && <span className="text-red-500">*</span>}
    </label>
  );
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full border border-slate-300 rounded-xl px-4 py-3 text-right bg-white
        focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
        placeholder:text-slate-400 text-slate-900 ${props.className ?? ''}`}
    />
  );
}

function StepBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-1 justify-center">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all duration-300
            ${i < step ? 'bg-blue-600 w-8' : i === step ? 'bg-blue-600 w-10' : 'bg-slate-300 w-6'}`}
        />
      ))}
    </div>
  );
}

// ── main page ──────────────────────────────────────────────────────────────

export default function HomePage() {
  const [step, setStep]       = useState(0);
  const [form, setForm]       = useState<FormData>(EMPTY);
  const [submit, setSubmit]   = useState<SubmitState>({ status: 'idle' });

  const set = (k: keyof FormData, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const municipality = getMunicipalityById(form.municipalityId);
  const channel      = municipality?.channels[0];
  const days         = daysSince(form.firstSeen);
  const is60Days     = days >= 60;

  // ── validation per step ────────────────────────────────────────────────
  const step0Valid = !!form.municipalityId && form.street.trim().length > 1;
  const step1Valid = !!form.vehicleType && !!form.firstSeen && !!form.damageLevel;
  const canNext    = step === 0 ? step0Valid : step === 1 ? step1Valid : true;

  // ── submit logic ───────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!channel || !municipality) return;
    const report = form as VehicleReport;

    if (channel.type === 'email') {
      setSubmit({ status: 'submitting' });
      try {
        const res = await fetch('/api/report', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ report }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'שגיאה לא ידועה');
        setSubmit({ status: 'done', channel: 'email' });
      } catch (err) {
        setSubmit({ status: 'error', message: (err as Error).message });
      }
      return;
    }

    if (channel.type === 'whatsapp') {
      const msg = buildWAMessage(report);
      const num = channel.value.replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${num}?text=${msg}`, '_blank');
      setSubmit({ status: 'done', channel: 'whatsapp' });
      return;
    }

    if (channel.type === 'form') {
      window.open(channel.value, '_blank');
      setSubmit({ status: 'done', channel: 'form' });
      return;
    }

    // phone
    setSubmit({ status: 'done', channel: 'phone' });
  };

  // ── success screen ─────────────────────────────────────────────────────
  if (submit.status === 'done') {
    const meta = channel ? CHANNEL_META[channel.type] : null;
    const messages: Record<string, string> = {
      email:    'הדיווח נשלח לעירייה במייל. תשובה תגיע בדרך כלל תוך 2–5 ימי עסקים.',
      whatsapp: 'הדיווח הוכן ונשלח לוואטסאפ של העירייה. שמור את השיחה לעיון עתידי.',
      form:     'הועברת לטופס המקוון של העירייה. מלא את הפרטים ולחץ שלח.',
      phone:    `התקשר ל-${channel?.value ?? '106'} ותדווח בע"פ על הרכב.`,
    };

    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">הדיווח הושלם!</h2>
          {meta && (
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold mb-4 ${meta.bgClass} ${meta.textClass} border ${meta.borderClass}`}>
              {meta.icon} {meta.label}
            </div>
          )}
          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            {messages[submit.channel] ?? ''}
          </p>
          <button
            onClick={() => { setForm(EMPTY); setStep(0); setSubmit({ status: 'idle' }); }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors"
          >
            דיווח נוסף
          </button>
        </div>
      </main>
    );
  }

  // ── step content ───────────────────────────────────────────────────────
  const STEP_TITLES = ['מיקום הרכב', 'פרטי הרכב', 'פרטייך', 'סיכום ושליחה'];

  return (
    <main className="min-h-screen bg-slate-50">
      {/* header */}
      <header className="bg-blue-700 text-white sticky top-0 z-10 shadow-md">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <span className="text-2xl">🚗</span>
          <div>
            <h1 className="font-black text-lg leading-none">דיווח רכב נטוש</h1>
            <p className="text-blue-200 text-xs mt-0.5">שלב {step + 1} מתוך 4 — {STEP_TITLES[step]}</p>
          </div>
        </div>
        <div className="max-w-lg mx-auto px-4 pb-3">
          <StepBar step={step} total={4} />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* ── STEP 0: Location ─────────────────────────────────────────── */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
              <div>
                <Label required>עיר / יישוב</Label>
                <CitySelector
                  value={form.municipalityId}
                  onChange={(id, name) => { set('municipalityId', id); set('municipalityName', name); }}
                />
              </div>

              {municipality && (
                <ChannelCard municipality={municipality} />
              )}

              <div>
                <Label required>רחוב</Label>
                <Input
                  value={form.street}
                  onChange={e => set('street', e.target.value)}
                  placeholder="שם הרחוב"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>מספר בית</Label>
                  <Input
                    value={form.houseNumber}
                    onChange={e => set('houseNumber', e.target.value)}
                    placeholder="מס׳"
                  />
                </div>
                <div>
                  <Label>שכונה / ציון דרך</Label>
                  <Input
                    value={form.neighborhood}
                    onChange={e => set('neighborhood', e.target.value)}
                    placeholder="אופציונלי"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 1: Vehicle ──────────────────────────────────────────── */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
            {/* Vehicle type */}
            <div>
              <Label required>סוג הרכב</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {(Object.entries(VEHICLE_LABELS) as [VehicleType, string][]).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => set('vehicleType', k)}
                    className={`px-3 py-3 rounded-xl border text-sm font-semibold text-right transition-all
                      ${form.vehicleType === k
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* First seen */}
            <div>
              <Label required>מתי ראית את הרכב לראשונה?</Label>
              <Input
                type="date"
                value={form.firstSeen}
                max={todayStr()}
                onChange={e => set('firstSeen', e.target.value)}
                className="text-left"
              />
              {is60Days && (
                <div className="mt-2 bg-amber-50 border border-amber-300 rounded-xl p-3 text-sm text-amber-800">
                  ⏳ <strong>הרכב נמצא כבר {days} ימים</strong> — רכב שנטוש מעל 60 ימים עשוי להיות מוגדר כגרוטה
                  ולהירשם לסילוק על-ידי הרשות המקומית. ציין זאת בשיחה עם העירייה.
                </div>
              )}
            </div>

            {/* Damage level */}
            <div>
              <Label required>מצב הרכב</Label>
              <div className="space-y-2 mt-1">
                {(Object.entries(DAMAGE_LABELS) as [DamageLevel, string][]).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => set('damageLevel', k)}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium text-right transition-all
                      ${form.damageLevel === k
                        ? k === 'burnt'
                          ? 'bg-red-600 border-red-600 text-white'
                          : 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>לוחית רישוי</Label>
                <Input
                  value={form.licensePlate}
                  onChange={e => set('licensePlate', e.target.value.toUpperCase())}
                  placeholder="אופציונלי"
                  maxLength={10}
                />
              </div>
              <div>
                <Label>צבע</Label>
                <Input
                  value={form.vehicleColor}
                  onChange={e => set('vehicleColor', e.target.value)}
                  placeholder="אופציונלי"
                />
              </div>
            </div>

            {/* Blocking */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isBlocking}
                onChange={e => set('isBlocking', e.target.checked)}
                className="w-5 h-5 rounded accent-blue-600"
              />
              <span className="text-sm font-semibold text-slate-700">הרכב חוסם מעבר / חניה</span>
            </label>

            {/* Description */}
            <div>
              <Label>הערות נוספות</Label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="פירוט נוסף על מיקום, זמן שהייה, סימנים מיוחדים…"
                rows={3}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-right bg-white
                  focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-slate-400
                  text-slate-900 resize-none"
              />
            </div>
          </div>
        )}

        {/* ── STEP 2: Contact ──────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800">
              💡 <strong>אופציונלי לחלוטין.</strong> פרטייך לא יועברו לגורם שלישי.
              הם ישמשו רק לצורך מעקב ועדכון ממך בעניין הדיווח.
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
              <div>
                <Label>שם</Label>
                <Input
                  value={form.reporterName}
                  onChange={e => set('reporterName', e.target.value)}
                  placeholder="שמך המלא"
                />
              </div>
              <div>
                <Label>טלפון</Label>
                <Input
                  type="tel"
                  value={form.reporterPhone}
                  onChange={e => set('reporterPhone', e.target.value)}
                  placeholder="05X-XXXXXXX"
                  dir="ltr"
                />
              </div>
              <div>
                <Label>מייל</Label>
                <Input
                  type="email"
                  value={form.reporterEmail}
                  onChange={e => set('reporterEmail', e.target.value)}
                  placeholder="your@email.com"
                  dir="ltr"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: Review ───────────────────────────────────────────── */}
        {step === 3 && municipality && channel && (
          <div className="space-y-4">
            {/* Channel badge */}
            <ChannelCard municipality={municipality} />

            {/* Summary card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-100">
              <Row label="עיר"     value={form.municipalityName} />
              <Row label="כתובת"   value={`${form.street} ${form.houseNumber} ${form.neighborhood}`.trim()} />
              <Row label="סוג"     value={VEHICLE_LABELS[form.vehicleType as VehicleType] ?? ''} />
              {form.vehicleColor  && <Row label="צבע"     value={form.vehicleColor} />}
              {form.licensePlate  && <Row label="לוחית"   value={form.licensePlate} />}
              <Row label="נראה מ"  value={`${new Date(form.firstSeen).toLocaleDateString('he-IL')} (${days} ימים)`} />
              <Row label="מצב"     value={DAMAGE_LABELS[form.damageLevel as DamageLevel] ?? ''} />
              <Row label="חוסם"    value={form.isBlocking ? 'כן' : 'לא'} />
              {form.description   && <Row label="הערות"   value={form.description} />}
              {form.reporterName  && <Row label="מדווח"   value={form.reporterName} />}
              {form.reporterPhone && <Row label="טלפון"   value={form.reporterPhone} />}
              {form.reporterEmail && <Row label="מייל"    value={form.reporterEmail} />}
            </div>

            {is60Days && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-sm text-amber-800">
                ⏳ <strong>הרכב נטוש {days} ימים</strong> — ציין זאת בשיחה עם נציג העירייה כדי לקדם
                הליך סילוק כגרוטה.
              </div>
            )}

            {submit.status === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
                ❌ {submit.message}
              </div>
            )}

            {/* Submit button */}
            <SubmitButton
              channel={channel.type}
              phone={channel.value}
              loading={submit.status === 'submitting'}
              onSubmit={handleSubmit}
            />
          </div>
        )}

        {/* ── navigation ───────────────────────────────────────────────── */}
        {step < 3 && (
          <div className="flex gap-3 pt-2">
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl transition-colors"
              >
                ← הקודם
              </button>
            )}
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext}
              className={`flex-1 font-bold py-3 rounded-xl transition-colors
                ${canNext
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
            >
              {step === 2 ? 'לסיכום →' : 'הבא →'}
            </button>
          </div>
        )}

        {step === 3 && (
          <button
            onClick={() => setStep(2)}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl transition-colors"
          >
            ← חזרה לעריכה
          </button>
        )}

      </div>
    </main>
  );
}

// ── helpers ──────────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 px-4 py-2.5 text-sm">
      <span className="text-slate-400 w-16 shrink-0">{label}</span>
      <span className="text-slate-800 font-medium flex-1 break-words">{value}</span>
    </div>
  );
}

const SUBMIT_BTN: Record<string, { label: string; cls: string }> = {
  email:    { label: '✉️  שלח דיווח במייל',       cls: 'bg-blue-600   hover:bg-blue-700'   },
  whatsapp: { label: '💬  שלח בוואטסאפ',           cls: 'bg-green-600  hover:bg-green-700'  },
  form:     { label: '📋  עבור לטופס המקוון',      cls: 'bg-purple-600 hover:bg-purple-700' },
  phone:    { label: '📞  הצג מספר לשיחה',         cls: 'bg-slate-600  hover:bg-slate-700'  },
};

function SubmitButton({
  channel, phone, loading, onSubmit,
}: {
  channel: string; phone: string; loading: boolean; onSubmit: () => void;
}) {
  const btn = SUBMIT_BTN[channel] ?? SUBMIT_BTN.phone;
  return (
    <button
      onClick={onSubmit}
      disabled={loading}
      className={`w-full text-white font-bold py-4 rounded-xl transition-colors text-base
        ${loading ? 'bg-slate-400 cursor-not-allowed' : btn.cls}`}
    >
      {loading ? '⏳ שולח…' : btn.label}
    </button>
  );
}
