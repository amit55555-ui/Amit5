import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'שעון נוכחות',
  description: 'דיווח שעות עבודה לעובדים ודוחות נוכחות ושכר למנהל',
  icons: { apple: '/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'שעון נוכחות', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#EDF0F3' },
    { media: '(prefers-color-scheme: dark)', color: '#0E141A' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Rubik:wght@500;700&family=Assistant:wght@400;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
