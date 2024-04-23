<script setup>
import { GridComponent, TitleComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { use } from 'echarts/core'
import VChart from 'vue-echarts'
import { ref } from 'vue'

use([CanvasRenderer, LineChart, TitleComponent, TooltipComponent, GridComponent])

// TODO: theming
const option = ref({
  tooltip: { trigger: 'axis' },
  xAxis: {
    type: 'category',
    data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    show: false
  },
  yAxis: { type: 'value' },
  grid: { backgroundColor: 'transparent', show: true, left: 40, top: 10, right: 10, bottom: 10 },
  series: [{ data: [150, 230, 224, 218, 135, 147, 260], type: 'line' }]
})
</script>

<template>
  <q-card flat>
    <v-chart class="chart" :option="option" autoresize />
  </q-card>
</template>

<style scoped lang="less">
.chart {
  width: 400px;
  height: 200px;
}
</style>
