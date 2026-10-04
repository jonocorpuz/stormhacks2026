// Color tokens live as CSS variables in src/index.css; this maps them to Tailwind names.
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;
// Widget accents: solid panel fills only (theme-independent).
const accent = (name) => ({ solid: token(`${name}-solid`) });

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: token('canvas'),
        surface: token('surface'),
        ink: {
          DEFAULT: token('ink'),
          muted: token('ink-muted'),
          subtle: token('ink-subtle'),
        },
        control: {
          DEFAULT: token('control'),
          ink: token('control-ink'),
        },
        sunken: 'var(--sunken)',
        primary: {
          DEFAULT: token('primary'),
          strong: token('primary-strong'),
        },
        danger: {
          DEFAULT: token('danger'),
          strong: token('danger-strong'),
        },
        warning: token('warning'),
        accent: {
          blue: accent('blue'),
          green: accent('green'),
          coral: accent('coral'),
          pink: accent('pink'),
          grey: accent('grey'),
        },
        shell: {
          DEFAULT: token('shell'),
          control: token('shell-control'),
          'control-ink': token('shell-control-ink'),
        },
        'map-paper': token('map-paper'),
        code: {
          bg: token('code-bg'),
          ink: token('code-ink'),
        },
      },
      borderRadius: {
        card: '2rem',
        sheet: '1.5rem',
      },
      fontFamily: {
        sans: ['"Alte Haas Grotesk"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
