<script setup lang="ts">
import { formatPreciseTime, MAX_PARSE_LENGTH } from '@renderer/assets/js/payload-insight'
import CodePreview from '@renderer/components/tap-topics/CodePreview.vue'
import { useSettingsStore } from '@renderer/store/settings-store'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import { formatCode } from '@renderer/assets/js/format-code'
import { diffMessages } from '@renderer/assets/js/json-diff'
import ChangeLine from '../history/ChangeLine.vue'
import { computed } from 'vue'

const MAX_CHANGES = 5

const props = defineProps<{ clientKey: string; topic: string }>()

const emit = defineEmits<{ select: [topic: string]; publish: [] }>()

const mqttTopicsStore = useMqttTopicsStore()
const settingsStore = useSettingsStore()

const messages = computed(
  () => mqttTopicsStore.topicsMessages[props.clientKey]?.[props.topic] ?? []
)

const last = computed(() => mqttTopicsStore.getTopicLastMessage(props.clientKey, props.topic))

const previous = computed(() => {
  const list = messages.value

  return list.length > 1 ? list[list.length - 2] : undefined
})

const subTopicsCount = computed(
  () =>
    Object.keys(mqttTopicsStore.topicsMessages[props.clientKey] || {}).filter((t) =>
      t.startsWith(`${props.topic}/`)
    ).length
)

const previewHeight = computed(() => {
  if (!last.value) return 0
  if (last.value.message.length > MAX_PARSE_LENGTH) return 480

  const lines = formatCode(last.value.message, last.value.dataType || 'raw').split('\n').length

  return Math.min(480, Math.max(64, lines * 19 + 26))
})

const changes = computed(() => {
  if (!last.value || !previous.value) return null

  return diffMessages(previous.value.message, last.value.message)
})

const time = (date: Date) =>
  formatPreciseTime(date, settingsStore.timeFormat, settingsStore.formatTime)

const isPrintableASCII = (buffer: Buffer): boolean =>
  buffer.every((n) => Number.isInteger(n) && n >= 32 && n <= 126)

const formatCorrelationData = (data: Buffer | string): string => {
  if (typeof data === 'string') return data
  if (isPrintableASCII(data)) return String.fromCharCode(...data)

  return data.toString()
}

const properties = computed(() => {
  const props = last.value?.properties

  if (!props) return []

  const rows: { label: string; value: string; topic?: boolean }[] = []

  if (props.contentType) rows.push({ label: 'Content type', value: props.contentType })
  if (props.messageExpiryInterval)
    rows.push({ label: 'Message expiry', value: `${props.messageExpiryInterval} s` })
  if (props.responseTopic)
    rows.push({ label: 'Response topic', value: props.responseTopic, topic: true })
  if (props.correlationData)
    rows.push({ label: 'Correlation data', value: formatCorrelationData(props.correlationData) })

  Object.entries(props.userProperties || {}).forEach(([key, value]) => {
    rows.push({ label: key, value: Array.isArray(value) ? value.join(', ') : String(value) })
  })

  return rows
})
</script>

<template>
  <UEmpty
    v-if="!last"
    icon="i-lucide-inbox"
    :title="subTopicsCount ? 'This is a topic group' : 'No message on this topic yet'"
    :description="
      subTopicsCount
        ? `${subTopicsCount} sub-topics below. Pick one to see its value.`
        : 'Messages show up here as soon as the broker sends them.'
    "
    variant="naked"
    :actions="[
      {
        label: 'Publish',
        icon: 'i-lucide-send',
        color: 'neutral',
        variant: 'outline',
        onClick: () => emit('publish')
      }
    ]"
  />
  <div v-else class="flex flex-col gap-3.5">
    <div class="bg-muted overflow-hidden rounded-lg" :style="{ height: `${previewHeight}px` }">
      <CodePreview :value="last.message" :language="last.dataType" hide-top-border />
    </div>

    <p class="text-muted text-xs">
      Received {{ settingsStore.formatDate(last.createdAt) }} · {{ time(last.createdAt) }}
    </p>

    <section v-if="properties.length" class="flex flex-col gap-1.5">
      <h2 class="text-muted text-[11px] font-semibold tracking-[0.1em] uppercase">
        MQTT 5 properties
      </h2>
      <dl
        class="border-default grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-md border px-3 py-2 text-xs"
      >
        <template v-for="row in properties" :key="row.label">
          <dt class="text-muted">{{ row.label }}</dt>
          <dd class="font-mono break-all">
            <button
              v-if="row.topic"
              type="button"
              class="text-primary hover:underline"
              @click="emit('select', row.value)"
            >
              {{ row.value }}
            </button>
            <template v-else>{{ row.value }}</template>
          </dd>
        </template>
      </dl>
    </section>

    <section v-if="changes" class="flex flex-col gap-1.5">
      <h2 class="text-muted text-[11px] font-semibold tracking-[0.1em] uppercase">
        Changed since previous
      </h2>
      <div
        v-if="!changes.length"
        class="border-default text-muted flex items-center gap-2.5 rounded-md border px-3 py-2 text-xs"
      >
        Same value as the previous message
        <span class="ml-auto">{{ time(previous!.createdAt) }}</span>
      </div>
      <div
        v-for="(change, index) in changes.slice(0, MAX_CHANGES)"
        :key="change.path"
        class="border-default flex items-center gap-2.5 rounded-md border px-3 py-2"
      >
        <ChangeLine :change="change" class="min-w-0 flex-1 text-[13px]" />
        <span v-if="index === 0" class="text-muted shrink-0 text-xs">{{
          time(last.createdAt)
        }}</span>
      </div>
      <p v-if="changes.length > MAX_CHANGES" class="text-muted text-xs">
        +{{ changes.length - MAX_CHANGES }} more changes, see the History tab
      </p>
    </section>
  </div>
</template>
