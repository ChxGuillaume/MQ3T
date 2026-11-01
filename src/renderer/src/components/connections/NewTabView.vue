<script setup lang="ts">
import ConnectionCard from '@renderer/components/connections/ConnectionCard.vue'
import WelcomeView from '@renderer/components/connections/WelcomeView.vue'
import { useMqttConnectionsStore } from '@renderer/store/mqtt-connections'
import { MqttConnection } from '../../../../types/mqtt-connection'
import { useMqttUrl } from '@renderer/composables/useMqttUrl'
import { AppPlatform } from '@renderer/assets/js/electron-api'
import { useAppStore } from '@renderer/store/app-store'
import { computed, ref } from 'vue'
import draggable from 'vuedraggable'

const mqttConnectionsStore = useMqttConnectionsStore()
const appStore = useAppStore()

const { formatMqttUrl } = useMqttUrl()

const search = ref('')

const newTabShortcut = AppPlatform === 'darwin' ? '⌘T' : 'Ctrl+T'

const isFiltering = computed(() => search.value.trim().length > 0)

const connections = computed<MqttConnection[]>({
  get: () => {
    const terms = search.value.trim().toLowerCase()

    if (!terms) return mqttConnectionsStore.connections

    return mqttConnectionsStore.connections.filter((connection) =>
      `${connection.name} ${formatMqttUrl(connection)}`.toLowerCase().includes(terms)
    )
  },
  set: (value) => {
    if (isFiltering.value) return

    mqttConnectionsStore.setConnections(value, true)
  }
})
</script>

<template>
  <WelcomeView v-if="!mqttConnectionsStore.connections.length" />

  <main v-else class="mx-auto box-border flex w-full max-w-[1040px] flex-col gap-6 px-6 py-14">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-[28px] font-bold">Open a connection</h1>
        <p class="text-muted mt-1.5 text-sm">
          Each connection opens in its own tab. {{ newTabShortcut }} brings you back here.
        </p>
      </div>
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Search connections"
        aria-label="Search connections"
        size="lg"
        class="w-[280px]"
        :ui="{ base: 'h-[38px] rounded-[10px] text-[13px]' }"
      />
    </div>

    <draggable
      v-model="connections"
      item-key="clientKey"
      handle=".drag-handle"
      :animation="200"
      :disabled="isFiltering"
      ghost-class="opacity-40"
      class="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3.5"
    >
      <template #item="{ element }">
        <ConnectionCard :connection="element" :draggable="!isFiltering" />
      </template>
      <template #footer>
        <button
          type="button"
          class="border-default text-muted hover:text-default flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-dashed text-sm font-semibold"
          @click="appStore.openConnectionEditor(null)"
        >
          <UIcon name="i-lucide-plus" class="size-[22px]" />
          New connection
        </button>
      </template>
    </draggable>

    <p v-if="isFiltering && !connections.length" class="text-muted text-sm">
      No connection matches “{{ search }}”.
    </p>
  </main>
</template>
