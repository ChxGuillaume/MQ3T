<script setup lang="ts">
import {
  curveTypeLabel,
  dataPathLabel,
  formatGraphValue,
  graphChartHeights,
  graphColors,
  graphCurveTypes,
  graphSizes,
  toGraphNumber
} from '@renderer/assets/js/data-graph'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { resolveCssColor, useChartTheme } from '@renderer/composables/useChartTheme'
import { getDataFromPath } from '@renderer/assets/js/json-path'
import { MqttMessage, useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import type { DropdownMenuItem } from '@nuxt/ui'
import { useDataGraphsStore } from '@renderer/store/data-graphs'
import { ElectronApi } from '@renderer/assets/js/electron-api'
import { DataGraph } from '../../../../types/data-graph'
import { CanvasRenderer } from 'echarts/renderers'
import { computed, useTemplateRef, watch } from 'vue'
import { useIntervalFn, useNow } from '@vueuse/core'
import { LineChart } from 'echarts/charts'
import { useRoute } from 'vue-router'
import { use } from 'echarts/core'
import moment from 'moment/moment'
import VChart from 'vue-echarts'

use([CanvasRenderer, LineChart, TooltipComponent, GridComponent])

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    dataGraph: DataGraph
    showContextMenu?: boolean
    showTitle?: boolean
    compact?: boolean
    timeWindow?: number
    pausedAt?: number | null
    height?: number
  }>(),
  { timeWindow: 0, pausedAt: null, height: undefined }
)

const emit = defineEmits<{
  delete: []
}>()

const mqttTopicsStore = useMqttTopicsStore()
const dataGraphsStore = useDataGraphsStore()
const route = useRoute()
const { theme } = useChartTheme()

const chart = useTemplateRef<InstanceType<typeof VChart>>('chart')
const now = useNow({ scheduler: (cb) => useIntervalFn(cb, 1000) })

const valueCache = new Map<string, number | null>()

watch(
  () => [props.dataGraph.topic, props.dataGraph.dataPath],
  () => valueCache.clear()
)

const readValue = (message: MqttMessage): number | null => {
  const cached = valueCache.get(message.uid)
  if (cached !== undefined) return cached

  let value: number | null

  try {
    value = toGraphNumber(getDataFromPath(JSON.parse(message.message), props.dataGraph.dataPath))
  } catch {
    value = null
  }

  valueCache.set(message.uid, value)

  return value
}

const points = computed<[number, number][]>(() => {
  const { clientKey, topic } = props.dataGraph
  if (!clientKey || !topic) return []

  const messages = mqttTopicsStore.topicsMessages[clientKey]?.[topic] ?? []

  return messages
    .filter((message) => message.dataType === 'json')
    .map((message) => [new Date(message.createdAt).getTime(), readValue(message)] as const)
    .filter((point): point is [number, number] => point[1] !== null)
    .sort((a, b) => a[0] - b[0])
})

const range = computed(() => {
  const end = props.pausedAt ?? (props.timeWindow ? now.value.getTime() : null)
  const start = props.timeWindow && end ? end - props.timeWindow : null

  return { start, end }
})

const visiblePoints = computed(() => {
  const { start, end } = range.value
  if (start === null && end === null) return points.value

  return points.value.filter(
    ([time]) => (start === null || time >= start) && (end === null || time <= end)
  )
})

const stats = computed(() => {
  const values = visiblePoints.value.map(([, value]) => value)
  if (!values.length) return null

  return {
    latest: values[values.length - 1],
    min: Math.min(...values),
    max: Math.max(...values),
    first: visiblePoints.value[0][0]
  }
})

const size = computed(() => props.dataGraph.size ?? 'small')

const chartHeight = computed(() => {
  if (props.height) return props.height
  if (props.compact) return 140
  if (!props.showTitle) return 200

  return graphChartHeights[size.value]
})

const swatchColor = computed(() => props.dataGraph.color ?? 'var(--ui-primary)')

const lineColor = computed(() => {
  const color = props.dataGraph.color

  return (color ? resolveCssColor(color) : '') || theme.value.primary
})

const startLabel = computed(() => {
  const start = range.value.start ?? stats.value?.first
  return start ? moment(start).format('HH:mm') : ''
})

const endLabel = computed(() =>
  props.pausedAt ? moment(props.pausedAt).format('HH:mm:ss') : 'now'
)

