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
          DEFAULT: '#3c8af7',
          blue: '#3c8af7',
        },
        dark: {
          DEFAULT: '#131719',
        },
        blue: {
          50: '#eef4fe',
          100: '#d4e4fd',
          200: '#a9c9fb',
          300: '#7eaef9',
          400: '#5393f8',
          500: '#3c8af7',
          600: '#3579de',
          700: '#2d6bc8',
          800: '#24569f',
          900: '#1c4177',
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
