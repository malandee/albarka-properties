import type { Config } from 'tailwindcss';

/**
 * Design tokens. Colours are derived from the Albarka logo. Text colours were checked for
 * WCAG 2.2 AA contrast against their intended backgrounds (see docs/accessibility.md).
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: { center: true, padding: { DEFAULT: '1.25rem', md: '2rem', lg: '2.5rem' } },
    extend: {
      colors: {
        brand: {
          DEFAULT: '#168FC2', // primary blue (decorative, large fills, focus rings)
          deep: '#116B93', // text links, primary buttons (AA with white text)
          charcoal: '#15323B',
          ink: '#10252C',
        },
        neutral: {
          bg: '#F7F8F7',
          alt: '#EEF2F3',
          text: '#23343A',
          muted: '#5E6E76',
          border: '#DCE4E6',
        },
        success: '#247A4A',
        warning: '#A96712',
        danger: '#B42318',
      },
      fontFamily: {
        sans: ['var(--font-manrope)', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      fontSize: {
        display: ['clamp(2.25rem, 1.6rem + 2.6vw, 3.5rem)', { lineHeight: '1.08', letterSpacing: '-0.02em', fontWeight: '700' }],
        page: ['clamp(1.875rem, 1.5rem + 1.4vw, 2.5rem)', { lineHeight: '1.15', letterSpacing: '-0.015em', fontWeight: '700' }],
        section: ['clamp(1.5rem, 1.3rem + 0.8vw, 2rem)', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }],
        card: ['1.125rem', { lineHeight: '1.35', fontWeight: '600' }],
        body: ['1rem', { lineHeight: '1.65' }],
        support: ['0.875rem', { lineHeight: '1.5' }],
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
        md: '8px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 37, 44, 0.06)',
        raised: '0 8px 24px -12px rgba(16, 37, 44, 0.18)',
      },
      maxWidth: {
        content: '1200px',
        prose: '68ch',
      },
      transitionTimingFunction: {
        std: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
