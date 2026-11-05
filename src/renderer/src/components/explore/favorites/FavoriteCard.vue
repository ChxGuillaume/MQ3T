<script setup lang="ts">
import {
  byteSize,
  compactValue,
  firstNumericPath,
  formatAge,
  formatBytes,
  formatCount,
  numericValue,
  parseMessage,
  readPath,
  sparklinePoints
} from '@renderer/assets/js/payload-insight'
import { useTopicActions } from '@renderer/composables/useTopicActions'
import FavoriteStarButton from '../inspector/FavoriteStarButton.vue'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import { useSharedNow } from '@renderer/composables/useSharedNow'
import TopicTypeTile from '../TopicTypeTile.vue'
import { computed } from 'vue'

const props = defineProps<{ clientKey: string; topic: string }>()

const emit = defineEmits<{ open: [topic: string] }>()

const mqttTopicsStore = useMqttTopicsStore()
const now = useSharedNow()

const { topicLastMessage, menuItems, handleUnfavorite } = useTopicActions({
  clientKey: () => props.clientKey,
  topic: () => props.topic
})

const parts = computed(() => props.topic.split('/'))
const parentPath = computed(() => {
  const parents = parts.value.slice(0, -1)

  return parents.length ? `${parents.join('/')}/` : ''
})
const name = computed(() => parts.value[parts.value.length - 1])

const parsed = computed(() =>
  topicLastMessage.value ? parseMessage(topicLastMessage.value) : null
)

const numericPath = computed(() =>
  parsed.value && (parsed.value.kind === 'json' || parsed.value.kind === 'number')
    ? firstNumericPath(parsed.value.value)
    : null
)

const display = computed(() => {
  const last = topicLastMessage.value

  if (!last || !parsed.value)
    return { value: 'No message yet', big: false, color: 'text-muted', unit: '' }

  const { kind, value } = parsed.value

  if (numericPath.value !== null) {
    return {
      value: String(readPath(value, numericPath.value)),
      big: true,
      color: 'text-code-num',
      unit: numericPath.value
    }
  }

  switch (kind) {
    case 'boolean':
      return { value: String(value), big: true, color: 'text-code-sym', unit: '' }
    case 'binary':
      return {
        value: `binary · ${formatBytes(byteSize(last.message))}`,
        big: false,
        color: 'text-code-bin',
        unit: ''
      }
    case 'json':
      return { value: compactValue(value, 120), big: false, color: 'text-primary', unit: '' }
    case 'empty':
      return { value: 'empty', big: false, color: 'text-dimmed', unit: '' }
  }

  const text = String(value)

  return {
    value: text.length > 120 ? `${text.slice(0, 119)}…` : text,
    big: text.length <= 12,
    color: 'text-code-str',
    unit: ''
  }
})

const spark = computed(() => {
  if (numericPath.value === null) return ''

  const messages = mqttTopicsStore.topicsMessages[props.clientKey]?.[props.topic] ?? []
  const values = messages
    .slice(-30)
    .map((message) => numericValue(message, numericPath.value!))
    .filter((v): v is number => v !== null)

  return sparklinePoints(values, 120, 36)
})

const age = computed(() =>
  topicLastMessage.value
    ? formatAge(now.value.getTime() - topicLastMessage.value.createdAt.getTime())
    : ''
)

const meta = computed(() => {
  const last = topicLastMessage.value

  if (!last) return ''

  return `${last.retained ? 'Retained · ' : ''}QoS ${last.qos}`
})

const messagesCount = computed(
  () =>
    `${formatCount(mqttTopicsStore.getSubTopicsMessagesCount(props.clientKey, props.topic))} msgs`
)
</script>

<template>
  <UContextMenu :items="menuItems">
    <article
      class="bg-default flex cursor-pointer flex-col gap-3 rounded-lg border p-3.5 transition-colors"
      :class="age === 'now' ? 'border-primary' : 'border-default hover:border-accented'"
      @click="emit('open', topic)"
    >
      <div class="flex items-start gap-2.5">
        <TopicTypeTile :kind="parsed?.kind ?? 'empty'" />
        <div class="min-w-0 flex-1">
          <div class="text-muted truncate font-mono text-xs" :title="topic">{{ parentPath }}</div>
          <div class="truncate font-mono text-[15px] font-bold">{{ name || '(empty)' }}</div>
        </div>
        <span class="text-xs" :class="age === 'now' ? 'text-primary font-bold' : 'text-muted'">
          {{ age }}
        </span>
        <FavoriteStarButton favorite size="sm" class="-mt-1" @click="handleUnfavorite" />
      </div>
      <div class="flex min-h-11 items-end gap-3">
        <span
          class="min-w-0 font-mono leading-tight font-bold break-all"
          :class="[display.color, display.big ? 'text-[26px]' : 'line-clamp-2 text-[13px]']"
        >
          {{ display.value }}
        </span>
        <span v-if="display.unit" class="text-muted text-xs">{{ display.unit }}</span>
        <svg
          v-if="spark"
          aria-hidden="true"
          width="120"
          height="36"
          viewBox="0 0 120 36"
          fill="none"
          class="stroke-primary ml-auto shrink-0"
          stroke-width="1.5"
          stroke-linejoin="round"
          stroke-linecap="round"
        >
          <polyline :points="spark" />
        </svg>
      </div>
      <div class="text-muted flex justify-between text-xs">
        <span>{{ meta }}</span>
        <span>{{ messagesCount }}</span>
      </div>
    </article>
  </UContextMenu>
</template>
