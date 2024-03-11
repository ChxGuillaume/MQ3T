<script setup lang="ts">
import MqttConnectionCardContextMenu from './MqttConnectionCardContextMenu.vue'
import { useMqttConnectionsStore } from '../../store/mqtt-connections'
import { MqttConnection } from '../../../../types/mqtt-connection'
import ConnectionStatusChip from '../ConnectionStatusChip.vue'
import { computed } from 'vue'

const mqttConnectionsStore = useMqttConnectionsStore()

const props = defineProps<{
  connection: MqttConnection
}>()

defineEmits(['edit', 'connect', 'disconnect', 'delete'])

const connectionStatus = computed(() => {
  return mqttConnectionsStore.getConnectionStatus(props.connection.clientKey)
})

const formatMqttUrl = (connection: MqttConnection) => {
  const path = connection.path || ''

  return `${connection.protocol}://${connection.hostname}:${connection.port}${path}`
}
</script>

<template>
  <q-card flat class="tw-p-4 mqtt-connection-card">
    <div class="tw-flex tw-justify-between">
      <p
        class="tw-w-full tw-text-lg tw-text-ellipsis tw-overflow-hidden tw-line-clamp-1 tw-break-all tw-cursor-grab drag-handle"
        :title="connection.name"
      >
        {{ connection.name }}
      </p>
      <q-btn icon="fa-solid fa-ellipsis-vertical" flat round size="sm">
        <mqtt-connection-card-context-menu
          @edit="$emit('edit', connection)"
          @delete="$emit('delete', connection)"
        />
      </q-btn>
    </div>
    <p
      class="tw-text-sm tw-text-neutral-500 tw-text-ellipsis tw-overflow-hidden tw-line-clamp-1 tw-break-all"
      :title="formatMqttUrl(connection)"
    >
      {{ formatMqttUrl(connection) }}
    </p>
    <div class="tw-mt-4 tw-flex tw-justify-between tw-items-center tw-gap-2">
      <connection-status-chip :connection-status="connectionStatus" size="sm" />
      <q-btn
        v-if="connectionStatus === 'disconnected'"
        color="primary"
        label="Connect"
        @click="$emit('connect', connection)"
      />
      <q-btn v-else color="primary" label="Disconnect" @click="$emit('disconnect', connection)" />
    </div>

    <mqtt-connection-card-context-menu
      context-menu
      anchor="bottom right"
      self="top right"
      @edit="$emit('edit', connection)"
      @delete="$emit('delete', connection)"
    />
  </q-card>
</template>

<style scoped lang="less">
.body--light {
  .mqtt-connection-card {
    @apply tw-bg-neutral-100;
  }
}
</style>
