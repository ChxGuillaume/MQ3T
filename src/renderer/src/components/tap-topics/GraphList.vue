<script setup lang="ts">
import { useDataGraphsStore } from '../../store/data-graphs'
import LineChartCard from '../graphs/LineChartCard.vue'
import draggable from 'vuedraggable'
import { computed } from 'vue'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'

const dataGraphsStore = useDataGraphsStore()
const mqttTopicsStore = useMqttTopicsStore()

const dragOptions = computed(() => {
  return { animation: 200, group: 'topics-graph-list', ghostClass: 'ghost' }
})

const graphs = computed({
  get: () =>
    dataGraphsStore.dataGraph.filter(
      (graph) => graph.clientKey === mqttTopicsStore.selectedConnection
    ),
  set: (value) => dataGraphsStore.setDataGraphs(value)
})
</script>

<template>
  <draggable
    v-model="graphs"
    v-bind="dragOptions"
    handle=".drag-handle"
    class="graph-list"
    item-key="clientKey"
  >
    <template #item="{ element }">
      <line-chart-card :data-graph="element" show-title show-context-menu />
    </template>
  </draggable>
</template>

<style scoped lang="less">
.graph-list {
  @apply tw-grid tw-gap-2;

  .main-view & {
    @apply tw-grid-cols-1 xl:tw-grid-cols-2 2xl:tw-grid-cols-3;
  }

  .graph-view & {
    @apply tw-grid-cols-2 xl:tw-grid-cols-3 3xl:tw-grid-cols-5;
  }
}
</style>
