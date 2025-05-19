import monacoEditorPlugin, { IMonacoEditorOpts } from 'vite-plugin-monaco-editor'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { quasar } from '@quasar/vite-plugin'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

const monacoEditorPluginDefault = (monacoEditorPlugin as any).default as (
  options: IMonacoEditorOpts
) => any

const monacoEditorPublicPath =
  process.env.NODE_ENV === 'production'
    ? './../../../app.asar.unpacked/resources/monaco-editor'
    : undefined

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
      monacoEditorPluginDefault({
        globalAPI: true,
        publicPath: monacoEditorPublicPath,
        customDistPath: (_: string, __: string, base: string) => {
          return `${base}/resources/monaco-editor`
        }
      })
    ],
    build: {
      rollupOptions: {
        input: {
          main_window: resolve('src/renderer/index.html'),
          graph_window: resolve('src/renderer/graph.html')
        }
      }
    }
  }
})
