<script setup lang="ts">
import {
  firstNumericPath,
  formatAge,
  formatCount,
  numericValue,
  parseMessage,
  sparklinePoints
} from '@renderer/assets/js/payload-insight'
import { useTopicActions } from '@renderer/composables/useTopicActions'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import { useSharedNow } from '@renderer/composables/useSharedNow'
import { useAppStore } from '@renderer/store/app-store'
import { useElementVisibility } from '@vueuse/core'
import TopicValuePreview from './TopicValuePreview.vue'
import { computed, useTemplateRef, watch } from 'vue'
import TopicTypeTile from './TopicTypeTile.vue'
import ActivityLayer from './ActivityLayer.vue'

const props = defineProps<{
  clientKey: string
  topic: string
  label: string
  tone: 'root' | 'surface' | 'muted'
  wide?: boolean
}>()

const emit = defineEmits<{ select: [topic: string] }>()

const mqttTopicsStore = useMqttTopicsStore()
const appStore = useAppStore()
const now = useSharedNow()

const rowRef = useTemplateRef('rowRef')
const activityRef = useTemplateRef('activityRef')

const visible = useElementVisibility(rowRef, { rootMargin: '200px' })

const { hasActions, favoritedTopics, isSelectedTopic, topicLastMessage, menuItems } =
  useTopicActions({
    clientKey: () => props.clientKey,
    topic: () => props.topic
  })

const parsed = computed(() =>
  topicLastMessage.value ? parseMessage(topicLastMessage.value) : null
)

const messagesCount = computed(() =>
  formatCount(mqttTopicsStore.getSubTopicsMessagesCount(props.clientKey, props.topic))
)

const age = computed(() => {
  if (!topicLastMessage.value) return ''

  return formatAge(now.value.getTime() - topicLastMessage.value.createdAt.getTime())
})

const spark = computed(() => {
  if (!visible.value || !parsed.value) return ''
  if (parsed.value.kind !== 'number' && parsed.value.kind !== 'json') return ''

  const path = firstNumericPath(parsed.value.value)

  if (path === null) return ''

  const messages = mqttTopicsStore.topicsMessages[props.clientKey]?.[props.topic] ?? []
  const values = messages
    .slice(-20)
    .map((message) => numericValue(message, path))
    .filter((value): value is number => value !== null)

  return sparklinePoints(values)
})

const toneClass = computed(() => {
  if (isSelectedTopic.value) return 'bg-primary/10 ring-[1.5px] ring-inset ring-primary'
  if (props.tone === 'root') return 'border border-default bg-default hover:bg-muted'
  if (props.tone === 'surface') return 'bg-muted hover:bg-accented'

  return 'bg-default hover:bg-elevated'
})

watch(
  () => topicLastMessage.value,
  () => {
    if (!visible.value) return

    activityRef.value?.animate()
  }
)
</script>

<template>
  <UContextMenu :items="menuItems">
    <div
      ref="rowRef"
      role="treeitem"
      :aria-selected="isSelectedTopic"
      :data-topic-path="topic"
      class="relative flex h-11 w-full shrink-0 cursor-pointer items-center gap-3 overflow-hidden rounded-lg px-2.5 select-none"
      :class="[toneClass, { 'transition-colors': !appStore.isScrubbingTopics }]"
      @click="emit('select', topic)"
    >
      <template v-if="visible">
        <TopicTypeTile :kind="parsed?.kind ?? 'empty'" />
        <span
          class="flex shrink-0 items-center gap-1.5 overflow-hidden text-left font-mono text-[13px] font-semibold"
          :class="wide ? 'max-w-[50%]' : 'w-[120px]'"
          :title="topic"
        >
          <span class="truncate" :class="{ 'text-dimmed italic': !label }">
            {{ label || '(empty)' }}
          </span>
          <UIcon v-if="favoritedTopics" name="i-lucide-star" class="text-primary size-3 shrink-0" />
          <UIcon v-if="hasActions" name="i-lucide-play" class="text-accent size-3 shrink-0" />
        </span>
        <TopicValuePreview :message="topicLastMessage" />
        <svg
          v-if="spark"
          aria-hidden="true"
          width="64"
          height="20"
          viewBox="0 0 64 20"
          fill="none"
          class="stroke-primary shrink-0"
          stroke-width="1.5"
          stroke-linejoin="round"
          stroke-linecap="round"
        >
          <polyline :points="spark" />
        </svg>
        <span class="text-muted w-11 shrink-0 text-right text-xs">{{ messagesCount }}</span>
        <span
          class="w-11 shrink-0 text-right text-xs"
          :class="age === 'now' ? 'text-primary font-bold' : 'text-muted'"
        >
          {{ age }}
        </span>
        <ActivityLayer
          ref="activityRef"
          :tone="hasActions ? 'action' : isSelectedTopic ? 'active' : 'default'"
        />
      </template>
    </div>
  </UContextMenu>
</template>
