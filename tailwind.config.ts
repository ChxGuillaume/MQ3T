import type { Config } from 'tailwindcss'

export default {
  prefix: 'tw-',
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#650164',
        secondary: '#75E67C',
        accent: '#E675E4'
      }
    }
  },
  safelist: [
    {
      pattern: /bg-.*/
    }
  ],
  plugins: []
} satisfies Config