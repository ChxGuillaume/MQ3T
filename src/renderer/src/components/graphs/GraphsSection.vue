<script setup lang="ts">
import SegmentedControl from '@renderer/components/ui/SegmentedControl.vue'
import AddGraphModal from '@renderer/components/graphs/AddGraphModal.vue'
import GraphList from '@renderer/components/tap-topics/GraphList.vue'
import { graphTimeWindows } from '@renderer/assets/js/data-graph'
import { useDataGraphsStore } from '@renderer/store/data-graphs'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import { ElectronApi } from '@renderer/assets/js/electron-api'
import { useMqttConnectionsStore } from '@renderer/store/mqtt-connections'
import { computed, ref } from 'vue'

const mqttTopicsStore = useMqttTopicsStore()
const dataGraphsStore = useDataGraphsStore()

const timeWindow = ref(300_000)
const pausedAt = ref<number | null>(null)
const addGraphOpen = ref(false)

const clientKey = computed(() => mqttTopicsStore.selectedConnection)
const mqttConnectionsStore = useMqttConnectionsStore()
const canOpenWindow = computed(() => !mqttConnectionsStore.isTemporary(clientKey.value))

const hasGraphs = computed(() =>
  dataGraphsStore.dataGraph.some((graph) => graph.clientKey === clientKey.value)
)

const togglePause = () => {
  pausedAt.value = pausedAt.value ? null : Date.now()
}
</script>

<template>
  <main class="flex flex-col gap-[18px] px-6 py-5">
    <div class="flex flex-col gap-2.5">
      <div class="flex flex-wrap items-center gap-2.5">
        <h1 class="text-highlighted mr-auto text-2xl font-bold">Graphs</h1>
        <segmented-control v-model="timeWindow" :items="graphTimeWindows" />
        <UButton
          :icon="pausedAt ? 'i-lucide-play' : 'i-lucide-pause'"
          :label="pausedAt ? 'Resume' : 'Pause'"
          color="neutral"
          variant="outline"
          :aria-pressed="!!pausedAt"
          :disabled="!hasGraphs"
          @click="togglePause"
        />
        <UButton
          v-if="canOpenWindow"
          icon="i-lucide-external-link"
          label="Open in window"
          color="neutral"
          variant="outline"
          :disabled="!hasGraphs"
          @click="ElectronApi.openGraphWindow(clientKey)"
        />
        <UButton
          icon="i-lucide-plus"
          label="Add graph"
          variant="outline"
          class="font-semibold"
          @click="addGraphOpen = true"
        />
      </div>
      <p class="text-muted text-[13px]">
        Pick any numeric field from a topic's payload. Graphs keep drawing while you explore.
      </p>
    </div>

    <graph-list v-if="hasGraphs" :time-window="timeWindow" :paused-at="pausedAt" />

    <UEmpty
      v-else
      icon="i-lucide-chart-line"
      title="No graphs yet"
      description="Add a numeric field from a topic, or click the chart icon next to a value in a JSON payload."
      variant="naked"
      :actions="[
        { label: 'Add graph', icon: 'i-lucide-plus', onClick: () => (addGraphOpen = true) }
      ]"
      class="py-16"
    />

    <add-graph-modal v-model:open="addGraphOpen" :client-key="clientKey" />
  </main>
</template>
