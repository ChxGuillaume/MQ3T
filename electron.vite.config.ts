import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import ui from '@nuxt/ui/vite'
import { resolve } from 'path'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [
      vue(),
      ui({
        ui: {
          colors: {
            primary: 'plum',
            neutral: 'neutral'
          },
          // Nuxt UI leaves interactive components on the default cursor.
          button: { slots: { base: 'cursor-pointer' } },
          checkbox: { slots: { base: 'cursor-pointer', label: 'cursor-pointer' } },
          switch: { slots: { base: 'cursor-pointer', label: 'cursor-pointer' } },
          select: { slots: { base: 'cursor-pointer', item: 'cursor-pointer' } },
          selectMenu: { slots: { base: 'cursor-pointer', item: 'cursor-pointer' } },
          dropdownMenu: { slots: { item: 'cursor-pointer' } },
          contextMenu: { slots: { item: 'cursor-pointer' } },
          tabs: { slots: { trigger: 'cursor-pointer' } },
          slider: { slots: { thumb: 'cursor-grab active:cursor-grabbing' } }
        },
        icon: {
          clientBundle: {
            scan: {
              globInclude: ['**/*.{vue,ts}']
            }
          }
        }
      })
    ]
  }
})
