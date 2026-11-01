<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'

defineProps<{ id: string; selected?: boolean }>()
</script>

<template>
  <div
    class="bg-primary text-inverted flex h-9 items-center rounded-full px-4 text-[13px] font-bold"
    :class="{ 'ring-primary/40 ring-4': selected }"
  >
    Start
  </div>

  <Handle type="source" :position="Position.Right" />
</template>
