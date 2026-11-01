<script setup lang="ts">
import MqttConnectionDialog from '../components/tab-connections/MqttConnectionDialog.vue'
import MqttConnectionCard from '../components/tab-connections/MqttConnectionCard.vue'
import { useMqttConnectionsStore } from '../store/mqtt-connections'
import { MqttConnection } from '../../../types/mqtt-connection'
import { useAppStore } from '@renderer/store/app-store'
import { computed, onMounted, ref } from 'vue'
import draggable from 'vuedraggable'

type ConnectionListItem =
  { type: 'connection'; connection: MqttConnection } | { type: 'add-connection' }

const mqttConnectionsStore = useMqttConnectionsStore()
const appStore = useAppStore()

const editConnectionDialogOpened = ref(false)
const addConnectionDialogOpened = ref(false)

const editConnection = ref<MqttConnection | undefined>(undefined)

const handleEdit = (connection: MqttConnection) => {
  editConnection.value = connection
  editConnectionDialogOpened.value = true
}

const handleConnect = (connection: MqttConnection) => {
  mqttConnectionsStore.connectClient(connection.clientKey)
}

const handleDisconnect = (connection: MqttConnection) => {
  mqttConnectionsStore.disconnectClient(connection.clientKey)
}

onMounted(() => {
  setTimeout(() => {
    if (mqttConnectionsStore.connections.length === 0) addConnectionDialogOpened.value = true
  }, 200)
})

const connections = computed<ConnectionListItem[]>({
  get: (): ConnectionListItem[] => {
    return [
      ...mqttConnectionsStore.connections.map((connection) => ({
        type: 'connection' as const,
        connection
      })),
      { type: 'add-connection' as const }
    ]
  },
  set: (value: ConnectionListItem[]) => {
    const connections = value.flatMap((item) =>
      item.type === 'connection' ? [item.connection] : []
    )

    mqttConnectionsStore.setConnections(connections, true)
  }
})

const dragOptions = computed<{ animation: number; group: string; ghostClass: string }>(() => {
  return {
    animation: 200,
    group: 'mqtt-connections',
    ghostClass: 'ghost'
  }
})
</script>

<template>
  <div class="text-weight-medium flex justify-between bg-neutral-200 p-2 dark:bg-neutral-800">
    <div class="w-[81px]" />

    <div class="bg-neutral-200 text-center dark:bg-neutral-800">Actions</div>

    <div class="w-[81px] text-right">
      <q-btn
        size="xs"
        class="bg-white hover:bg-neutral-200 dark:bg-neutral-700"
        flat
        @click="appStore.setCurrentTab('settings')"
      >
        <q-icon name="fa-solid fa-cog" size="10px" />
      </q-btn>
    </div>
  </div>
  <div class="connections">
    <draggable
      v-model="connections"
      v-bind="dragOptions"
      handle=".drag-handle"
      class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
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
          class="flex h-full w-full cursor-pointer items-center justify-center rounded transition-colors dark:bg-neutral-900 dark:hover:bg-neutral-800"
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
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
}
</style>
