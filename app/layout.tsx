import type { Metadata } from 'next';
import { Heebo } from 'next/font/google';
import './globals.css';

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '600', '700', '900'],
  variable: '--font-heebo',
});

const SITE_URL = 'https://metzion.co.il';
const TITLE = 'מציאון – כל השלל של אלי אקספרס במקום אחד';
const DESCRIPTION = 'גלה אלפי מוצרים מומלצים במחירי מבצע – החלק ימינה לקנייה, שמאלה לדילוג. פשוט, מהיר וכיף.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: 'מציאון',
  keywords: ['מציאון', 'אלי אקספרס', 'aliexpress', 'מבצעים', 'מציאות', 'קניות אונליין', 'מוצרים זולים', 'גאדטים', 'עסקאות'],
  icons: { icon: '/logo.svg', apple: '/logo.svg' },
  alternates: { canonical: '/' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  openGraph: {
    type: 'website',
    locale: 'he_IL',
    url: SITE_URL,
    siteName: 'מציאון',
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'מציאון' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/og.png'],
  },
};

// Structured data so Google understands the brand and can show a rich result.
const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'מציאון',
  alternateName: 'Metzion',
  url: SITE_URL,
  inLanguage: 'he',
  description: DESCRIPTION,
  publisher: {
    '@type': 'Organization',
    name: 'מציאון',
    url: SITE_URL,
    logo: `${SITE_URL}/og.png`,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
      </head>
      <body className="font-heebo bg-cream">{children}</body>
    </html>
  );
}
