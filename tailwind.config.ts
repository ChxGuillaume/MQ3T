import type { Config } from 'tailwindcss'

export default {
  prefix: 'tw-',
  darkMode: ['class', '[class~="body--dark"]'],
  content: ['./src/renderer/index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        '3xl': '1920px'
      },
      colors: {
        primary: '#650164',
        secondary: '#75E67C',
        accent: '#E675E4',
        tertiary: '#f0ad4e'
      }
    }
  },
  safelist: [
    {
      pattern: /bg-.*/
    }
  ],
  important: true,
  plugins: []
} satisfies Config
