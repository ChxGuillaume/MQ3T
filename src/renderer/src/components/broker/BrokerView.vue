<script setup lang="ts">
import { formatDuration, useBrokerStats } from '@renderer/composables/useBrokerStats'
import { protocolVersionLabel } from '@renderer/composables/useConnectionStatus'
import { useMqttConnectionsStore } from '@renderer/store/mqtt-connections'
import { useAppNavigation } from '@renderer/composables/useAppNavigation'
import { ElectronApi } from '@renderer/assets/js/electron-api'
import { useMqttUrl } from '@renderer/composables/useMqttUrl'
import { useAppStore } from '@renderer/store/app-store'
import { useToast } from '@nuxt/ui/composables'
import { useIntervalFn, useNow } from '@vueuse/core'
import { computed } from 'vue'

const mqttConnectionsStore = useMqttConnectionsStore()
const appStore = useAppStore()
const toast = useToast()

const { selectedClientKey } = useAppNavigation()
const { formatMqttUrl } = useMqttUrl()

const { brokerType, name, uptimeSeconds, stats, clients, emqxNodes } =
  useBrokerStats(selectedClientKey)

const now = useNow({ scheduler: (cb) => useIntervalFn(cb, 30_000) })

const connection = computed(() => mqttConnectionsStore.getConnection(selectedClientKey.value))

const connectedFor = computed(() => {
  const since = mqttConnectionsStore.connectedAt[selectedClientKey.value]
  if (!since) return 'Not connected'

  return formatDuration(Math.max(0, (now.value.getTime() - since) / 1000))
})

const clientsBar = computed(() => {
  if (!clients.value) return null

  const { connected, disconnected = 0, peak } = clients.value
  const total = Math.max(peak ?? 0, connected + disconnected, 1)

  return {
    connected: (connected / total) * 100,
    disconnected: (disconnected / total) * 100
  }
})

const clientsLabel = computed(() => {
  if (!clients.value) return ''

  const { connected, disconnected, peak } = clients.value
  const parts = [`${connected} connected`]

  if (disconnected !== undefined) parts.push(`${disconnected} disconnected`)
  if (peak !== undefined) parts.push(`peak ${peak}`)

  return parts.join(', ')
})

const protocolLabel = computed(() => {
  if (!connection.value) return ''

  const transport = {
    mqtt: '',
    mqtts: ' over TLS',
    ws: ' over WebSocket',
    wss: ' over secure WebSocket'
  }[connection.value.protocol]

  return `${protocolVersionLabel(connection.value)}${transport}`
})

const sessionRows = computed(() => {
  const c = connection.value
  if (!c) return []

  const rows = [
    { k: 'Client ID', v: c.clientId },
    { k: 'Protocol', v: protocolLabel.value },
    { k: 'Clean start', v: c.clean === false ? 'no' : 'yes' }
  ]

  if (c.protocolVersion === 5) {
    const expiry = c.properties?.sessionExpiryInterval
    rows.push({
      k: 'Session expiry',
      v: expiry ? `${expiry} s` : c.clean === false ? 'never' : '0 s'
    })
  }

  rows.push({ k: 'Last will', v: c.lastWill?.topic || 'none' })

  return rows
})

const removeSubscription = (index: number) => {
  if (!connection.value) return

  const updated = JSON.parse(JSON.stringify(connection.value))
  updated.subscribedTopics.splice(index, 1)
  mqttConnectionsStore.updateConnection(updated)

  toast.add({
    title: 'Subscription removed',
    description: 'It stops on the next reconnect.',
    icon: 'i-lucide-check'
  })
}

const openIssues = () => ElectronApi.openUrl('https://github.com/ChxGuillaume/MQ3T/issues')
</script>

