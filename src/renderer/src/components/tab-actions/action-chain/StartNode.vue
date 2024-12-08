<script setup>
import { Handle, Position } from '@vue-flow/core'

const props = defineProps(['id'])
</script>

<template>
  <div class="tw-flex tw-items-center tw-justify-center tw-gap-2 tw-text-lg">
    <q-icon name="fa-solid fa-flag-checkered" />
    Start
  </div>

  <Handle type="source" :position="Position.Right" />
</template>
