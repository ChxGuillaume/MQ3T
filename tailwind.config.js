/** @type {import('tailwindcss').Config} */
export default {
  prefix: 'tw-',
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#650164',
        secondary: '#14B342'
      }
    }
  },
  safelist: [
    {
      pattern: /bg-.*/
    }
  ],
  plugins: []
}
