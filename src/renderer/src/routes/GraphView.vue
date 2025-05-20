<script setup lang="ts">
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import { useDataGraphsStore } from '@renderer/store/data-graphs'
import GraphList from '../components/tap-topics/GraphList.vue'
import { ElectronApi } from '../assets/js/electron-api'
import { onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()

const mqttTopicsStore = useMqttTopicsStore()
const dataGraphStore = useDataGraphsStore()

watch(
  () => $q.dark.isActive,
  (value) => {
    const classDark = 'dark'

    if (value) document.documentElement.classList.add(classDark)
    else document.documentElement.classList.remove(classDark)
  }
)

onMounted(() => {
  const storedTheme = localStorage.getItem('darkMode')

  switch (storedTheme) {
    case 'true':
      $q.dark.set(true)
      break
    case 'false':
      $q.dark.set(false)
      break
    default:
      $q.dark.set('auto')
      break
  }

  dataGraphStore.initStore()

  ElectronApi.handleMqttMessage((_, { clientKey, topic, message, packet }) => {
    mqttTopicsStore.addMessage(clientKey, topic, message, packet)
  })
})
</script>

<template>
  <div class="graph-view tw-flex tw-h-full tw-flex-col tw-content-between">
    <graph-list />
  </div>
</template>

<style lang="less">
@import '../assets/css/scrollbar';
</style>
