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
      return 'tw-bg-green-500'
    case 'connecting':
    case 'reconnecting':
      return 'tw-bg-yellow-500'
    case 'disconnected':
    default:
      return 'tw-bg-red-500'
  }
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'tw-h-2 tw-w-2'
    case 'sm':
      return 'tw-h-3 tw-w-3'
    case 'lg':
      return 'tw-h-5 tw-w-5'
    case 'md':
    default:
      return 'tw-h-4 tw-w-4'
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
  <div class="tw-flex tw-items-center tw-gap-1.5">
    <div class="tw-rounded-full" :class="[statusColor, sizeClasses]" :title="statusLabel" />
    <span v-if="showLabel" class="tw-text-xs tw-font-medium">{{ statusLabel }}</span>
  </div>
</template>

<style scoped lang="less"></style>
