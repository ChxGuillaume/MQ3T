<script setup lang="ts">
import MqttConnectionDialog from '../components/tab-connections/MqttConnectionDialog.vue'
import MqttConnectionCard from '../components/tab-connections/MqttConnectionCard.vue'
import { useMqttConnectionsStore } from '../store/mqtt-connections'
import { ElectronIpc } from '../../../types/electron-ipc-callbacks'
import { MqttConnection } from '../../../types/mqtt-connection'
import { useSettingsStore } from '../store/settings-store'
import { ElectronApi } from '../assets/js/electron-api'
import { onMounted, ref } from 'vue'

const mqttConnectionsStore = useMqttConnectionsStore()
const settingsStore = useSettingsStore()

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
        @delete="mqttConnectionsStore.removeConnection($event.clientKey)"
      />
    </div>
  </div>

  <div
    class="tw-fixed tw-bottom-2 tw-right-2 color-details tw-cursor-pointer"
    @click="ElectronApi.checkForUpdates"
  >
    Version {{ settingsStore.appVersion }}
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

<style scoped lang="less"></style>
