import type { MetadataRoute } from 'next';

// מאפשר "הוספה למסך הבית" עם הלוגו, כך שהאתר נפתח כמו אפליקציה
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'שעון נוכחות',
    short_name: 'נוכחות',
    start_url: '/',
    display: 'standalone',
    dir: 'rtl',
    lang: 'he',
    background_color: '#EDF0F3',
    theme_color: '#FAB732',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
