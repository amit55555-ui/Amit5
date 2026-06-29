import type { Metadata } from 'next';
import { Heebo } from 'next/font/google';
import './globals.css';

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '500', '600', '700', '900'],
  variable: '--font-heebo',
});

export const metadata: Metadata = {
  title: 'ניהול בניין – דיווח תקלות',
  description:
    'מערכת לדיירי הבניין לדיווח תקלות (נורה שרופה, אשפה ועוד), מעקב אחר הפניות והסטטוס שלהן, ותקשורת עם ועד הבית.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className="font-heebo bg-cloud text-ink min-h-full">{children}</body>
    </html>
  );
}
