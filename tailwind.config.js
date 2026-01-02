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
        gray: {
          50: '#EDEFF7',
          100: '#D3D6E0',
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
