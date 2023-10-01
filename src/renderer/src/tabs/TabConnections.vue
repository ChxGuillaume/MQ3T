<script setup lang="ts">
import MqttConnectionCard from '../components/tab-connections/MqttConnectionCard.vue'
import { useMqttConnectionsStore } from '../store/mqtt-connections'
import { ElectronIpc } from '../../../types/electron-ipc-callbacks'
import { MqttConnection } from '../../../types/mqtt-connection'
import { onMounted, ref } from 'vue'
import MqttConnectionDialog from '../components/tab-connections/MqttConnectionDialog.vue'

const mqttConnectionsStore = useMqttConnectionsStore()

const electronApi = window.api as ElectronIpc

const addConnectionDialogOpened = ref(false)
const editConnectionDialogOpened = ref(false)

const editConnection = ref<MqttConnection | null>(null)

const handleEdit = (connection: MqttConnection) => {
  console.log('handleEdit', connection)

  editConnection.value = connection

  editConnectionDialogOpened.value = true
}

const handleConnect = (connection: MqttConnection) => {
  console.log('handleConnect', connection)
  console.log('handleConnect', Object.assign({}, connection))
  electronApi.connectMqtt(Object.assign({}, connection))
}

const handleDisconnect = (connection: MqttConnection) => {
  console.log('handleDisconnect', connection)
  electronApi.disconnectMqtt(connection.clientKey)
}

onMounted(() => {
  if (mqttConnectionsStore.connections.length === 0) addConnectionDialogOpened.value = true
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

    <div
      class="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 xl:tw-grid-cols-4 2xl:tw-grid-cols-5 tw-gap-4"
    >
      <mqtt-connection-card
        v-for="connection in mqttConnectionsStore.connections"
        :key="connection.name"
        :connection="connection"
        @edit="handleEdit"
        @connect="handleConnect"
        @disconnect="handleDisconnect"
      />
    </div>
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
    @delete:connection="mqttConnectionsStore.removeConnection($event.clientKey)"
  />
</template>

<style scoped lang="less"></style>