const options = computed(() => {
  const t = theme.value
  const curveType = props.dataGraph.curveType ?? 'curve'
  const step = curveType === 'step-start' ? 'start' : curveType === 'step-end' ? 'end' : false

  return {
    animation: false,
    textStyle: { fontFamily: t.fontSans },
    tooltip: {
      trigger: 'axis',
      backgroundColor: t.surface,
      borderColor: t.border,
      padding: [6, 10],
      textStyle: { color: t.text, fontSize: 12 },
      axisPointer: { type: 'line', lineStyle: { color: t.border } },
      formatter: (params: { value: [number, number] }[]) => {
        const [time, value] = params[0]?.value ?? []
        if (time === undefined) return ''

        return `<div style="color:${t.muted};font-size:11px">${moment(time).format('HH:mm:ss')}</div><div style="font-weight:700;font-family:${t.fontMono}">${formatGraphValue(value)}</div>`
      }
    },
    xAxis: {
      type: 'time',
      show: false,
      min: range.value.start ?? 'dataMin',
      max: range.value.end ?? 'dataMax'
    },
    yAxis: {
      type: 'value',
      scale: true,
      splitNumber: 3,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: t.grid } },
      axisLabel: {
        show: !props.showTitle,
        color: t.muted,
        fontSize: 10,
        fontFamily: t.fontMono,
        formatter: (value: number) => formatGraphValue(value)
      }
    },
    grid: {
      left: 0,
      right: 0,
      top: 6,
      bottom: 2,
      outerBoundsMode: 'same',
      outerBoundsContain: 'axisLabel'
    },
    series: [
      {
        type: 'line',
        data: visiblePoints.value,
        showSymbol: false,
        symbolSize: 6,
        step,
        smooth: curveType === 'curve',
        lineStyle: { width: 2, color: lineColor.value },
        itemStyle: { color: lineColor.value }
      }
    ]
  }
})

const fileBaseName = computed(() =>
  `${props.dataGraph.topic}-${props.dataGraph.dataPath || 'value'}`.replace(/[^\w.-]+/g, '_')
)

const download = (href: string, filename: string) => {
  const link = document.createElement('a')
  link.href = href
  link.download = filename
  link.click()
}

const exportPng = () => {
  const url = chart.value?.getDataURL({
    type: 'png',
    pixelRatio: 2,
    backgroundColor: theme.value.surface
  })

  if (url) download(url, `${fileBaseName.value}.png`)
}

