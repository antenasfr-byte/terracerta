/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary — deep forest / olive green
        forest: {
          50: '#f1f6f0',
          100: '#dde9da',
          200: '#bcd4b6',
          300: '#94b88c',
          400: '#6c9a62',
          500: '#4d7f45',
          600: '#3a6533',
          700: '#2f5129',
          800: '#284122',
          900: '#22361d',
          950: '#101e0c',
        },
        // Secondary — warm earth / terracotta
        terracotta: {
          50: '#fbf6f1',
          100: '#f5e8da',
          200: '#e8cdb0',
          300: '#d9ab80',
          400: '#cb8a55',
          500: '#bf713b',
          600: '#a85a2f',
          700: '#884528',
          800: '#6e3925',
          900: '#5b3122',
          950: '#311811',
        },
        // Accent — sun / wheat
        wheat: {
          50: '#fefbe9',
          100: '#fbf3c4',
          200: '#f8e58c',
          300: '#f4cd4e',
          400: '#efb62a',
          500: '#e29a14',
          600: '#c2780d',
          700: '#9b5710',
          800: '#7e4514',
          900: '#6a3a15',
          950: '#3d1e08',
        },
        // Success
        leaf: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // Warning
        amber2: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // Error
        rust: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        sky2: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Fraunces"', 'Georgia', 'serif'],
      },
      borderRadius: {
        'xl2': '1.25rem',
      },
      boxShadow: {
        soft: '0 2px 8px -2px rgba(40, 65, 34, 0.08), 0 4px 16px -4px rgba(40, 65, 34, 0.06)',
        card: '0 1px 3px rgba(40, 65, 34, 0.06), 0 8px 24px -8px rgba(40, 65, 34, 0.12)',
        lift: '0 4px 12px -2px rgba(40, 65, 34, 0.12), 0 16px 40px -12px rgba(40, 65, 34, 0.18)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.4s ease-out',
        scaleIn: 'scaleIn 0.2s ease-out',
        slideUp: 'slideUp 0.3s ease-out',
        pulseSoft: 'pulseSoft 2s ease-in-out infinite',
        shimmer: 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [],
};
