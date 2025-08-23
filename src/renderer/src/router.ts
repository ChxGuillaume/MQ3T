import { createRouter, createWebHashHistory } from 'vue-router'

import MainView from '@renderer/routes/MainView.vue'
import GraphView from '@renderer/routes/GraphView.vue'

const routes = [
  { path: '/', component: MainView, meta: { title: 'MQ3T' } },
  { path: '/graph', component: GraphView, meta: { title: 'MQ3T Graph' } }
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, _, next) => {
  document.title = (to.meta['title'] as string) || 'MQ3T'

  next()
})
