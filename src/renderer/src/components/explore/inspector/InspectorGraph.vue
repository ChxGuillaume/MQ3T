<script setup lang="ts">
import {
  formatDuration,
  numericPaths,
  numericValue,
  parseMessage
} from '@renderer/assets/js/payload-insight'
import SegmentedControl from '@renderer/components/ui/SegmentedControl.vue'
import LineChartCard from '@renderer/components/graphs/LineChartCard.vue'
import { formatGraphValue } from '@renderer/assets/js/data-graph'
import { useDataGraphsStore } from '@renderer/store/data-graphs'
import { ElectronApi } from '@renderer/assets/js/electron-api'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import { useSharedNow } from '@renderer/composables/useSharedNow'
import { computed, ref, watch } from 'vue'

const props = defineProps<{ clientKey: string; topic: string }>()

const mqttTopicsStore = useMqttTopicsStore()
const dataGraphsStore = useDataGraphsStore()
const now = useSharedNow()

const ranges = [
  { label: '1 min', value: 60_000 },
  { label: '5 min', value: 300_000 },
  { label: 'All', value: 0 }
]

const range = ref(300_000)
const field = ref('')

const last = computed(() => mqttTopicsStore.getTopicLastMessage(props.clientKey, props.topic))

const fields = computed(() => {
  if (!last.value) return []

  const parsed = parseMessage(last.value)

  if (parsed.kind === 'number') return ['']
  if (parsed.kind !== 'json') return []

  return numericPaths(parsed.value).slice(0, 200)
})

const ROOT_FIELD = '$root'

const fieldItems = computed(() =>
  fields.value.map((path) => ({ label: path || 'value', value: path || ROOT_FIELD }))
)

const selectedField = computed({
  get: () => field.value || ROOT_FIELD,
  set: (value: string) => (field.value = value === ROOT_FIELD ? '' : value)
})

watch(
  fields,
  (paths) => {
    if (!paths.includes(field.value)) field.value = paths[0] ?? ''
  },
  { immediate: true }
)

const points = computed(() => {
  const messages = mqttTopicsStore.topicsMessages[props.clientKey]?.[props.topic] ?? []
  const since = range.value ? now.value.getTime() - range.value : 0

  return messages
    .filter((message) => message.createdAt.getTime() >= since)
    .map((message) => ({ value: numericValue(message, field.value), date: message.createdAt }))
    .filter((point): point is { value: number; date: Date } => point.value !== null)
})

const stats = computed(() => {
  const values = points.value.map((p) => p.value)

  if (!values.length) return null

  const first = points.value[0]
  const latest = points.value[points.value.length - 1]

  return {
    min: Math.min(...values),
    max: Math.max(...values),
    avg: values.reduce((a, b) => a + b, 0) / values.length,
    latest: latest.value,
    delta: latest.value - first.value,
    span: latest.date.getTime() - first.date.getTime()
  }
})

const deltaLabel = computed(() => {
  if (!stats.value || points.value.length < 2) return ''

  const sign = stats.value.delta > 0 ? '+' : stats.value.delta < 0 ? '−' : '±'

  return `${sign}${formatGraphValue(Math.abs(stats.value.delta))} in ${formatDuration(stats.value.span)}`
})

const dataGraph = computed(() => ({
  id: null,
  clientKey: props.clientKey,
  topic: props.topic,
  dataPath: field.value,
  curveType: 'curve' as const
}))

const alreadyAdded = computed(() =>
  dataGraphsStore.dataGraph.some(
    (graph) =>
      graph.clientKey === props.clientKey &&
      graph.topic === props.topic &&
      graph.dataPath === field.value
  )
)

const addToGraphs = () => {
  dataGraphsStore.addDataGraph({
    clientKey: props.clientKey,
    topic: props.topic,
    dataPath: field.value
  })
}
</script>

<template>
  <UEmpty
    v-if="!fields.length"
    icon="i-lucide-chart-spline"
    title="Nothing to plot"
    description="Graphs need numeric values: a number payload or a JSON object with numeric fields."
    variant="naked"
  />
  <div v-else class="flex flex-col gap-3.5">
    <div class="flex flex-wrap items-center gap-2">
      <UFormField label="Field" orientation="horizontal" :ui="{ label: 'text-xs text-muted' }">
        <USelect
          v-model="selectedField"
          :items="fieldItems"
          size="sm"
          aria-label="Field to plot"
          class="min-w-32 font-mono"
        />
      </UFormField>
      <SegmentedControl v-model="range" :items="ranges" size="sm" class="ml-auto" />
    </div>

    <div v-if="stats" class="flex items-baseline gap-2.5">
      <span class="text-code-num font-mono text-[32px] font-bold">
        {{ formatGraphValue(stats.latest) }}
      </span>
      <span class="text-muted text-[13px]">now</span>
      <span v-if="deltaLabel" class="text-primary ml-auto text-xs font-bold">{{ deltaLabel }}</span>
    </div>

    <LineChartCard :data-graph="dataGraph" :height="220" :time-window="range" compact />

    <div v-if="stats" class="flex gap-2">
      <div
        v-for="stat in [
          { label: 'Min', value: stats.min },
          { label: 'Avg', value: stats.avg },
          { label: 'Max', value: stats.max }
        ]"
        :key="stat.label"
        class="border-default flex-1 rounded-lg border px-3 py-2"
      >
        <div class="text-muted text-[11px]">{{ stat.label }}</div>
        <div class="font-mono font-bold">{{ formatGraphValue(stat.value) }}</div>
      </div>
    </div>

    <div class="flex flex-wrap gap-2">
      <UButton
        :icon="alreadyAdded ? 'i-lucide-check' : 'i-lucide-plus'"
        :label="alreadyAdded ? 'Added to Graphs' : 'Add to Graphs'"
        variant="outline"
        :disabled="alreadyAdded"
        @click="addToGraphs"
      />
      <UButton
        icon="i-lucide-external-link"
        label="Open in graph window"
        color="neutral"
        variant="outline"
        @click="ElectronApi.openGraphWindow(clientKey)"
      />
    </div>
  </div>
</template>
