<script setup lang="ts">
import LineChartCard from '@renderer/components/graphs/LineChartCard.vue'
import { useDataGraphsStore } from '@renderer/store/data-graphs'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import { DataGraph } from '../../../../types/data-graph'
import draggable from 'vuedraggable'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    clientKey?: string
    compact?: boolean
    timeWindow?: number
    pausedAt?: number | null
  }>(),
  { clientKey: undefined, timeWindow: 0, pausedAt: null }
)

const dataGraphsStore = useDataGraphsStore()
const mqttTopicsStore = useMqttTopicsStore()

const connectionKey = computed(() => props.clientKey ?? mqttTopicsStore.selectedConnection)

const graphs = computed<DataGraph[]>({
  get: () => dataGraphsStore.dataGraph.filter((graph) => graph.clientKey === connectionKey.value),
  set: (value) =>
    dataGraphsStore.setDataGraphs([
      ...dataGraphsStore.dataGraph.filter((graph) => graph.clientKey !== connectionKey.value),
      ...value
    ])
})

const spanClass = (graph: DataGraph) => {
  if (props.compact) return ''
  if (graph.size === 'large') return '@[720px]:col-span-2'

  return ''
}
</script>

<template>
  <div class="@container">
    <draggable
      v-model="graphs"
      :animation="200"
      handle=".drag-handle"
      ghost-class="opacity-40"
      item-key="id"
      class="grid gap-3.5"
      :class="
        compact
          ? 'grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-2.5'
          : 'grid-cols-[repeat(auto-fill,minmax(340px,1fr))]'
      "
    >
      <template #item="{ element }">
        <line-chart-card
          :class="spanClass(element)"
          :data-graph="element"
          :compact="compact"
          :time-window="timeWindow"
          :paused-at="pausedAt"
          show-title
          show-context-menu
        />
      </template>
    </draggable>
  </div>
</template>
