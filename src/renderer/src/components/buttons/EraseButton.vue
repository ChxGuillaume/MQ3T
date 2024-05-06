<script setup lang="ts">
const emits = defineEmits(['click'])

const handleClick = () => {
  emits('click')
}
</script>

<template>
  <q-btn
    size="sm"
    class="tw-text-red-500"
    flat
    round
    icon="fa-solid fa-eraser"
    @click="handleClick"
  >
    <q-tooltip class="tw-bg-red-500 tw-text-white" :offset="[5, 5]">Erase</q-tooltip>
  </q-btn>
</template>

<style scoped lang="less"></style>
