<script setup lang="ts">
import { statusDotClass, statusLabel } from '@renderer/composables/useConnectionStatus'
import { AppPlatform, ElectronApi } from '@renderer/assets/js/electron-api'
import { useMqttConnectionsStore } from '@renderer/store/mqtt-connections'
import GraphList from '@renderer/components/tap-topics/GraphList.vue'
import { graphTimeWindows } from '@renderer/assets/js/data-graph'
import { useDataGraphsStore } from '@renderer/store/data-graphs'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import type { DropdownMenuItem } from '@nuxt/ui'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const mqttConnectionsStore = useMqttConnectionsStore()
const mqttTopicsStore = useMqttTopicsStore()
const dataGraphStore = useDataGraphsStore()
const route = useRoute()

const isMac = AppPlatform === 'darwin'

const clientKey = ref(typeof route.query.clientKey === 'string' ? route.query.clientKey : '')
const timeWindow = ref(300_000)
const pausedAt = ref<number | null>(null)
const alwaysOnTop = ref(false)

const graphClientKeys = computed(() => [
  ...new Set(dataGraphStore.dataGraph.map((graph) => graph.clientKey))
])

const activeClientKey = computed(() =>
  graphClientKeys.value.includes(clientKey.value) ? clientKey.value : graphClientKeys.value[0]
)

const connectionName = (key?: string) =>
  (key && mqttConnectionsStore.getConnection(key)?.name) || 'Unknown connection'

const connectionItems = computed<DropdownMenuItem[]>(() =>
  graphClientKeys.value.map((key) => ({
    label: connectionName(key),
    type: 'checkbox' as const,
    checked: key === activeClientKey.value,
    onSelect: () => (clientKey.value = key)
  }))
)

const timeWindowLabel = computed(() => {
  const item = graphTimeWindows.find((w) => w.value === timeWindow.value)
  return item?.value ? `Last ${item.label}` : 'All data'
})

const timeWindowItems = computed<DropdownMenuItem[]>(() =>
  graphTimeWindows.map((item) => ({
    label: item.value ? `Last ${item.label}` : 'All data',
    type: 'checkbox' as const,
    checked: item.value === timeWindow.value,
    onSelect: () => (timeWindow.value = item.value)
  }))
)

const togglePause = () => {
  pausedAt.value = pausedAt.value ? null : Date.now()
}

const toggleAlwaysOnTop = () => {
  alwaysOnTop.value = !alwaysOnTop.value
  ElectronApi.setGraphWindowAlwaysOnTop(alwaysOnTop.value)
}

onMounted(() => {
  dataGraphStore.initStore()
  mqttTopicsStore.initStore()

  ElectronApi.handleLoadMqttConnections((_, connections) => {
    mqttConnectionsStore.setConnections(connections)
  })

  ElectronApi.handleMqttStatus((_, value) => {
    mqttConnectionsStore.setConnectionStatus(value.clientKey, value.status)
  })

  ElectronApi.handleMqttMessage((_, { clientKey, topic, message, packet }) => {
    mqttTopicsStore.addMessage(clientKey, topic, message, packet)
  })

  ElectronApi.handleGraphWindowConnection((_, key) => {
    clientKey.value = key
  })

  ElectronApi.initRenderer()
  ElectronApi.requestMqttMessages()
})
</script>

<template>
  <div class="graph-view flex h-full flex-col overflow-hidden">
    <header
      class="border-default bg-chrome flex h-[46px] shrink-0 items-center gap-2 border-b [-webkit-app-region:drag]"
      :class="isMac ? 'pl-[92px]' : 'pl-3'"
    >
      <span class="text-highlighted text-[13px] font-bold">Graphs</span>

      <UDropdownMenu
        v-if="activeClientKey"
        :items="connectionItems"
        :disabled="graphClientKeys.length < 2"
      >
        <UButton
          color="neutral"
          variant="ghost"
          size="sm"
          :trailing-icon="graphClientKeys.length > 1 ? 'i-lucide-chevron-down' : undefined"
          class="text-muted min-w-0 text-xs font-medium [-webkit-app-region:no-drag] disabled:opacity-100"
        >
          <span
            class="size-2 shrink-0 rounded-full"
            :class="statusDotClass(mqttConnectionsStore.getConnectionStatus(activeClientKey))"
            :title="statusLabel(mqttConnectionsStore.getConnectionStatus(activeClientKey))"
          />
          <span class="truncate">{{ connectionName(activeClientKey) }}</span>
        </UButton>
      </UDropdownMenu>

      <div class="ml-auto flex items-center gap-1.5 pr-2 [-webkit-app-region:no-drag]">
        <UDropdownMenu :items="timeWindowItems" :content="{ align: 'end' }">
          <UButton
            :label="timeWindowLabel"
            trailing-icon="i-lucide-chevron-down"
            color="neutral"
            variant="outline"
            size="sm"
          />
        </UDropdownMenu>
        <UButton
          :icon="pausedAt ? 'i-lucide-play' : 'i-lucide-pause'"
          :label="pausedAt ? 'Resume' : 'Pause'"
          :aria-pressed="!!pausedAt"
          color="neutral"
          variant="outline"
          size="sm"
          @click="togglePause"
        />
        <UTooltip :text="alwaysOnTop ? 'Stop keeping on top' : 'Keep on top'">
          <UButton
            :icon="alwaysOnTop ? 'i-lucide-pin' : 'i-lucide-pin-off'"
            color="neutral"
            variant="ghost"
            size="sm"
            aria-label="Keep on top"
            :aria-pressed="alwaysOnTop"
            :class="alwaysOnTop ? 'bg-primary/10 text-primary' : 'text-muted'"
            @click="toggleAlwaysOnTop"
          />
        </UTooltip>
      </div>

      <div v-if="!isMac" class="w-[138px] shrink-0 self-stretch" />
    </header>

    <div class="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-2.5">
      <graph-list
        v-if="activeClientKey"
        :client-key="activeClientKey"
        :time-window="timeWindow"
        :paused-at="pausedAt"
        compact
      />
      <UEmpty
        v-else
        icon="i-lucide-chart-line"
        title="No graphs yet"
        description="Add graphs from the Graphs section of a connection."
        variant="naked"
        class="py-16"
      />
    </div>
  </div>
</template>
