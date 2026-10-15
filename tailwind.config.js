/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        ground: '#0D0F10',
        ink: '#D9DCD6',
        'ink-dim': '#B4B9AF',
        'ink-faint': '#9CA199',
        accent: '#6FD3C4',
        warn: '#D98C6A',
        line: 'rgba(255,255,255,0.24)',
        'line-lit': 'rgba(255,255,255,0.4)',
        panel: 'rgba(10,12,13,0.82)',
      },
      fontFamily: {
        sans: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        display: ['var(--font-display)', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      // From the --fs-* variables in globals.css.
      fontSize: {
        h1: ['var(--fs-h1)', { lineHeight: '0.95' }],
        h2: ['var(--fs-h2)', { lineHeight: '1' }],
        h3: ['var(--fs-h3)', { lineHeight: '1.1' }],
        h4: ['var(--fs-h4)', { lineHeight: '1.3' }],
        h5: ['var(--fs-h5)', { lineHeight: '1.4' }],
        h6: ['var(--fs-h6)', { lineHeight: '1.4' }],
        body: ['var(--fs-body)', { lineHeight: '1.65' }],
        small: ['var(--fs-small)', { lineHeight: '1.5' }],
      },
      // Marquee overrides the duration per instance.
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(6px)' },
        },
        // Header logo hover wave, staggered per letter.
        hop: {
          '0%, 100%': { transform: 'translateY(0)' },
          '30%': { transform: 'translateY(-0.18em)' },
          '55%': { transform: 'translateY(0)' },
          '72%': { transform: 'translateY(-0.04em)' },
        },
      },
      animation: {
        marquee: 'marquee 60s linear infinite',
        'bounce-soft': 'bounceSoft 2.2s ease-in-out infinite',
        hop: 'hop 0.5s cubic-bezier(0.33, 1, 0.68, 1) both',
      },
    },
  },
};
