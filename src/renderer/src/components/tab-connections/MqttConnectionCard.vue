<script setup lang="ts">
import { useMqttConnectionsStore } from '../../store/mqtt-connections'
import ConnectionStatusChip from '../ConnectionStatusChip.vue'
import { MqttConnection } from '../../../../types/mqtt-connection'
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
  return `${connection.protocol}://${connection.hostname}:${connection.port}`
}
</script>

<template>
  <q-card flat class="tw-p-4 mqtt-connection-card">
    <div class="tw-flex tw-justify-between">
      <p
        class="tw-text-lg tw-text-ellipsis tw-overflow-hidden tw-line-clamp-1"
        :title="connection.name"
      >
        {{ connection.name }}
      </p>
      <q-btn icon="fa-solid fa-ellipsis-vertical" flat round size="sm">
        <q-menu anchor="bottom right" self="top right">
          <q-list style="min-width: 100px">
            <q-item clickable v-close-popup @click="$emit('edit', connection)">
              <q-item-section>
                <div>
                  <q-icon name="fa-solid fa-edit" class="tw-mr-2" />
                  Edit
                </div>
              </q-item-section>
            </q-item>
            <q-item
              class="tw-text-red-500"
              clickable
              v-close-popup
              @click="$emit('delete', connection)"
            >
              <q-item-section>
                <div>
                  <q-icon name="fa-solid fa-trash" class="tw-mr-2" />
                  Delete
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </div>
    <p
      class="tw-text-sm tw-text-neutral-500 tw-text-ellipsis tw-overflow-hidden tw-line-clamp-1"
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
  </q-card>
</template>

<style scoped lang="less">
.body--light {
  .mqtt-connection-card {
    @apply tw-bg-neutral-100;
  }
}
</style>
