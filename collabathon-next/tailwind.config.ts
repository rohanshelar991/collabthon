import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1C6EF2',
          50: '#EAF1FF',
          100: '#D7E6FF',
          200: '#AFC9FF',
          300: '#88ADFF',
          400: '#5F90FF',
          500: '#1C6EF2',
          600: '#1557C0',
          700: '#0F3F8E',
          800: '#08275C',
          900: '#02102B'
        }
      },
      boxShadow: {
        card: '0 10px 30px rgba(0,0,0,0.08)'
      }
    }
  },
  plugins: [require('@tailwindcss/forms')]
};

export default config;
