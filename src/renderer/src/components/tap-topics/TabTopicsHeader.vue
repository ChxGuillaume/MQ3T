<script setup lang="ts">
import { useMqttConnectionsStore } from '../../store/mqtt-connections'
import { useMqttUrl } from '@renderer/composables/useMqttUrl'
import { useMqttTopicsStore } from '../../store/mqtt-topics'
import { useAppStore } from '../../store/app-store'
import { computed } from 'vue'

const mqttConnectionsStore = useMqttConnectionsStore()
const mqttTopicsStore = useMqttTopicsStore()
const appStore = useAppStore()

const { formatMqttUrl } = useMqttUrl()

const selectedConnectionObj = computed(() => {
  return mqttConnectionsStore.connections.find(
    (connection) => connection.clientKey === mqttTopicsStore.selectedConnection
  )
})
</script>

<template>
  <div class="text-weight-medium flex justify-between bg-neutral-200 p-2 dark:bg-neutral-800">
    <div class="w-[100px]">
      <q-btn
        size="xs"
        class="bg-white hover:bg-neutral-200 dark:bg-neutral-700"
        flat
        @click="appStore.setSection(mqttTopicsStore.selectedConnection, 'actions')"
      >
        <div class="flex h-[10px] place-items-center gap-2">
          <q-icon name="fa-solid fa-play" size="10px" class="text-accent" />
          <span class="text-[0.65rem]">Actions</span>
        </div>
      </q-btn>
    </div>

    <p
      v-if="selectedConnectionObj"
      class="line-clamp-1 overflow-hidden text-sm break-all text-ellipsis text-neutral-500"
      :title="formatMqttUrl(selectedConnectionObj)"
    >
      {{ formatMqttUrl(selectedConnectionObj) }}
    </p>

    <div class="w-[100px] text-right">
      <q-btn
        v-if="
          selectedConnectionObj &&
          mqttConnectionsStore.getConnectionStatus(selectedConnectionObj.clientKey) === 'connected'
        "
        size="xs"
        class="bg-white hover:bg-neutral-200 dark:bg-neutral-700"
        flat
        @click="mqttConnectionsStore.disconnectClient(selectedConnectionObj.clientKey)"
      >
        <q-icon name="fa-solid fa-link-slash" size="10px" />
        <q-tooltip
          :delay="500"
          anchor="center left"
          self="center right"
          transition-show="jump-left"
          transition-hide="jump-right"
        >
          Disconnect
        </q-tooltip>
      </q-btn>
      <q-btn
        v-else-if="
          selectedConnectionObj &&
          mqttConnectionsStore.getConnectionStatus(selectedConnectionObj.clientKey) !== 'connected'
        "
        size="xs"
        class="bg-white hover:bg-neutral-200 dark:bg-neutral-700"
        flat
        @click="mqttConnectionsStore.connectClient(selectedConnectionObj.clientKey)"
      >
        <div class="flex place-items-center gap-2">
          <q-icon name="fa-solid fa-plug" size="10px" />
          <span class="text-[0.65rem] leading-0">Connect</span>
        </div>
      </q-btn>
    </div>
  </div>
</template>
