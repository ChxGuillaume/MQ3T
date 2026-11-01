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
          }
        },
        icon: {
          clientBundle: {
            scan: true
          }
        }
      })
    ]
  }
})
