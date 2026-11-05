<script setup lang="ts">
import { formatAge, formatCount } from '@renderer/assets/js/payload-insight'
import { useTopicActions } from '@renderer/composables/useTopicActions'
import { useSettingsStore } from '@renderer/store/settings-store'
import { useSharedNow } from '@renderer/composables/useSharedNow'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import { computed, inject, useTemplateRef, watch } from 'vue'
import { useAppStore } from '@renderer/store/app-store'
import { topicTreeContextKey } from './topic-tree-context'
import { useElementVisibility } from '@vueuse/core'
import TopicValueText from './TopicValueText.vue'
import ActivityLayer from './ActivityLayer.vue'

const props = defineProps<{
  path: string
  keyName: string
  depth: number
  isGroup: boolean
  opened: boolean
  onSelectedPath: boolean
}>()

const context = inject(topicTreeContextKey)!

const mqttTopicsStore = useMqttTopicsStore()
const settingsStore = useSettingsStore()
const appStore = useAppStore()
const now = useSharedNow()

const rowRef = useTemplateRef('rowRef')
const activityRef = useTemplateRef('activityRef')
const visible = useElementVisibility(rowRef, { rootMargin: '200px' })

const clientKey = computed(() => context.clientKey())

const { hasActions, favoritedTopics, isSelectedTopic, topicLastMessage, menuItems } =
  useTopicActions({ clientKey, topic: () => props.path })

const topicsCount = computed(() =>
  props.isGroup ? mqttTopicsStore.getSubTopicsTopicsCount(clientKey.value, props.path) : 0
)

const messagesCount = computed(() =>
  mqttTopicsStore.getSubTopicsMessagesCount(clientKey.value, props.path)
)

const age = computed(() => {
  const last = props.isGroup
    ? mqttTopicsStore.getSubTopicsLastMessageAt(clientKey.value, props.path)
    : topicLastMessage.value?.createdAt.getTime()

  return last ? formatAge(now.value.getTime() - last) : ''
})

const handleClick = () => {
  if (props.isGroup) {
    if (settingsStore.smartTopicGroupClose) {
      if (isSelectedTopic.value && props.opened) context.setOpen(props.path, false)
      else if (!props.opened) context.setOpen(props.path, true)
    } else {
      context.setOpen(props.path, !props.opened)
    }
  }

  context.select(props.path)
}

watch(topicLastMessage, () => visible.value && activityRef.value?.animate())

watch(messagesCount, () => {
  if (!props.isGroup || !visible.value || props.opened) return

  activityRef.value?.animate()
})
</script>

<template>
  <UContextMenu :items="menuItems">
    <div
      ref="rowRef"
      role="treeitem"
      :aria-level="depth + 1"
      :aria-expanded="isGroup ? opened : undefined"
      :aria-selected="isSelectedTopic"
      :data-topic-path="path"
      class="flex h-[34px] w-full shrink-0 cursor-pointer text-[13px] select-none"
      @click="handleClick"
    >
      <span v-if="depth" aria-hidden="true" class="flex shrink-0">
        <span
          v-for="level in depth"
          :key="level"
          class="ml-3.5 w-2 border-l"
          :class="level === depth && onSelectedPath ? 'border-primary' : 'border-muted'"
        />
      </span>
      <div
        class="relative flex min-w-0 flex-1 items-center gap-2 overflow-hidden rounded-md px-2"
        :class="[
          isSelectedTopic
            ? 'bg-primary/10 ring-primary ring-[1.5px] ring-inset'
            : 'hover:bg-elevated',
          { 'transition-colors': !appStore.isScrubbingTopics }
        ]"
      >
        <UIcon
          v-if="isGroup"
          name="i-lucide-chevron-right"
          class="text-muted size-3.5 shrink-0 transition-transform"
          :class="{ 'rotate-90': opened }"
        />
        <span v-else aria-hidden="true" class="w-3.5 shrink-0" />
        <span
          class="shrink-0 truncate font-mono"
          :class="[
            isSelectedTopic ? 'text-primary font-bold' : isGroup ? 'font-bold' : 'font-medium',
            { 'text-dimmed italic': !keyName }
          ]"
          :title="path"
        >
          {{ keyName || '(empty)' }}
        </span>
        <UIcon v-if="favoritedTopics" name="i-lucide-star" class="text-primary size-3 shrink-0" />
        <UIcon v-if="hasActions" name="i-lucide-play" class="text-accent size-3 shrink-0" />
        <span v-if="isGroup" class="text-muted shrink-0 text-xs">
          {{ topicsCount.toLocaleString() }}
        </span>
        <TopicValueText
          v-if="visible && topicLastMessage"
          :message="topicLastMessage"
          class="ml-1 rounded-sm px-2 py-px"
          :class="isSelectedTopic ? 'bg-default' : 'bg-muted'"
        />
        <span class="text-muted ml-auto w-14 shrink-0 text-right text-xs">
          {{ formatCount(messagesCount) }}
        </span>
        <span
          class="w-[52px] shrink-0 text-right text-xs"
          :class="age === 'now' ? 'text-primary font-bold' : 'text-muted'"
        >
          {{ age }}
        </span>
        <ActivityLayer
          ref="activityRef"
          :tone="hasActions ? 'action' : isSelectedTopic ? 'active' : 'default'"
        />
      </div>
    </div>
  </UContextMenu>
</template>
