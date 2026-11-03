/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./client/index.html', './client/admin.html', './client/src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: v('bg'),
        surface: v('surface'),
        surface2: v('surface2'),
        fg: v('fg'),
        muted: v('muted'),
        line: v('line'),
        brand: { cyan: '#22d3ee', violet: '#8b5cf6', pink: '#f472b6' },
      },
      fontFamily: {
        sans: ['Cairo', 'Inter', 'Tahoma', 'sans-serif'],
        display: ['Orbitron', 'Cairo', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 30px rgba(139, 92, 246, .35)',
        'glow-cyan': '0 0 30px rgba(34, 211, 238, .35)',
      },
    },
  },
  plugins: [],
};
