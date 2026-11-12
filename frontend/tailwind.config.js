/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'vx-bg':        '#0B1120',
        'vx-sidebar':   '#101827',
        'vx-card':      '#151F32',
        'vx-secondary': '#1B2940',
        'vx-border':    '#1E3A5F',
        'vx-blue':      '#3B82F6',
        'vx-purple':    '#8B5CF6',
        'vx-text':      '#F8FAFC',
        'vx-muted':     '#94A3B8',
        'vx-success':   '#22C55E',
        'vx-warning':   '#F59E0B',
        'vx-danger':    '#EF4444',
        'vx-critical':  '#7C3AED',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
