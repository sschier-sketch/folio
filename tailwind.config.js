/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#008CFF',
          blue: '#008CFF',
        },
        dark: {
          DEFAULT: '#131719',
        },
        blue: {
          50: '#E6F4FF',
          100: '#CCE9FF',
          200: '#99D6FF',
          300: '#66C2FF',
          400: '#33AFFF',
          500: '#008CFF',
          600: '#008CFF',
          700: '#0073CC',
          800: '#005999',
          900: '#004D80',
        },
        gray: {
          50: '#faf8f8',
          100: '#f0eded',
          200: '#BCBFCC',
          300: '#9DA2B3',
          400: '#6E7180',
          500: '#40424D',
          600: '#1E1E24',
          700: '#131719',
          800: '#000000',
        },
      },
      fontSize: {
        'h1': '64px',
        'h2': '48px',
        'subheader1': '32px',
        'subheader2': '24px',
        'paragraph1': '18px',
        'paragraph2': '16px',
      },
    },
  },
  plugins: [],
};
