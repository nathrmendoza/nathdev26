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
      // Values are the --fs-* custom properties defined in globals.css (the
      // clamp() math lives there, once). These give you text-h1..text-small
      // utilities for when something needs heading-scale sizing without
      // being a literal <h1>..<h6> tag; pair with font-display/uppercase/etc
      // yourself since this only carries size + line-height.
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
      // Duration is overridden per-instance via inline style (see
      // Marquee.tsx); this just registers the keyframes and a default.
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        // Page-transition entrance for whatever's in the viewport on load --
        // see the `key={router.asPath}` wrapper in _app.tsx.
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        marquee: 'marquee 60s linear infinite',
        'fade-in': 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
};
