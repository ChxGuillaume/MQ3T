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
  <div
    class="text-weight-medium tw-flex tw-justify-between tw-bg-neutral-200 tw-p-2 dark:tw-bg-neutral-800"
  >
    <div class="tw-w-[100px]">
      <q-btn
        size="xs"
        class="tw-bg-white hover:tw-bg-neutral-200 dark:tw-bg-neutral-700"
        flat
        @click="appStore.setCurrentTab('actions')"
      >
        <div class="tw-flex tw-place-items-center tw-gap-2">
          <q-icon name="fa-solid fa-play" size="10px" />
          <span class="tw-text-[0.65rem] tw-leading-[0]">Actions</span>
        </div>
      </q-btn>
    </div>

    <p
      v-if="selectedConnectionObj"
      class="tw-line-clamp-1 tw-overflow-hidden tw-text-ellipsis tw-break-all tw-text-sm tw-text-neutral-500"
      :title="formatMqttUrl(selectedConnectionObj)"
    >
      {{ formatMqttUrl(selectedConnectionObj) }}
    </p>

    <div class="tw-w-[100px] tw-text-right">
      <q-btn
        v-if="
          selectedConnectionObj &&
          mqttConnectionsStore.getConnectionStatus(selectedConnectionObj.clientKey) === 'connected'
        "
        size="xs"
        class="tw-bg-white hover:tw-bg-neutral-200 dark:tw-bg-neutral-700"
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
        class="tw-bg-white hover:tw-bg-neutral-200 dark:tw-bg-neutral-700"
        flat
        @click="mqttConnectionsStore.connectClient(selectedConnectionObj.clientKey)"
      >
        <div class="tw-flex tw-place-items-center tw-gap-2">
          <q-icon name="fa-solid fa-play" size="10px" />
          <span class="tw-text-[0.65rem] tw-leading-[0]">Connect</span>
        </div>
      </q-btn>
    </div>
  </div>
</template>
