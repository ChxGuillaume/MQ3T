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
const temporaryShortcut = AppPlatform === 'darwin' ? '⇧⌘T' : 'Ctrl+Shift+T'

const isFiltering = computed(() => search.value.trim().length > 0)

const connections = computed<MqttConnection[]>({
  get: () => {
    const terms = search.value.trim().toLowerCase()

    if (!terms) return mqttConnectionsStore.savedConnections

    return mqttConnectionsStore.savedConnections.filter((connection) =>
      `${connection.name} ${formatMqttUrl(connection)}`.toLowerCase().includes(terms)
    )
  },
  set: (value) => {
    if (isFiltering.value) return

    mqttConnectionsStore.setConnections(
      [...value, ...mqttConnectionsStore.temporaryConnections],
      true
    )
  }
})

const temporaryConnections = computed(() => {
  const terms = search.value.trim().toLowerCase()

  if (!terms) return mqttConnectionsStore.temporaryConnections

  return mqttConnectionsStore.temporaryConnections.filter((connection) =>
    `${connection.name} ${formatMqttUrl(connection)}`.toLowerCase().includes(terms)
  )
})
</script>

<template>
  <WelcomeView v-if="!mqttConnectionsStore.connections.length" />

  <div v-else>
    <main class="mx-auto box-border flex w-full max-w-[1040px] flex-col gap-6 px-6 py-14">
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
          :ui="{ base: 'h-[38px] text-[13px]' }"
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
          <div class="flex min-h-[120px] flex-col gap-2">
            <button
              type="button"
              class="border-default text-muted hover:text-default flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-[1.5px] border-dashed text-sm font-semibold"
              @click="appStore.openConnectionEditor(null)"
            >
              <UIcon name="i-lucide-plus" class="size-[22px]" />
              New connection
            </button>
            <button
              type="button"
              class="text-muted hover:text-warning flex h-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border-[1.5px] border-dashed border-[color-mix(in_oklab,var(--ui-warning)_45%,transparent)] text-[13px] font-semibold"
              :title="`Not saved, discarded when MQ3T closes (${temporaryShortcut})`"
              @click="appStore.openQuickConnect()"
            >
              <UIcon name="i-lucide-timer" class="size-4" />
              Temporary connection
            </button>
          </div>
        </template>
      </draggable>

      <section v-if="temporaryConnections.length" class="flex flex-col gap-3">
        <div>
          <h2 class="flex items-center gap-2 text-base font-bold">
            <UIcon name="i-lucide-timer" class="text-warning size-4" />
            Temporary connections
          </h2>
          <p class="text-muted mt-1 text-[13px]">
            Not saved. They're discarded when MQ3T closes, unless you save them.
          </p>
        </div>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3.5">
          <ConnectionCard
            v-for="connection in temporaryConnections"
            :key="connection.clientKey"
            :connection="connection"
          />
        </div>
      </section>

      <p
        v-if="isFiltering && !connections.length && !temporaryConnections.length"
        class="text-muted text-sm"
      >
        No connection matches “{{ search }}”.
      </p>
    </main>
  </div>
</template>
