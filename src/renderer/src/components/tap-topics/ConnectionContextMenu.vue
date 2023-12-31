<script setup lang="ts">
import { useMqttConnectionsStore } from '../../store/mqtt-connections'
import { useMqttTopicsStore } from '../../store/mqtt-topics'
import { MqttConnection } from '../../../../types/mqtt-connection'
import { ElectronIpc } from '../../../../types/electron-ipc-callbacks'
import { computed } from 'vue'

const mqttConnectionsStore = useMqttConnectionsStore()
const mqttTopicsStore = useMqttTopicsStore()

const props = defineProps<{
  connection: MqttConnection
}>()

const electronApi = window.api as ElectronIpc

const handleConnect = (connection: MqttConnection) => {
  const clonedConnection = JSON.parse(JSON.stringify(connection))

  electronApi.connectMqtt(Object.assign({}, clonedConnection))
}

const handleDisconnect = (connection: MqttConnection) => {
  electronApi.disconnectMqtt(connection.clientKey)
}

const handleReconnect = (connection: MqttConnection) => {
  handleDisconnect(connection)

  setTimeout(() => {
    handleConnect(connection)
  }, 1000)
}

const handleHideConnection = (connection: MqttConnection) => {
  setTimeout(() => {
    mqttConnectionsStore.hideConnection(connection.clientKey)
  }, 50)
}

const connectionStatus = computed(() => {
  return mqttConnectionsStore.getConnectionStatus(props.connection.clientKey)
})
</script>

<template>
  <q-menu touch-position context-menu>
    <q-list dense style="min-width: 220px" bordered>
      <template v-if="connectionStatus === 'disconnected'">
        <q-item
          v-close-popup
          class="tw-text-green-500"
          clickable
          @click="handleConnect(connection)"
        >
          <q-item-section>
            <div>
              <q-icon name="fa-solid fa-plug" class="tw-mr-2" />
              Connect
            </div>
          </q-item-section>
        </q-item>
        <q-item
          v-close-popup
          class="tw-text-neutral-400"
          clickable
          @click="handleHideConnection(connection)"
        >
          <q-item-section>
            <div>
              <q-icon name="fa-solid fa-eye-slash" class="tw-mr-2" />
              Hide Connection
            </div>
          </q-item-section>
        </q-item>
      </template>
      <template v-else>
        <q-item
          v-close-popup
          class="tw-text-amber-500"
          clickable
          @click="handleReconnect(connection)"
        >
          <q-item-section>
            <div>
              <q-icon name="fa-solid fa-sync" class="tw-mr-2" />
              Reconnect
            </div>
          </q-item-section>
        </q-item>
        <q-item
          v-close-popup
          class="tw-text-red-500"
          clickable
          @click="handleDisconnect(connection)"
        >
          <q-item-section>
            <div>
              <q-icon name="fa-solid fa-times" class="tw-mr-2" />
              Disconnect
            </div>
          </q-item-section>
        </q-item>
      </template>
      <q-separator />
      <q-item
        clickable
        v-close-popup
        @click="mqttTopicsStore.clearConnectionMessages(connection.clientKey)"
      >
        <q-item-section class="tw-flex">
          <div>
            <q-icon name="fa-solid fa-trash" class="tw-mr-2" />
            Clear All Topics
          </div>
        </q-item-section>
      </q-item>
    </q-list>
  </q-menu>
</template>

<style scoped lang="less"></style>
