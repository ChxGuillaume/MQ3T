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
  display: grid;
  gap: 0.5rem;

  .main-view & {
    grid-template-columns: repeat(1, minmax(0, 1fr));
    @media (min-width: 1280px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    @media (min-width: 1536px) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  .graph-view & {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    @media (min-width: 1280px) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    @media (min-width: 1920px) {
      grid-template-columns: repeat(5, minmax(0, 1fr));
    }
  }
}
</style>
