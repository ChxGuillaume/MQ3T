<script setup lang="ts">
import { GridComponent, TitleComponent, TooltipComponent } from 'echarts/components'
import { MqttMessage, useMqttTopicsStore } from '../../store/mqtt-topics'
import { getDataFromPath } from '../../assets/js/parse-json-for-glyphs'
import LineChartContextMenu from './LineChartContextMenu.vue'
import { useDataGraphsStore } from '../../store/data-graphs'
import { DataGraph } from '../../../../types/data-graph'
import formatNumber from '../../assets/js/format-number'
import { useAppStore } from '../../store/app-store'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import colors from 'tailwindcss/colors'
import { useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { use } from 'echarts/core'
import moment from 'moment/moment'
import VChart from 'vue-echarts'
import { computed } from 'vue'

use([CanvasRenderer, LineChart, TitleComponent, TooltipComponent, GridComponent])

const mqttTopicsStore = useMqttTopicsStore()
const dataGraphsStore = useDataGraphsStore()
const appStore = useAppStore()

const route = useRoute()
const $q = useQuasar()

const props = defineProps<{
  showContextMenu?: boolean
  showTitle?: boolean
  dataGraph: DataGraph
}>()

defineEmits<{
  delete: []
}>()

const girdColor = computed(() => ($q.dark.isActive ? colors.neutral[700] : colors.neutral[200]))

const messagesForGraph = computed(() => {
  const { clientKey, topic, dataPath } = props.dataGraph

  if (!clientKey || !topic) return []

  const messages = mqttTopicsStore.topicsMessages[clientKey]?.[topic] ?? []

  return transformMessages(messages, dataPath)
})

const transformMessages = (messages: MqttMessage[], dataPath: string) => {
  return messages
    .filter((message): message is MqttMessage & { dataType: 'json' } => message.dataType === 'json')
    .map((message) => ({
      value: getDataFromPath(JSON.parse(message.message), dataPath),
      date: message.createdAt
    }))
    .filter((data) => data.value !== null)
}

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
  return appStore.currentTab === 'topics' || route.path === '/graph'
})

const defaultDataPathText = '<value>'
</script>

<template>
  <q-card class="graph-card tw-border tw-p-2" flat :class="[dataGraph.size]">
    <q-card-section v-if="showTitle" class="drag-handle tw-cursor-grab tw-p-2">
      <div class="tw-h-7 tw-text-xl">{{ dataGraph.dataPath || defaultDataPathText }}</div>
      <div
        class="color-details tw-line-clamp-1 tw-max-w-full tw-overflow-hidden tw-overflow-ellipsis tw-text-sm"
        :title="dataGraph.topic"
        v-text="dataGraph.topic"
      />
    </q-card-section>

    <div class="tw-h-[200px]">
      <v-chart v-if="showGraph" class="chart" :option="options" autoresize />
    </div>

    <slot name="bottom" />

    <q-btn
      v-if="showContextMenu"
      class="tw-absolute tw-right-1 tw-top-1 tw-text-neutral-500"
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
      v-if="showContextMenu"
      context-menu
      @update:card-width="dataGraphsStore.setDataGraphSize(dataGraph.id, $event)"
      @update:curve-type="dataGraphsStore.setDataGraphCurveType(dataGraph.id, $event)"
      @update:color="dataGraphsStore.setDataGraphColor(dataGraph.id, $event)"
      @delete="dataGraphsStore.removeDataGraph(dataGraph.id)"
    />
  </q-card>
</template>

<style lang="less">
.graph-card {
  .main-view &.small {
    @apply tw-col-span-1;
  }

  .main-view &.medium {
    @apply tw-col-span-1 xl:tw-col-span-2;
  }

  .main-view &.large {
    @apply tw-col-span-1 xl:tw-col-span-2 2xl:tw-col-span-3;
  }

  .graph-view &.small {
    @apply tw-col-span-1;
  }

  .graph-view &.medium {
    @apply tw-col-span-1 xl:tw-col-span-2;
  }

  .graph-view &.large {
    @apply tw-col-span-1 xl:tw-col-span-3 2xl:tw-col-span-5;
  }
}

.chart {
  @apply tw-h-full tw-w-full;
}
</style>
