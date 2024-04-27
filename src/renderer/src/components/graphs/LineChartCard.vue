<script setup lang="ts">
import { GridComponent, TitleComponent, TooltipComponent } from 'echarts/components'
import { DataGraph, useDataGraphsStore } from '../../store/data-graphs'
import { getDataFromPath } from '../../assets/js/parse-json-for-glyphs'
import LineChartContextMenu from './LineChartContextMenu.vue'
import { useMqttTopicsStore } from '../../store/mqtt-topics'
import formatNumber from '../../assets/js/format-number'
import { useAppStore } from '../../store/app-store'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import colors from 'tailwindcss/colors'
import { useQuasar } from 'quasar'
import { use } from 'echarts/core'
import moment from 'moment/moment'
import VChart from 'vue-echarts'
import { computed } from 'vue'

use([CanvasRenderer, LineChart, TitleComponent, TooltipComponent, GridComponent])

const mqttTopicsStore = useMqttTopicsStore()
const dataGraphsStore = useDataGraphsStore()
const appStore = useAppStore()

const $q = useQuasar()

const props = defineProps<{
  showTitle?: boolean
  dataGraph: DataGraph
}>()

defineEmits<{
  delete: []
}>()

const girdColor = computed(() => ($q.dark.isActive ? colors.neutral[700] : colors.neutral[200]))

const messagesForGraph = computed(() => {
  const clientKey = props.dataGraph.clientKey
  const topic = props.dataGraph.topic
  const dataPath = props.dataGraph.dataPath

  if (!clientKey || !topic) return []

  const messages = mqttTopicsStore.topicsMessages[clientKey][topic] || []

  return messages
    .filter((m) => m.dataType === 'json')
    .map((m) => ({
      value: getDataFromPath(JSON.parse(m.message), dataPath),
      date: m.createdAt
    }))
    .filter((d) => d.value !== null)
})

const options = computed(() => {
  const sortedData = messagesForGraph.value
    .slice()
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  let step: string = ''

  switch (props.dataGraph.curveType) {
    case 'step-start':
      step = 'start'
      break
    case 'step-end':
      step = 'end'
      break
  }

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        label: {
          formatter: (params: any) => moment(params.value).format('HH:mm:ss')
        }
      }
    },
    xAxis: {
      type: 'time',
      show: false,
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      splitLine: {
        lineStyle: { color: girdColor.value }
      },
      min: 'dataMin',
      axisLabel: {
        formatter: (val: number) => formatNumber(val)
      }
    },
    grid: {
      show: false,
      left: 60,
      top: 15,
      right: 0,
      bottom: 15,
      backgroundColor: 'transparent'
    },
    series: [
      {
        data: sortedData.map((d) => [d.date, d.value]),
        type: 'line',
        itemStyle: { color: props.dataGraph.color },
        step,
        smooth: props.dataGraph.curveType === 'curve'
      }
    ]
  }
})

const showGraph = computed(() => {
  return appStore.currentTab === 'topics'
})

const defaultDataPathText = '<value>'
</script>

<template>
  <q-card class="graph-card tw-p-2 tw-border" flat :class="[dataGraph.size]">
    <q-card-section v-if="showTitle" class="tw-p-2 tw-cursor-grab drag-handle">
      <div class="tw-h-7 tw-text-xl">{{ dataGraph.dataPath || defaultDataPathText }}</div>
      <div
        class="tw-max-w-full tw-text-sm color-details tw-overflow-hidden tw-overflow-ellipsis tw-line-clamp-1"
        :title="dataGraph.topic"
        v-text="dataGraph.topic"
      />
    </q-card-section>

    <div class="tw-h-[200px]">
      <v-chart v-if="showGraph" class="chart" :option="options" autoresize />
    </div>

    <slot name="bottom" />

    <q-btn
      class="tw-absolute tw-top-1 tw-right-1 tw-text-neutral-500"
      round
      flat
      size="sm"
      icon="fa-solid fa-gear"
    >
      <line-chart-context-menu
        anchor="top left"
        self="top end"
        :offset="[10, 0]"
        @update:card-width="dataGraphsStore.setDataGraphSize(dataGraph.id, $event)"
        @update:curve-type="dataGraphsStore.setDataGraphCurveType(dataGraph.id, $event)"
        @update:color="dataGraphsStore.setDataGraphColor(dataGraph.id, $event)"
        @delete="dataGraphsStore.removeDataGraph(dataGraph.id)"
      />
    </q-btn>

    <line-chart-context-menu
      context-menu
      @update:card-width="dataGraphsStore.setDataGraphSize(dataGraph.id, $event)"
      @update:curve-type="dataGraphsStore.setDataGraphCurveType(dataGraph.id, $event)"
      @update:color="dataGraphsStore.setDataGraphColor(dataGraph.id, $event)"
      @delete="dataGraphsStore.removeDataGraph(dataGraph.id)"
    />
  </q-card>
</template>

<style scoped lang="less">
.graph-card.small {
  @apply tw-col-span-1;
}

.graph-card.medium {
  @apply tw-col-span-1 xl:tw-col-span-2;
}

.graph-card.large {
  @apply tw-col-span-1 xl:tw-col-span-2 2xl:tw-col-span-3;
}

.chart {
  @apply tw-w-full tw-h-full;
}
</style>
