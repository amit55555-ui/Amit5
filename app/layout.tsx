import type { Metadata } from 'next';
import { Heebo } from 'next/font/google';
import './globals.css';

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '600', '700', '900'],
  variable: '--font-heebo',
});

export const metadata: Metadata = {
  title: 'שוק הטעמים – מוצרי אוכל ומטבח מאלי אקספרס',
  description: 'גלה מוצרי אוכל ומטבח מומלצים מאלי אקספרס – החלק ימינה לקנייה, שמאלה לדילוג',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className="font-heebo bg-cream">{children}</body>
    </html>
  );
}
