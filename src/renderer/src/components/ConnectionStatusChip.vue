<script setup lang="ts">
import { statusDotClass, statusLabel } from '@renderer/composables/useConnectionStatus'
import { MqttConnectionStatus } from '../../../types/mqtt-connection'
import { computed } from 'vue'

interface Props {
  connectionStatus: MqttConnectionStatus
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
}

const props = withDefaults(defineProps<Props>(), { size: 'md' })

const badgeSize = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'sm'
    case 'sm':
    case 'md':
      return 'md'
    default:
      return 'lg'
  }
})
</script>

<template>
  <UBadge
    color="neutral"
    variant="soft"
    :size="badgeSize"
    class="gap-1.5 rounded-full font-semibold"
  >
    <span class="size-2 rounded-full" :class="statusDotClass(connectionStatus)" />
    {{ statusLabel(connectionStatus) }}
  </UBadge>
</template>
