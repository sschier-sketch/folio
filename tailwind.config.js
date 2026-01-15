/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        'app-bg': '#F9FAFB',
        'bg-subtle': '#F3F4F6',
        'card-bg': '#FFFFFF',
        'divider': '#E5E7EB',

        'text-primary': '#111827',
        'text-secondary': '#6B7280',
        'text-tertiary': '#9CA3AF',

        primary: {
          100: '#E6F2FF',
          500: '#008CFF',
          600: '#007AE0',
        },

        success: {
          100: '#DCFCE7',
          500: '#16A34A',
        },

        warning: {
          100: '#FEF3C7',
          500: '#F59E0B',
        },

        error: {
          100: '#FEE2E2',
          500: '#DC2626',
        },

        dark: '#131719',
      },
      fontSize: {
        xs: ['12px', { lineHeight: '1.5' }],
        sm: ['14px', { lineHeight: '1.5' }],
        base: ['15px', { lineHeight: '1.5' }],
        lg: ['18px', { lineHeight: '1.5' }],
        xl: ['20px', { lineHeight: '1.5' }],
        '2xl': ['24px', { lineHeight: '1.4' }],
        '3xl': ['28px', { lineHeight: '1.3' }],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '14px',
      },
      boxShadow: {
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.06)',
      },
      spacing: {
        '4': '4px',
        '8': '8px',
        '12': '12px',
        '16': '16px',
        '24': '24px',
        '32': '32px',
      },
    },
  },
  plugins: [],
};
