import { createPinia } from 'pinia'
import { createApp } from 'vue'
import ui from '@nuxt/ui/vue-plugin'

import { router } from '@renderer/router'
import './assets/js/init-monaco-editor'
import App from './App.vue'
import { migrateLegacyColorMode } from './composables/useAppColorMode'

import '@vue-flow/core/dist/style.css'
import './assets/css/fonts.css'
import './assets/css/main.css'

migrateLegacyColorMode()

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ui)

app.mount('#app')
