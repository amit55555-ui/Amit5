export type ReportingChannel = 'email' | 'whatsapp' | 'form' | 'phone';

export interface ChannelInfo {
  type: ReportingChannel;
  value: string;
  label: string;
}

export interface Municipality {
  id: string;
  name: string;
  district: string;
  channels: ChannelInfo[];
}

export type VehicleType = 'car' | 'motorcycle' | 'truck' | 'trailer' | 'other';
export type DamageLevel = 'none' | 'minor' | 'major' | 'burnt';

export const VEHICLE_LABELS: Record<VehicleType, string> = {
  car:        '🚗 רכב פרטי',
  motorcycle: '🏍️ אופנוע / קטנוע',
  truck:      '🚛 משאית / רכב מסחרי',
  trailer:    '🚐 נגרר / קרוון',
  other:      '🚙 אחר',
};

export const DAMAGE_LABELS: Record<DamageLevel, string> = {
  none:  'ללא נזק נראה לעין',
  minor: 'נזק קל (שריטות / שברים)',
  major: 'נזק חמור (ריסוק / חלקים חסרים)',
  burnt: '🔥 שרוף',
};

export const CHANNEL_META: Record<ReportingChannel, { icon: string; label: string; bgClass: string; textClass: string; borderClass: string }> = {
  email:    { icon: '✉️', label: 'מייל לעירייה',   bgClass: 'bg-blue-50',   textClass: 'text-blue-800',   borderClass: 'border-blue-200'   },
  whatsapp: { icon: '💬', label: 'WhatsApp',        bgClass: 'bg-green-50',  textClass: 'text-green-800',  borderClass: 'border-green-200'  },
  form:     { icon: '📋', label: 'טופס מקוון',     bgClass: 'bg-purple-50', textClass: 'text-purple-800', borderClass: 'border-purple-200' },
  phone:    { icon: '📞', label: 'טלפון / 106',    bgClass: 'bg-slate-50',  textClass: 'text-slate-700',  borderClass: 'border-slate-200'  },
};

export interface VehicleReport {
  municipalityId: string;
  municipalityName: string;
  street: string;
  houseNumber: string;
  neighborhood: string;
  vehicleType: VehicleType;
  licensePlate: string;
  vehicleColor: string;
  firstSeen: string;       // YYYY-MM-DD
  damageLevel: DamageLevel;
  isBlocking: boolean;
  description: string;
  reporterName: string;
  reporterPhone: string;
  reporterEmail: string;
}
