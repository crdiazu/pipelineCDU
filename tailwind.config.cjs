/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,tsx,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070C1C',
          900: '#0B132B',
          800: '#101D38',
          700: '#17294D',
        },
        cyan: {
          400: '#00B4D8',
          500: '#00A6CE',
          600: '#0077B6',
        },
        editorial: {
          paper: '#F5F1E8',
          surface: '#FFFDF8',
          border: '#DDD4C5',
          ink: '#101725',
          cobalt: '#2A5FFF',
        }
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
};
