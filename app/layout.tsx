import type { Metadata } from 'next';
import { Heebo } from 'next/font/google';
import './globals.css';

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '600', '700', '900'],
  variable: '--font-heebo',
});

const SITE_URL = 'https://amit5.pages.dev';
const TITLE = 'שוק הטעמים – מוצרים מנצחים מאלי אקספרס';
const DESCRIPTION = 'גלה אלפי מוצרים מומלצים במחירי מבצע – החלק ימינה לקנייה, שמאלה לדילוג. פשוט, מהיר וכיף.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    type: 'website',
    locale: 'he_IL',
    url: SITE_URL,
    siteName: 'שוק הטעמים',
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'שוק הטעמים' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className="font-heebo bg-cream">{children}</body>
    </html>
  );
}
