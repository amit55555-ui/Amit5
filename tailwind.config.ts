import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        rose:      '#c14b7c',
        'deep-rose':'#9c3060',
        blush:     '#fce8f3',
        gold:      '#d4a843',
        'light-gold':'#f5e6b8',
        dark:      '#1a0816',
        cream:     '#fff8fb',
        soft:      '#8a5070',
        border:    '#f5d0e8',
        muted:     '#c090a8',
      },
      fontFamily: {
        heebo: ['var(--font-heebo)', 'sans-serif'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #1a0816 0%, #3d1030 50%, #1a0816 100%)',
        'card-gradient': 'linear-gradient(to top, rgba(26,8,22,0.95) 0%, rgba(26,8,22,0.6) 40%, transparent 70%)',
        'rose-gradient': 'linear-gradient(135deg, #c14b7c, #9c3060)',
        'gold-gradient': 'linear-gradient(135deg, #d4a843, #b8892e)',
      },
    },
  },
  plugins: [],
};
export default config;
