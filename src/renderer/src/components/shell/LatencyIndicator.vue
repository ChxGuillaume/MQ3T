<script setup lang="ts">
import { latencyClass, latencyLabel } from '@renderer/composables/useConnectionStatus'
import { formatDuration, sparklinePoints } from '@renderer/assets/js/payload-insight'
import { useMqttConnectionsStore } from '@renderer/store/mqtt-connections'
import { computed } from 'vue'

const props = defineProps<{ clientKey: string }>()

const CHART_WIDTH = 200
const CHART_HEIGHT = 48

const mqttConnectionsStore = useMqttConnectionsStore()

const latency = computed<number | undefined>(() => mqttConnectionsStore.latencies[props.clientKey])

const history = computed(() => mqttConnectionsStore.latencyHistory[props.clientKey] ?? [])

const values = computed(() => history.value.map((sample) => sample.latency))

const points = computed(() => sparklinePoints(values.value, CHART_WIDTH, CHART_HEIGHT, 0))

const stats = computed(() => {
  if (!values.value.length) return undefined

  const total = values.value.reduce((sum, value) => sum + value, 0)

  return {
    min: Math.min(...values.value),
    avg: Math.round(total / values.value.length),
    max: Math.max(...values.value)
  }
})

const historyDuration = computed(() => {
  if (history.value.length < 2) return undefined

  return formatDuration(history.value[history.value.length - 1].at - history.value[0].at)
})
</script>

<template>
  <UTooltip
    v-if="latency !== undefined"
    :ui="{ content: 'h-auto flex-col items-stretch gap-2 p-3' }"
  >
    <span class="flex items-center gap-1 tabular-nums" :class="latencyClass(latency)">
      <UIcon name="i-lucide-activity" class="size-3" />
      {{ latencyLabel(latency) }}
    </span>

    <template #content>
      <div class="flex items-baseline justify-between gap-4">
        <span class="font-semibold">Broker latency</span>
        <span v-if="historyDuration" class="text-muted">last {{ historyDuration }}</span>
      </div>

      <svg
        v-if="points"
        aria-hidden="true"
        :width="CHART_WIDTH"
        :height="CHART_HEIGHT"
        :viewBox="`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`"
        fill="none"
        class="stroke-primary"
        stroke-width="1.5"
        stroke-linejoin="round"
        stroke-linecap="round"
      >
        <polyline :points="points" />
      </svg>
      <span v-else class="text-muted">Collecting samples…</span>

      <div v-if="stats" class="text-muted flex justify-between gap-3 tabular-nums">
        <span>min {{ latencyLabel(stats.min) }}</span>
        <span>avg {{ latencyLabel(stats.avg) }}</span>
        <span>max {{ latencyLabel(stats.max) }}</span>
      </div>
    </template>
  </UTooltip>
</template>
