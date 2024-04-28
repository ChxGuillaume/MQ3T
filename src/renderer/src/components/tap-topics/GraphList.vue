<script setup lang="ts">
import { useDataGraphsStore } from '../../store/data-graphs'
import LineChartCard from '../graphs/LineChartCard.vue'
import draggable from 'vuedraggable'
import { computed } from 'vue'

const dataGraphsStore = useDataGraphsStore()

const dragOptions = computed(() => {
  return { animation: 200, group: 'topics-graph-list', ghostClass: 'ghost' }
})

const graphs = computed({
  get: () => dataGraphsStore.dataGraph,
  set: (value) => dataGraphsStore.setDataGraphs(value)
})
</script>

<template>
  <draggable
    v-model="graphs"
    v-bind="dragOptions"
    handle=".drag-handle"
    class="tw-p-2 tw-grid tw-grid-cols-1 xl:tw-grid-cols-2 2xl:tw-grid-cols-3 tw-gap-2"
    item-key="clientKey"
  >
    <template #item="{ element }">
      <line-chart-card :data-graph="element" show-title show-context-menu />
    </template>
  </draggable>
</template>

<style scoped lang="less"></style>
