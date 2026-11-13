import type { Config } from 'tailwindcss';

const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: v('bg'),
        fg: v('fg'),
        muted: v('muted'),
        line: v('line'),
        surface: v('surface'),
        accent: v('accent'),
        danger: v('danger'),
        ok: v('ok')
      },
      fontFamily: {
        sans: ['"Figtree"', 'ui-sans-serif', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace']
      },
      borderRadius: { xl2: '1.25rem' },
      boxShadow: {
        glass: '0 1px 0 rgb(255 255 255 / 0.5) inset, 0 8px 30px -12px rgb(13 13 20 / 0.18)'
      }
    }
  },
  plugins: []
} satisfies Config;
