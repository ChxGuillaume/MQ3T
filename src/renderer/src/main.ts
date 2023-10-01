import { Notify, Quasar } from 'quasar'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'

import '@quasar/extras/fontawesome-v6/fontawesome-v6.css'
import iconSet from 'quasar/icon-set/fontawesome-v6'

import 'quasar/src/css/index.sass'
import './tailwind.css'

const app = createApp(App)

const pinia = createPinia()

Notify.setDefaults({
  position: 'bottom-right',
  timeout: 2500,
  group: false
})

app.use(pinia)
app.use(Quasar, {
  plugins: { Notify },
  iconSet
})

app.mount('#app')
