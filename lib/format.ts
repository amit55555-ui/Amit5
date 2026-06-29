// ===== עזרי תצוגה =====

import { ReportStatus } from '@/types';

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'הרגע';
  if (m < 60) return `לפני ${m} דק׳`;
  const h = Math.floor(m / 60);
  if (h < 24) return `לפני ${h} שע׳`;
  const d = Math.floor(h / 24);
  if (d < 30) return `לפני ${d} ימים`;
  return new Date(ts).toLocaleDateString('he-IL');
}

export function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const STATUS_STYLE: Record<ReportStatus, { bg: string; text: string; dot: string }> = {
  open: { bg: 'bg-red-50', text: 'text-open', dot: 'bg-open' },
  in_progress: { bg: 'bg-amber-50', text: 'text-progress', dot: 'bg-progress' },
  closed: { bg: 'bg-green-50', text: 'text-closed', dot: 'bg-closed' },
};
