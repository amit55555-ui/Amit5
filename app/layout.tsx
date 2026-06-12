import type { Metadata } from 'next';
import { Heebo } from 'next/font/google';
import './globals.css';

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '600', '700', '900'],
  variable: '--font-heebo',
});

export const metadata: Metadata = {
  title: 'Sheli – המוצרים שאני מאהבת',
  description: 'המוצרים הכי שווים שמצאתי – ביוטי, תכשיטים, בית ועוד. החלקי ימינה לרכישה!',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className="font-heebo bg-dark">{children}</body>
    </html>
  );
}
