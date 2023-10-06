<script setup lang="ts">
defineProps<{
  connectionStatus: 'connected' | 'connecting' | 'disconnected'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
}>()
</script>

<template>
  <q-chip
    v-if="connectionStatus === 'connected'"
    class="text-weight-bold"
    :size="size || 'md'"
    color="green"
    text-color="white"
    label="Connected"
  />
  <q-chip
    v-else-if="connectionStatus === 'connecting'"
    class="text-weight-bold"
    :size="size || 'md'"
    color="yellow"
    text-color="black"
    label="Connecting"
  />
  <q-chip
    v-else
    class="text-weight-bold"
    :size="size || 'md'"
    color="red"
    text-color="white"
    label="Disconnected"
  />
</template>

<style scoped lang="less"></style>
