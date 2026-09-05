import type { Metadata, Viewport } from 'next';
import { Heebo } from 'next/font/google';
import 'leaflet/dist/leaflet.css';
import './globals.css';

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '500', '600', '700', '900'],
  variable: '--font-heebo',
});

export const metadata: Metadata = {
  title: 'מפת נזילות מים – תל אביב',
  description:
    'מפה ציבורית ואנונימית לדיווח על נזילות וטפטופי מים ברחבי תל אביב-יפו, כולל תמונה ומיקום מדויק.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className="font-heebo bg-cloud text-ink min-h-full">{children}</body>
    </html>
  );
}
