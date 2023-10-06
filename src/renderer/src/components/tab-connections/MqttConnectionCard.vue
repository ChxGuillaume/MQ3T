<script setup lang="ts">
import { useMqttConnectionsStore } from '../../store/mqtt-connections'
import { MqttConnection } from '../../../../types/mqtt-connection'
import ConnectionStatusChip from '../ConnectionStatusChip.vue'
import { computed } from 'vue'

const mqttConnectionsStore = useMqttConnectionsStore()

const props = defineProps<{
  connection: MqttConnection
}>()

defineEmits(['edit', 'connect', 'disconnect'])

const connectionStatus = computed(() => {
  return mqttConnectionsStore.getConnectionStatus(props.connection.clientKey)
})

const formatMqttUrl = (connection: MqttConnection) => {
  return `${connection.protocol}://${connection.hostname}:${connection.port}`
}
</script>

<template>
  <q-card flat class="tw-p-4 mqtt-connection-card">
    <div class="tw-text-lg tw-flex tw-justify-between">
      <p class="tw-text-ellipsis tw-overflow-hidden tw-line-clamp-1" :title="connection.name">
        {{ connection.name }}
      </p>
      <connection-status-chip :connection-status="connectionStatus" size="sm" />
    </div>
    <p
      class="tw-text-sm tw-text-neutral-500 tw-text-ellipsis tw-overflow-hidden tw-line-clamp-1"
      :title="formatMqttUrl(connection)"
    >
      {{ formatMqttUrl(connection) }}
    </p>
    <div class="tw-mt-4 tw-flex tw-justify-end tw-gap-2">
      <q-btn color="white" text-color="black" label="Edit" @click="$emit('edit', connection)" />
      <q-btn
        v-if="connectionStatus === 'disconnected'"
        color="primary"
        label="Connect"
        @click="$emit('connect', connection)"
      />
      <q-btn v-else color="primary" label="Disconnect" @click="$emit('disconnect', connection)" />
    </div>
  </q-card>
</template>

<style scoped lang="less">
.body--light {
  .mqtt-connection-card {
    @apply tw-bg-neutral-100;
  }
}
</style>
