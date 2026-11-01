<script setup lang="ts">
import { useConnectionActions } from '@renderer/composables/useConnectionActions'
import { useMqttConnectionsStore } from '@renderer/store/mqtt-connections'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import { useAppStore } from '@renderer/store/app-store'
import { computed } from 'vue'

const props = defineProps<{ clientKey: string }>()

const mqttConnectionsStore = useMqttConnectionsStore()
const mqttTopicsStore = useMqttTopicsStore()
const appStore = useAppStore()

const { reconnect } = useConnectionActions()

const status = computed(() => mqttConnectionsStore.getConnectionStatus(props.clientKey))
const attempts = computed(() => mqttConnectionsStore.reconnectAttempts[props.clientKey] ?? 0)
const error = computed(() => mqttConnectionsStore.lastErrors[props.clientKey])

const title = computed(() => {
  if (status.value === 'disconnected') return 'Disconnected from the broker'

  return attempts.value > 1
    ? `Connection lost. Reconnecting (attempt ${attempts.value})`
    : 'Connection lost. Reconnecting'
})

const lastMessageAt = computed(() => {
  const messages = Object.values(mqttTopicsStore.topicsLastMessage[props.clientKey] ?? {})

  if (!messages.length) return null

  const latest = Math.max(...messages.map((m) => m.createdAt.getTime()))

  return new Date(latest).toLocaleTimeString()
})

const details = computed(() => {
  const parts: string[] = []

  if (error.value) parts.push(`Error: ${error.value}`)
  if (lastMessageAt.value) parts.push(`last message ${lastMessageAt.value}`)

  const prefix = parts.join(' · ')
  const suffix = lastMessageAt.value ? 'The topics below are what was received before.' : ''

  return [prefix, suffix].filter(Boolean).join('. ')
})

const retry = () => {
  if (status.value === 'disconnected') mqttConnectionsStore.connectClient(props.clientKey)
  else reconnect(props.clientKey)
}
</script>

<template>
  <div
    role="status"
    class="bg-warning/10 border-warning mx-4 mt-3 flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3"
  >
    <UIcon name="i-lucide-triangle-alert" class="text-warning size-5 shrink-0" />
    <div class="min-w-0 flex-[1_1_300px]">
      <div class="font-bold">{{ title }}</div>
      <div v-if="details" class="text-muted text-xs">{{ details }}</div>
    </div>
    <UButton
      label="Edit connection"
      color="neutral"
      variant="outline"
      @click="appStore.openConnectionEditor(clientKey)"
    />
    <UButton
      :label="status === 'disconnected' ? 'Connect' : 'Retry now'"
      color="neutral"
      variant="outline"
      class="ring-inverted font-semibold"
      @click="retry"
    />
  </div>
</template>
