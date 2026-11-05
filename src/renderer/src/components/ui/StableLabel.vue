<script setup lang="ts">
defineProps<{ text: string }>()
</script>

<template>
  <span class="inline-grid justify-items-center">
    <span class="col-start-1 row-start-1">{{ text }}</span>
    <span class="invisible col-start-1 row-start-1 font-bold" aria-hidden="true">{{ text }}</span>
  </span>
</template>