const exportCsv = () => {
  const rows = points.value.map(([time, value]) => `${new Date(time).toISOString()},${value}`)
  const blob = new Blob([['time,value', ...rows].join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)

  download(url, `${fileBaseName.value}.csv`)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const remove = () => {
  if (props.dataGraph.id) dataGraphsStore.removeDataGraph(props.dataGraph.id)
  emit('delete')
}

const isGraphWindow = computed(() => route.path === '/graph')

const menuItems = computed<DropdownMenuItem[][]>(() => {
  const id = props.dataGraph.id
  if (!id) return []

  return [
    [
      {
        label: 'Color',
        icon: 'i-lucide-palette',
        children: graphColors.map((color) => ({
          label: color.label,
          type: 'checkbox' as const,
          slot: 'swatch' as const,
          swatch: color.value ?? 'var(--ui-primary)',
          checked: props.dataGraph.color === color.value,
          onSelect: () => dataGraphsStore.setDataGraphColor(id, color.value as string)
        }))
      },
      {
        label: 'Size',
        icon: 'i-lucide-move-horizontal',
        children: graphSizes.map((item) => ({
          label: item.label,
          type: 'checkbox' as const,
          checked: size.value === item.value,
          onSelect: () => dataGraphsStore.setDataGraphSize(id, item.value)
        }))
      },
      {
        label: 'Line',
        icon: 'i-lucide-chart-spline',
        children: graphCurveTypes.map((item) => ({
          label: item.label,
          type: 'checkbox' as const,
          checked: (props.dataGraph.curveType ?? 'curve') === item.value,
          onSelect: () => dataGraphsStore.setDataGraphCurveType(id, item.value)
        }))
      }
    ],
    [
      {
        label: 'Export',
        icon: 'i-lucide-download',
        children: [
          { label: 'PNG image', icon: 'i-lucide-image', onSelect: exportPng },
          { label: 'CSV data', icon: 'i-lucide-file-spreadsheet', onSelect: exportCsv }
        ]
      },
      ...(isGraphWindow.value
        ? []
        : [
            {
              label: 'Open in window',
              icon: 'i-lucide-external-link',
              onSelect: () => ElectronApi.openGraphWindow(props.dataGraph.clientKey)
            }
          ])
    ],
    [{ label: 'Remove', icon: 'i-lucide-trash-2', color: 'error' as const, onSelect: remove }]
  ]
})
</script>

<template>
  <UContextMenu :items="menuItems" :disabled="!showContextMenu || !dataGraph.id">
    <article
      v-bind="$attrs"
      class="border-default bg-default flex min-w-0 flex-col border"
      :class="compact ? 'gap-2 rounded-lg p-3' : 'gap-3 rounded-lg p-4'"
    >
      <div
        v-if="showTitle && compact"
        class="drag-handle flex cursor-grab items-center gap-2 active:cursor-grabbing"
      >
        <span
          class="min-w-0 flex-1 truncate font-mono text-xs"
          :title="`${dataGraph.topic} · ${dataPathLabel(dataGraph.dataPath)}`"
        >
          {{ dataGraph.topic }}
          <span v-if="dataGraph.dataPath" class="text-muted">· {{ dataGraph.dataPath }}</span>
        </span>
        <span class="font-mono text-lg font-bold" :style="{ color: swatchColor }">
          {{ formatGraphValue(stats?.latest) }}
        </span>
        <UDropdownMenu v-if="showContextMenu" :items="menuItems" :content="{ align: 'end' }">
          <template #swatch-leading="{ item }">
            <span
              class="size-3 shrink-0 rounded-xs"
              :style="{ background: (item as { swatch?: string }).swatch }"
            />
          </template>
          <UButton
            icon="i-lucide-ellipsis"
            size="xs"
            color="neutral"
            variant="ghost"
            aria-label="Graph options"
            class="text-muted"
          />
        </UDropdownMenu>
      </div>

      <div
        v-else-if="showTitle"
        class="drag-handle flex cursor-grab items-start gap-2.5 active:cursor-grabbing"
      >
        <span
          aria-hidden="true"
          class="mt-1 size-2.5 shrink-0 rounded-xs"
          :style="{ background: swatchColor }"
        />
        <div class="min-w-0 flex-1">
          <div class="truncate font-mono text-[13px] font-bold" :title="dataGraph.topic">
            {{ dataGraph.topic }}
          </div>
          <div class="text-muted truncate font-mono text-xs" :title="dataGraph.dataPath">
            {{ dataPathLabel(dataGraph.dataPath) }}
          </div>
        </div>
        <div class="shrink-0 text-right">
          <div
            class="leading-tight font-bold"
            :class="size === 'small' ? 'text-lg' : 'text-2xl'"
            :style="{ color: swatchColor }"
          >
            {{ formatGraphValue(stats?.latest) }}
          </div>
          <div class="text-muted text-[11px]">{{ curveTypeLabel(dataGraph.curveType) }}</div>
        </div>
        <UDropdownMenu v-if="showContextMenu" :items="menuItems" :content="{ align: 'end' }">
          <template #swatch-leading="{ item }">
            <span
              class="size-3 shrink-0 rounded-xs"
              :style="{ background: (item as { swatch?: string }).swatch }"
            />
          </template>
          <UButton
            icon="i-lucide-ellipsis"
            size="sm"
            color="neutral"
            variant="ghost"
            aria-label="Graph options"
            class="text-muted -mt-1 -mr-1"
          />
        </UDropdownMenu>
      </div>

      <div class="relative" :style="{ height: `${chartHeight}px` }">
        <v-chart ref="chart" class="size-full" :option="options" autoresize />
        <div
          v-if="!visiblePoints.length"
          class="text-dimmed pointer-events-none absolute inset-0 flex items-center justify-center text-xs"
        >
          No data {{ timeWindow ? 'in this time range' : 'yet' }}
        </div>
      </div>

      <slot name="bottom" />

      <div
        v-if="showTitle && compact"
        class="text-muted flex justify-between font-mono text-[11px]"
      >
        <span>min {{ formatGraphValue(stats?.min) }}</span>
        <span>max {{ formatGraphValue(stats?.max) }}</span>
      </div>
      <div v-else-if="showTitle" class="text-muted flex justify-between gap-2 text-[11px]">
        <span>{{ startLabel }}</span>
        <span>min {{ formatGraphValue(stats?.min) }} · max {{ formatGraphValue(stats?.max) }}</span>
        <span>{{ endLabel }}</span>
      </div>
    </article>

    <template #swatch-leading="{ item }">
      <span
        class="size-3 shrink-0 rounded-xs"
        :style="{ background: (item as { swatch?: string }).swatch }"
      />
    </template>
  </UContextMenu>
</template>
