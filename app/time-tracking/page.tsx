import type { Metadata } from 'next';
import TimeTrackingApp from '@/components/TimeTrackingApp';

export const metadata: Metadata = {
  title: 'שעון נוכחות',
  description: 'מעקב שעות עבודה עם כניסה/יציאה, דוחות יומיים וחודשיים, וגישת מנהל לעריכה ידנית של שעות.',
};

export default function TimeTrackingPage() {
  return <TimeTrackingApp />;
}
