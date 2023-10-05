<script setup lang="ts">
import { useMqttConnectionsStore } from '../../store/mqtt-connections'
import { MqttConnection } from '../../../../types/mqtt-connection'
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
      <q-chip
        v-if="connectionStatus === 'connected'"
        class="text-weight-bold"
        size="sm"
        color="green"
        text-color="white"
        label="Connected"
      />
      <q-chip
        v-else-if="connectionStatus === 'connecting'"
        class="text-weight-bold"
        size="sm"
        color="yellow"
        text-color="black"
        label="Connecting"
      />
      <q-chip
        v-else
        class="text-weight-bold"
        size="sm"
        color="red"
        text-color="white"
        label="Disconnected"
      />
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
