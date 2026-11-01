<script setup lang="ts">
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import { useDataGraphsStore } from '@renderer/store/data-graphs'
import GraphList from '../components/tap-topics/GraphList.vue'
import { ElectronApi } from '../assets/js/electron-api'
import { onMounted } from 'vue'

const mqttTopicsStore = useMqttTopicsStore()
const dataGraphStore = useDataGraphsStore()

onMounted(() => {
  dataGraphStore.initStore()
  mqttTopicsStore.initStore()

  ElectronApi.handleMqttMessage((_, { clientKey, topic, message, packet }) => {
    mqttTopicsStore.addMessage(clientKey, topic, message, packet)
  })

  ElectronApi.requestMqttMessages()
})
</script>

<template>
  <div class="graph-view grid h-full grid-rows-[40px_1fr] flex-col overflow-hidden">
    <q-bar
      class="grabbable grid h-10 grid-cols-[auto_auto_1fr_auto] gap-0 bg-white dark:bg-[#121212]"
    />
    <div class="h-full overflow-x-hidden overflow-y-auto p-2">
      <graph-list />
    </div>
  </div>
</template>

<style lang="less">
@import '../assets/css/scrollbar';

.grabbable {
  height: 100%;

  -webkit-app-region: drag;
}
</style>
