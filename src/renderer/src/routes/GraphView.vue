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
  mqttTopicsStore.initStore()

  ElectronApi.handleMqttMessage((_, { clientKey, topic, message, packet }) => {
    mqttTopicsStore.addMessage(clientKey, topic, message, packet)
  })

  ElectronApi.requestMqttMessages()
})
</script>

<template>
  <div class="graph-view tw-grid tw-h-full tw-grid-rows-[40px_1fr] tw-flex-col tw-overflow-hidden">
    <q-bar
      class="grabbable tw-grid tw-h-10 tw-grid-cols-[auto_auto_1fr_auto] tw-gap-0 tw-bg-white dark:tw-bg-[#121212]"
    />
    <div class="tw-h-full tw-overflow-y-auto tw-overflow-x-hidden tw-p-2">
      <graph-list />
    </div>
  </div>
</template>

<style lang="less">
@import '../assets/css/scrollbar';

.grabbable {
  @apply tw-h-full;

  -webkit-app-region: drag;
}
</style>