<template>
  <main v-if="connection" class="flex flex-wrap content-start gap-5 p-6">
    <div class="flex min-w-0 flex-[999_1_640px] flex-col gap-5">
      <div class="bg-muted flex flex-wrap items-center gap-4 rounded-lg p-5">
        <div class="min-w-60 flex-1">
          <div class="text-muted text-[11px] font-semibold tracking-[0.1em] uppercase">
            {{ brokerType === 'Unknown' ? 'Not detected from $SYS' : 'Detected from $SYS' }}
          </div>
          <h1 class="mt-1 mb-0.5 text-[26px] font-bold">{{ name }}</h1>
          <div class="text-muted font-mono text-[13px]">{{ formatMqttUrl(connection) }}</div>
          <div v-if="emqxNodes.length > 1" class="mt-2 flex flex-wrap gap-1.5">
            <span
              v-for="node in emqxNodes"
              :key="node"
              class="bg-default text-muted rounded-full px-2.5 py-0.5 font-mono text-xs"
            >
              {{ node }}
            </span>
          </div>
        </div>
        <div class="flex gap-7">
          <div v-if="brokerType !== 'Unknown'">
            <div class="text-muted text-[11px] font-semibold tracking-[0.1em] uppercase">
              Uptime
            </div>
            <div class="text-lg font-bold">{{ formatDuration(uptimeSeconds) }}</div>
          </div>
          <div>
            <div class="text-muted text-[11px] font-semibold tracking-[0.1em] uppercase">
              Connected for
            </div>
            <div class="text-lg font-bold">{{ connectedFor }}</div>
          </div>
        </div>
      </div>

      <div
        v-if="brokerType === 'Unknown'"
        class="border-default text-muted flex flex-col gap-2 rounded-lg border p-4 text-[13px]"
      >
        <p>
          MQ3T could not read broker details. Either this client lacks permission on the
          <span class="font-mono">$SYS/#</span> topics, it is not subscribed to them, or the broker
          is not supported yet.
        </p>
        <p>
          Feel free to open an issue on the
          <UButton
            label="MQ3T GitHub repository"
            variant="link"
            class="p-0 text-[13px]"
            @click="openIssues"
          />
          with the relevant topics for this broker.
        </p>
      </div>

      <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="border-default flex flex-col gap-1.5 rounded-lg border p-4"
        >
          <span class="text-muted text-xs font-semibold">{{ stat.label }}</span>
          <span class="text-[26px] leading-[30px] font-bold">{{ stat.value }}</span>
          <span class="text-muted truncate text-xs" :title="stat.note">{{ stat.note }}</span>
        </div>
      </div>

      <section v-if="clients && clientsBar" class="flex flex-col gap-2.5">
        <h2 class="text-muted text-[11px] font-semibold tracking-[0.1em] uppercase">Clients</h2>
        <div class="border-default flex flex-col gap-2.5 rounded-lg border p-4">
          <div class="flex justify-between text-[13px]">
            <span>
              <b>{{ clients.connected }}</b> connected
              <span v-if="clients.disconnected !== undefined" class="text-muted">
                · {{ clients.disconnected }} disconnected (persistent sessions)
              </span>
            </span>
            <span v-if="clients.peak !== undefined" class="text-muted">
              peak {{ clients.peak }}
            </span>
          </div>
          <div
            role="img"
            :aria-label="clientsLabel"
            class="bg-muted flex h-2.5 gap-0.5 overflow-hidden rounded-full"
          >
            <span class="bg-primary" :style="{ width: `${clientsBar.connected}%` }" />
            <span
              class="bg-(--ui-text-muted) opacity-45"
              :style="{ width: `${clientsBar.disconnected}%` }"
            />
          </div>
        </div>
      </section>
    </div>

    <aside class="flex min-w-0 flex-[1_1_340px] flex-col gap-5">
      <section class="border-default flex flex-col gap-3 rounded-lg border p-4">
        <div class="flex items-center justify-between">
          <h2 class="text-muted text-[11px] font-semibold tracking-[0.1em] uppercase">
            Subscriptions of this tab
          </h2>
          <UButton
            label="Add"
            color="neutral"
            variant="outline"
            size="sm"
            @click="appStore.openConnectionEditor(connection.clientKey, 'subs')"
          />
        </div>
        <p v-if="!connection.subscribedTopics.length" class="text-muted text-[13px]">
          No subscriptions.
        </p>
        <div
          v-for="(subscription, index) in connection.subscribedTopics"
          :key="`${subscription.topic}-${index}`"
          class="bg-muted flex items-center gap-2 rounded-md px-2.5 py-2"
        >
          <span class="flex-1 truncate font-mono text-[13px] font-semibold">
            {{ subscription.topic }}
          </span>
          <span class="bg-default text-muted rounded-full px-2.5 py-0.5 text-xs">
            QoS {{ subscription.qos }}
          </span>
          <UTooltip text="Remove from this connection">
            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              size="xs"
              class="text-muted"
              aria-label="Unsubscribe"
              @click="removeSubscription(index)"
            />
          </UTooltip>
        </div>
      </section>

      <section class="border-default flex flex-col gap-2.5 rounded-lg border p-4 text-[13px]">
        <h2 class="text-muted text-[11px] font-semibold tracking-[0.1em] uppercase">Session</h2>
        <div v-for="row in sessionRows" :key="row.k" class="flex justify-between gap-3">
          <span class="text-muted shrink-0">{{ row.k }}</span>
          <span class="truncate text-right font-mono font-semibold" :title="row.v">
            {{ row.v }}
          </span>
        </div>
        <UButton
          label="Edit connection"
          color="neutral"
          variant="outline"
          class="mt-1 self-start"
          @click="appStore.openConnectionEditor(connection.clientKey)"
        />
      </section>
    </aside>
  </main>
</template>
