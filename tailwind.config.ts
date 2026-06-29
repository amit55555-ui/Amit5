import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand:       '#0f766e', // teal-700
        'brand-dark':'#115e59',
        'brand-light':'#5eead4',
        ink:         '#0f172a', // slate-900
        muted:       '#64748b', // slate-500
        line:        '#e2e8f0', // slate-200
        cloud:       '#f1f5f9', // slate-100
        // צבעי סטטוס
        open:        '#dc2626', // אדום – פתוח
        progress:    '#d97706', // כתום – בטיפול
        closed:      '#16a34a', // ירוק – סגור
      },
      fontFamily: {
        heebo: ['var(--font-heebo)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
