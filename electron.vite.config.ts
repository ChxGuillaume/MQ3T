import monacoEditorPlugin, { IMonacoEditorOpts } from 'vite-plugin-monaco-editor'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { quasar } from '@quasar/vite-plugin'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

const monacoEditorPluginDefault = (monacoEditorPlugin as any).default as (
  options: IMonacoEditorOpts
) => any

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
      quasar({
        sassVariables: resolve('src/renderer/src/assets/css/quasar-variables.sass')
      }),
      monacoEditorPluginDefault({})
    ]
  }
})
