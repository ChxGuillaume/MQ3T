<script setup lang="ts">
import MqttConnectionDialog from '../components/tab-connections/MqttConnectionDialog.vue'
import MqttConnectionCard from '../components/tab-connections/MqttConnectionCard.vue'
import { useMqttConnectionsStore } from '../store/mqtt-connections'
import { ElectronIpc } from '../../../types/electron-ipc-callbacks'
import { MqttConnection } from '../../../types/mqtt-connection'
import { computed, onMounted, ref } from 'vue'
import draggable from 'vuedraggable'

const mqttConnectionsStore = useMqttConnectionsStore()

const electronApi = window.api as ElectronIpc

const editConnectionDialogOpened = ref(false)
const addConnectionDialogOpened = ref(false)

const editConnection = ref<MqttConnection | undefined>(undefined)

const handleEdit = (connection: MqttConnection) => {
  editConnection.value = connection
  editConnectionDialogOpened.value = true
}

const handleConnect = (connection: MqttConnection) => {
  const clonedConnection = JSON.parse(JSON.stringify(connection))

  electronApi.connectMqtt(Object.assign({}, clonedConnection))
}

const handleDisconnect = (connection: MqttConnection) => {
  electronApi.disconnectMqtt(connection.clientKey)
}

onMounted(() => {
  setTimeout(() => {
    if (mqttConnectionsStore.connections.length === 0) addConnectionDialogOpened.value = true
  }, 200)
})

const connections = computed({
  get: () => {
    return [
      ...mqttConnectionsStore.connections.map((connection) => ({ type: 'connection', connection })),
      { type: 'add-connection' }
    ]
  },
  set: (value) => {
    mqttConnectionsStore.setConnections(
      value.filter((item) => item.type === 'connection').map((item) => item.connection),
      true
    )
  }
})

const dragOptions = computed(() => {
  return {
    animation: 200,
    group: 'mqtt-connections',
    ghostClass: 'ghost'
  }
})
</script>

<template>
  <div class="text-weight-medium tw-bg-neutral-200 tw-p-2 tw-text-center dark:tw-bg-neutral-800">
    Connections
  </div>
  <div class="connections">
    <draggable
      v-model="connections"
      v-bind="dragOptions"
      handle=".drag-handle"
      class="tw-grid tw-grid-cols-1 tw-gap-4 md:tw-grid-cols-2 lg:tw-grid-cols-3 xl:tw-grid-cols-4 2xl:tw-grid-cols-5"
      item-key="clientKey"
    >
      <template #item="{ element }">
        <mqtt-connection-card
          v-if="element.type === 'connection'"
          :connection="element.connection"
          @edit="handleEdit"
          @connect="handleConnect"
          @disconnect="handleDisconnect"
          @delete="mqttConnectionsStore.removeConnection($event.clientKey)"
        />
        <div
          v-else-if="element.type === 'add-connection'"
          class="tw-flex tw-h-full tw-w-full tw-cursor-pointer tw-items-center tw-justify-center tw-rounded tw-transition-colors dark:tw-bg-neutral-900 dark:hover:tw-bg-neutral-800"
          @click="addConnectionDialogOpened = true"
        >
          <q-icon name="fa-solid fa-plus" size="xl" />
        </div>
      </template>
    </draggable>
  </div>

  <mqtt-connection-dialog
    v-model:dialog-opened="addConnectionDialogOpened"
    dialog-type="add"
    @create:connection="mqttConnectionsStore.addConnection($event)"
  />
  <mqtt-connection-dialog
    v-model:dialog-opened="editConnectionDialogOpened"
    dialog-type="edit"
    :connection="editConnection"
    @update:connection="mqttConnectionsStore.updateConnection($event)"
  />
</template>

<style scoped lang="less">
.connections {
  @apply tw-flex tw-flex-col tw-gap-4 tw-p-4;
}
</style>
