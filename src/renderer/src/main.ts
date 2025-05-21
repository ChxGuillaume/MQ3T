import { Notify, Quasar } from 'quasar'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

import { router } from '@renderer/router'
import './assets/js/init-monaco-editor'
import App from './App.vue'

import '@quasar/extras/fontawesome-v6/fontawesome-v6.css'
import '@quasar/extras/material-icons/material-icons.css'

import '@vue-flow/core/dist/style.css'
import './assets/css/action-chain.scss'

// A few examples for animations from Animate.css:
import '@quasar/extras/animate/fadeOutRight.css'
import '@quasar/extras/animate/fadeInRight.css'
import '@quasar/extras/animate/fadeOut.css'
import '@quasar/extras/animate/fadeIn.css'
import '@quasar/extras/animate/slideOutRight.css'
import '@quasar/extras/animate/slideInRight.css'

import 'quasar/src/css/index.sass'
import './assets/css/fonts.css'
import './tailwind.css'

const app = createApp(App)

const pinia = createPinia()

Notify.setDefaults({
  position: 'bottom-right',
  progress: true,
  timeout: 2500,
  group: false
})

app.use(pinia)
app.use(Quasar, {
  plugins: { Notify }
})

app.use(router)

app.mount('#app')
