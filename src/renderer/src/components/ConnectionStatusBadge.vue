<script setup lang="ts">
import { MqttConnectionStatus } from '../../../types/mqtt-connection'
import { computed } from 'vue'

interface Props {
  status: MqttConnectionStatus
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  status: 'disconnected',
  size: 'md',
  showLabel: false
})

const statusColor = computed(() => {
  switch (props.status) {
    case 'connected':
      return 'bg-green-500'
    case 'connecting':
    case 'reconnecting':
      return 'bg-yellow-500'
    case 'disconnected':
    default:
      return 'bg-red-500'
  }
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'h-2 w-2'
    case 'sm':
      return 'h-3 w-3'
    case 'lg':
      return 'h-5 w-5'
    case 'md':
    default:
      return 'h-4 w-4'
  }
})

const statusLabel = computed(() => {
  switch (props.status) {
    case 'connected':
      return 'Connected'
    case 'connecting':
      return 'Connecting'
    case 'reconnecting':
      return 'Reconnecting'
    case 'disconnected':
    default:
      return 'Disconnected'
  }
})
</script>

<template>
  <div class="flex items-center gap-1.5">
    <div class="rounded-full" :class="[statusColor, sizeClasses]" :title="statusLabel" />
    <span v-if="showLabel" class="text-xs font-medium">{{ statusLabel }}</span>
  </div>
</template>

<style scoped lang="less"></style>
