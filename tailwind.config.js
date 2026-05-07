/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'glass': 'rgba(20, 20, 20, 0.45)',
        'glass-border': 'rgba(255, 255, 255, 0.08)',
        'accent-pink': '#e9b',
        'accent-red': '#c77',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'sans-serif'],
        cursive: ['Dancing Script', 'cursive'],
        mono: ['Courier New', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 1s ease-out forwards',
        'slide-up': 'slideUp 0.8s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
