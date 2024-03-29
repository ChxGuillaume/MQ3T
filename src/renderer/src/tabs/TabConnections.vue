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
  get: () => mqttConnectionsStore.connections,
  set: (value) => mqttConnectionsStore.setConnections(value, true)
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
  <div class="connections">
    <div class="tw-mb-3 tw-flex tw-justify-between tw-items-center">
      <h1 class="tw-text-xl tw-font-bold">Connections</h1>
      <q-btn color="primary" @click="addConnectionDialogOpened = true">
        <q-icon class="tw-mr-2" size="xs" name="fa-solid fa-plus" />
        Add Connection
      </q-btn>
    </div>

    <draggable
      v-model="connections"
      v-bind="dragOptions"
      handle=".drag-handle"
      class="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 xl:tw-grid-cols-4 2xl:tw-grid-cols-5 tw-gap-4"
      item-key="clientKey"
    >
      <template #item="{ element }">
        <mqtt-connection-card
          :connection="element"
          @edit="handleEdit"
          @connect="handleConnect"
          @disconnect="handleDisconnect"
          @delete="mqttConnectionsStore.removeConnection($event.clientKey)"
        />
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
  @apply tw-p-4;
}
</style>
