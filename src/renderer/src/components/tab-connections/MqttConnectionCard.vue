<script setup lang="ts">
import MqttConnectionCardContextMenu from './MqttConnectionCardContextMenu.vue'
import { useMqttConnectionsStore } from '@renderer/store/mqtt-connections'
import { useLabelColors } from '@renderer/composables/useLabelColors'
import { MqttConnection } from '../../../../types/mqtt-connection'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import { useMqttUrl } from '../../composables/useMqttUrl'
import { useAppStore } from '@renderer/store/app-store'
import { computed, ref } from 'vue'

const mqttConnectionsStore = useMqttConnectionsStore()
const mqttTopicsStore = useMqttTopicsStore()
const appStore = useAppStore()

const { formatMqttUrl } = useMqttUrl()
const { getColor } = useLabelColors()

const props = defineProps<{ connection: MqttConnection }>()

defineEmits(['edit', 'connect', 'disconnect', 'delete'])

const menuOpened = ref(false)

const connectionStatus = computed(() => {
  return mqttConnectionsStore.getConnectionStatus(props.connection.clientKey)
})
</script>

<template>
  <div
    class="mqtt-connection-card cursor-pointer rounded border-t-2 p-4 dark:bg-neutral-900 dark:hover:bg-neutral-800"
    :class="getColor(connection.labelColor)?.border ?? 'border-transparent'"
    @click="
      () => {
        if (connectionStatus === 'disconnected') $emit('connect', connection)

        appStore.setView('connection')
        mqttTopicsStore.selectedConnection = connection.clientKey
      }
    "
  >
    <div class="flex justify-between">
      <p
        class="drag-handle line-clamp-1 w-full cursor-grab overflow-hidden text-lg break-all text-ellipsis"
        :title="connection.name"
      >
        {{ connection.name }}
      </p>
      <q-btn
        icon="fa-solid fa-ellipsis-vertical"
        flat
        round
        size="sm"
        @click.stop="menuOpened = !menuOpened"
      >
        <mqtt-connection-card-context-menu
          v-model:opened="menuOpened"
          no-parent-behavior
          @edit="$emit('edit', connection)"
          @delete="$emit('delete', connection)"
        />
      </q-btn>
    </div>
    <p
      class="line-clamp-1 overflow-hidden text-sm break-all text-ellipsis text-neutral-500"
      :title="formatMqttUrl(connection)"
    >
      {{ formatMqttUrl(connection) }}
    </p>

    <mqtt-connection-card-context-menu
      context-menu
      anchor="bottom right"
      self="top right"
      @edit="$emit('edit', connection)"
      @delete="$emit('delete', connection)"
    />
  </div>
</template>

<style scoped lang="less">
.body--light {
  .mqtt-connection-card {
    background-color: #f5f5f5;
  }
}
</style>
