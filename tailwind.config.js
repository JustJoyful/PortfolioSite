/** @type {import('tailwindcss').Config} */
export default {
  // The default `transition` utility animates filter; our own CSS words trigger its scan.
  blocklist: ['transition'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        line: 'var(--line)',
        text: 'var(--text)',
        'text-muted': 'var(--text-muted)',
        'text-faint': 'var(--text-faint)',
        bloom: 'var(--bloom)',
        'bloom-deep': 'var(--bloom-deep)',
        stem: 'var(--stem)',
        ember: 'var(--ember)',
      },
      fontFamily: {
        display: ['"Clash Grotesk"', '"Clash Grotesk Fallback"', 'Arial', 'sans-serif'],
        sans: ['Geist', '"Geist Fallback"', 'Arial', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        xs: ['12px', { lineHeight: '1.5' }],
        sm: ['14px', { lineHeight: '1.5' }],
        base: ['16px', { lineHeight: '1.5' }],
        lg: ['20px', { lineHeight: '1.5' }],
        xl: ['28px', { lineHeight: '1.5' }],
        '2xl': ['40px', { lineHeight: '1.5' }],
        display: ['clamp(48px, 9vw, 120px)', { lineHeight: '0.95' }],
      },
    },
  },
  plugins: [],
}
