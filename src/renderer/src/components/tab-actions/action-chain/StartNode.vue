<script setup>
import { Handle, Position } from '@vue-flow/core'

defineProps(['id'])
</script>

<template>
  <div class="flex items-center justify-center gap-2 text-lg">
    <q-icon name="fa-solid fa-flag-checkered" />
    Start
  </div>

  <Handle type="source" :position="Position.Right" />
</template>
