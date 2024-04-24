<script setup lang="ts">
import { GridComponent, TitleComponent, TooltipComponent } from 'echarts/components'
import { getDataFromPath } from '../../assets/js/parse-json-for-glyphs'
import LineChartContextMenu from './LineChartContextMenu.vue'
import { useMqttTopicsStore } from '../../store/mqtt-topics'
import formatNumber from '../../assets/js/format-number'
import { useAppStore } from '../../store/app-store'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import colors from 'tailwindcss/colors'
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import { use } from 'echarts/core'
import moment from 'moment/moment'
import VChart from 'vue-echarts'

use([CanvasRenderer, LineChart, TitleComponent, TooltipComponent, GridComponent])

const mqttTopicsStore = useMqttTopicsStore()
const appStore = useAppStore()

const $q = useQuasar()

const props = defineProps<{
  showTitle?: boolean
  connectionId: string
  topic: string
  dataPath: string
  cardWidth?: 'small' | 'medium' | 'large'
}>()

defineEmits<{
  'update:cardWidth': ['small' | 'medium' | 'large']
  delete: []
}>()

const girdColor = computed(() => ($q.dark.isActive ? colors.neutral[700] : colors.neutral[200]))

const curveType = ref<'linear' | 'curve' | 'step-start' | 'step-end'>('curve')
const graphColor = ref<string>(colors.blue[500])

const messagesForGraph = computed(() => {
  if (!props.connectionId || !props.topic) return []

  const messages = mqttTopicsStore.topicsMessages[props.connectionId][props.topic]

  return messages
    .map((m) => ({
      value: getDataFromPath(JSON.parse(m.message), props.dataPath),
      date: moment(m.createdAt).format('YYYY-MM-DD HH:mm:ss')
    }))
    .filter((d) => d.value !== null)
})

const options = computed(() => {
  const sortedData = messagesForGraph.value
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  let step: string = ''

  switch (curveType.value) {
    case 'step-start':
      step = 'start'
      break
    case 'step-end':
      step = 'end'
      break
  }

  return {
    tooltip: { trigger: 'axis' },
    xAxis: {
      data: sortedData.map((d) => d.date),
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
        data: sortedData.map((d) => d.value),
        type: 'line',
        itemStyle: { color: graphColor.value },
        step,
        smooth: curveType.value === 'curve'
      }
    ]
  }
})

const showGraph = computed(() => {
  return appStore.currentTab === 'topics'
})
</script>

<template>
  <q-card class="graph-card tw-p-2 tw-border" flat :class="[cardWidth]">
    <q-card-section v-if="showTitle" class="tw-p-2 tw-cursor-grab drag-handle">
      <div class="tw-text-xl">{{ dataPath }}</div>
      <div class="tw-text-sm color-details">{{ topic }}</div>
      <q-btn
        class="tw-absolute tw-top-2 tw-right-2 tw-text-neutral-500"
        round
        flat
        size="sm"
        icon="fa-solid fa-gear"
      >
        <line-chart-context-menu
          anchor="top left"
          self="top end"
          :offset="[10, 0]"
          @update:card-width="$emit('update:cardWidth', $event)"
          @update:curve-type="curveType = $event"
          @update:color="graphColor = $event"
          @delete="$emit('delete')"
        />
      </q-btn>
    </q-card-section>

    <div class="tw-h-[200px]">
      <v-chart v-if="showGraph" class="chart" :option="options" autoresize />
    </div>

    <line-chart-context-menu
      context-menu
      @update:card-width="$emit('update:cardWidth', $event)"
      @update:curve-type="curveType = $event"
      @update:color="graphColor = $event"
      @delete="$emit('delete')"
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
