<script setup>
import { computed } from 'vue'
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import NodeIcon from '@renderer/components/tab-actions/action-chain/NodeIcon.vue'

const props = defineProps(['id', 'data'])

const { updateNodeData } = useVueFlow()

const duration = computed({
  get: () => props.data.duration || 0,
  set: (value) => updateNodeData(props.id, { duration: Math.max(0, value) })
})

const durationType = computed({
  get: () => props.data.durationType || 'ms',
  set: (value) => updateNodeData(props.id, { durationType: value })
})

const isRunning = computed(() => {
  return props.data.isRunning
})

const isFinished = computed(() => {
  return props.data.isFinished
})
</script>

<template>
  <div class="flex h-full w-full flex-col justify-around p-1">
    <div class="flex items-center justify-center gap-2 text-lg">
      <node-icon :is-running="isRunning" :is-finished="isFinished" icon="fa-solid fa-clock" />
      Wait
    </div>

    <q-separator />

    <div class="flex min-h-[28px] items-center justify-around gap-2 px-1">
      {{ duration }} {{ durationType }}
    </div>
  </div>

  <q-menu context-menu>
    <div class="flex gap-2 p-2">
      <q-input v-model="duration" type="number" autofocus filled dense />
      <q-select v-model="durationType" :options="['ms', 's']" filled dense />
    </div>
  </q-menu>

  <Handle type="source" :position="Position.Right" />
  <Handle type="target" :position="Position.Left" />
</template>

<style scoped lang="scss"></style>
