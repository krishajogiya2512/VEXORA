/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Surfaces ──────────────────────────────────────────────
        'vx-bg':        '#0A0A0B',   // page background  (near-black)
        'vx-sidebar':   '#0D0D0F',   // sidebar surface
        'vx-card':      '#111113',   // card surface
        'vx-secondary': '#161618',   // secondary surface / hover
        'vx-elevated':  '#1C1C1F',   // elevated surface (modals, dropdowns)
        'vx-border':    '#202024',   // default border (~7% white)
        'vx-border-s':  '#2C2C33',   // stronger border (~12% white)

        // ── Signature accent ──────────────────────────────────────
        'vx-accent':    '#FF4D1F',   // orange – primary interactive accent
        'vx-accent-d':  '#D93A12',   // orange dark (hover / active)
        'vx-accent-s':  'rgba(255, 77, 31, 0.12)', // orange subtle bg (12% alpha)

        // ── Text ──────────────────────────────────────────────────
        'vx-text':      '#F0F0F5',   // primary text
        'vx-sub':       '#A0A0B0',   // secondary text
        'vx-muted':     '#666673',   // muted / placeholder
        'vx-invert':    '#FFFFFF',   // text on accent (white on orange)

        // ── Risk semantics (never use accent for risk) ─────────────
        'vx-low':       '#22C55E',
        'vx-medium':    '#EAB308',
        'vx-high':      '#EF4444',
        'vx-critical':  '#A855F7',

        // ── Status / utility ──────────────────────────────────────
        'vx-success':   '#22C55E',
        'vx-warning':   '#EAB308',
        'vx-danger':    '#EF4444',

        // ── Backward-compat aliases (remove after full migration) ──
        'vx-blue':      '#FF4D1F',   // → maps to accent orange
        'vx-purple':    '#A855F7',   // → maps to critical violet
        'vx-sidebar':   '#0D0D0F',   // → maps to new sidebar surface
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        'card':    '0 1px 3px 0 rgba(0,0,0,0.5), 0 1px 2px -1px rgba(0,0,0,0.5)',
        'card-lg': '0 4px 20px 0 rgba(0,0,0,0.6)',
        'accent':  '0 0 20px rgba(255,77,31,0.25)',
        'inset':   'inset 0 1px 0 rgba(255,255,255,0.04)',
      },
      backgroundImage: {
        'gradient-radial':  'radial-gradient(var(--tw-gradient-stops))',
        'accent-glow':      'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255,77,31,0.12) 0%, transparent 70%)',
        'accent-gradient':  'linear-gradient(135deg, #FF4D1F 0%, #D93A12 100%)',
        'card-shine':       'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 50%)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
        'pulse-accent': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(255,77,31,0.3)' },
          '50%':       { boxShadow: '0 0 24px rgba(255,77,31,0.7)' },
        },
      },
      animation: {
        'fade-in':     'fade-in 0.25s ease-out both',
        'slide-in':    'slide-in 0.25s ease-out both',
        'shimmer':     'shimmer 2s linear infinite',
        'pulse-accent':'pulse-accent 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
