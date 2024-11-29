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
  <div class="tw-flex tw-h-full tw-w-full tw-flex-col tw-justify-around tw-p-1">
    <div class="tw-flex tw-items-center tw-justify-center tw-gap-2 tw-text-lg">
      <node-icon :isRunning="isRunning" :isFinished="isFinished" icon="fa-solid fa-clock" />
      Wait
    </div>

    <q-separator />

    <div class="tw-flex tw-min-h-[28px] tw-items-center tw-justify-around tw-gap-2 tw-px-1">
      {{ duration }} {{ durationType }}
    </div>
  </div>

  <q-menu context-menu>
    <div class="tw-flex tw-gap-2 tw-p-2">
      <q-input v-model="duration" type="number" autofocus filled dense />
      <q-select v-model="durationType" :options="['ms', 's']" filled dense />
    </div>
  </q-menu>

  <Handle type="source" :position="Position.Right" />
  <Handle type="target" :position="Position.Left" />
</template>

<style scoped lang="scss"></style>
