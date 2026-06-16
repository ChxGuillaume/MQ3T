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
    class="mqtt-connection-card tw:cursor-pointer tw:rounded tw:border-t-2 tw:p-4 tw:dark:bg-neutral-900 tw:dark:hover:bg-neutral-800"
    :class="getColor(connection.labelColor)?.border ?? 'tw:border-transparent'"
    @click="
      () => {
        if (connectionStatus === 'disconnected') $emit('connect', connection)

        appStore.setCurrentTab('topics')
        mqttTopicsStore.selectedConnection = connection.clientKey
      }
    "
  >
    <div class="tw:flex tw:justify-between">
      <p
        class="drag-handle tw:line-clamp-1 tw:w-full tw:cursor-grab tw:overflow-hidden tw:text-ellipsis tw:break-all tw:text-lg"
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
      class="tw:line-clamp-1 tw:overflow-hidden tw:text-ellipsis tw:break-all tw:text-sm tw:text-neutral-500"
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
