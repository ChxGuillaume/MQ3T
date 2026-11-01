<script setup lang="ts">
import {
  connectionInitials,
  labelColorStyle,
  useConnectionActions
} from '@renderer/composables/useConnectionActions'
import { protocolVersionLabel, statusDotClass } from '@renderer/composables/useConnectionStatus'
import { useMqttConnectionsStore } from '@renderer/store/mqtt-connections'
import { useAppNavigation } from '@renderer/composables/useAppNavigation'
import { MqttConnection } from '../../../../types/mqtt-connection'
import { useMqttUrl } from '@renderer/composables/useMqttUrl'
import { computed } from 'vue'

const props = defineProps<{ connection: MqttConnection; draggable?: boolean }>()

const mqttConnectionsStore = useMqttConnectionsStore()

const { connectionItems, isOpen } = useConnectionActions()
const { openConnection } = useAppNavigation()
const { formatMqttUrl } = useMqttUrl()

const status = computed(() => mqttConnectionsStore.getConnectionStatus(props.connection.clientKey))
const opened = computed(() => isOpen(props.connection.clientKey))

const stateLabel = computed(() => {
  if (!opened.value) return 'Not connected'

  switch (status.value) {
    case 'connected':
      return 'Open in a tab'
    case 'connecting':
      return 'Connecting'
    case 'reconnecting':
      return 'Reconnecting'
    default:
      return 'Disconnected'
  }
})

const subscriptionsLabel = computed(() => {
  const count = props.connection.subscribedTopics.length

  return `${count} subscription${count === 1 ? '' : 's'}`
})

const items = computed(() => connectionItems(props.connection))
</script>

<template>
  <div class="flex">
    <UContextMenu :items="items">
      <article
        class="border-default bg-default flex flex-1 flex-col gap-3.5 rounded-[14px] border p-4"
      >
        <div class="flex items-center gap-3">
          <span
            aria-hidden="true"
            class="flex size-10 shrink-0 items-center justify-center rounded-[10px] border-[1.5px] border-current text-sm font-bold"
            :class="[
              connection.labelColor ? '' : 'text-primary',
              { 'drag-handle cursor-grab': draggable }
            ]"
            :style="labelColorStyle(connection.labelColor)"
          >
            {{ connectionInitials(connection.name) }}
          </span>
          <div class="min-w-0 flex-1" :class="{ 'drag-handle cursor-grab': draggable }">
            <div class="truncate font-bold" :title="connection.name">{{ connection.name }}</div>
            <div class="text-muted truncate font-mono text-xs" :title="formatMqttUrl(connection)">
              {{ formatMqttUrl(connection) }}
            </div>
          </div>
          <UDropdownMenu :items="items" :content="{ align: 'end' }">
            <UButton
              icon="i-lucide-ellipsis"
              color="neutral"
              variant="ghost"
              class="text-muted"
              aria-label="Connection options"
            />
          </UDropdownMenu>
        </div>

        <div class="flex flex-wrap items-center gap-1.5">
          <span class="bg-muted text-muted rounded-full px-2.5 py-0.5 text-xs">
            {{ protocolVersionLabel(connection) }}
          </span>
          <span class="bg-muted text-muted rounded-full px-2.5 py-0.5 text-xs">
            {{ subscriptionsLabel }}
          </span>
          <span
            class="ml-1 flex items-center gap-1.5 text-xs font-semibold"
            :class="opened ? 'text-default' : 'text-muted'"
          >
            <span
              class="size-2 rounded-full"
              :class="opened ? statusDotClass(status) : 'bg-(--ui-text-muted)'"
            />
            {{ stateLabel }}
          </span>
          <UButton
            v-if="opened"
            label="Go to tab"
            color="neutral"
            variant="outline"
            class="ml-auto font-semibold"
            @click="openConnection(connection.clientKey)"
          />
          <UButton
            v-else
            label="Connect"
            class="ml-auto font-semibold"
            @click="openConnection(connection.clientKey)"
          />
        </div>
      </article>
    </UContextMenu>
  </div>
</template>
