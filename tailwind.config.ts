import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        orange:       '#ff6b35',
        'deep-orange':'#e85d04',
        gold:         '#f9a825',
        dark:         '#1a0a00',
        cream:        '#fff8f0',
        soft:         '#7a4400',
        border:       '#ffd8b0',
      },
      fontFamily: {
        heebo: ['var(--font-heebo)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
