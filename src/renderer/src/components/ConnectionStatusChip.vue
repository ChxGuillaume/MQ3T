<script setup lang="ts">
import { MqttConnectionStatus } from '../../../types/mqtt-connection'
import { computed } from 'vue'

interface Props {
  connectionStatus: MqttConnectionStatus
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
}

const props = withDefaults(defineProps<Props>(), { connectionStatus: 'disconnected', size: 'md' })

const color = computed(() => {
  switch (props.connectionStatus) {
    case 'connected':
      return 'green'
    case 'connecting':
    case 'reconnecting':
      return 'yellow'
    default:
      return 'red'
  }
})

const label = computed(() => {
  switch (props.connectionStatus) {
    case 'connected':
      return 'Connected'
    case 'connecting':
      return 'Connecting'
    case 'disconnected':
      return 'Disconnected'
    case 'reconnecting':
      return 'Reconnecting'
    default:
      return 'Unknown'
  }
})

const textColor = computed(() => {
  switch (props.connectionStatus) {
    case 'connecting':
    case 'reconnecting':
      return 'black'
    default:
      return 'white'
  }
})
</script>

<template>
  <q-chip
    class="text-weight-bold"
    :text-color="textColor"
    :color="color"
    :label="label"
    :size="size"
  />
</template>

<style scoped lang="less"></style>
