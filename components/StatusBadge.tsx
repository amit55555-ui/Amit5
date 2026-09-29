import { LeakStatus, STATUS_LABELS } from '@/types';

// תגית סטטוס – צבע + אייקון + טקסט (לא מסתמכים על צבע בלבד)
export const STATUS_ICONS: Record<LeakStatus, string> = {
  open: '💧',
  in_progress: '🛠️',
  resolved: '✅',
};

const STYLES: Record<LeakStatus, string> = {
  open: 'bg-red-50 text-red-700 border-red-200',
  in_progress: 'bg-amber-50 text-amber-800 border-amber-200',
  resolved: 'bg-green-50 text-green-700 border-green-200',
};

export default function StatusBadge({ status }: { status: LeakStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${STYLES[status]}`}
    >
      <span aria-hidden>{STATUS_ICONS[status]}</span>
      {STATUS_LABELS[status]}
    </span>
  );
}
