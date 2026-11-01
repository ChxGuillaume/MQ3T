<script setup lang="ts">
import { formatAge, formatCount } from '@renderer/assets/js/payload-insight'
import { MqttTopicStructure, useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import { sortTopicKeys, topicTreeContextKey } from './topic-tree-context'
import { useTopicActions } from '@renderer/composables/useTopicActions'
import { useSettingsStore } from '@renderer/store/settings-store'
import { useSharedNow } from '@renderer/composables/useSharedNow'
import { useAppStore } from '@renderer/store/app-store'
import { computed, inject, useTemplateRef, watch } from 'vue'
import { useElementVisibility } from '@vueuse/core'
import TopicValuePreview from './TopicValuePreview.vue'
import ActivityLayer from './ActivityLayer.vue'
import TopicLeafRow from './TopicLeafRow.vue'

defineOptions({ name: 'TopicTreeNode' })

const props = defineProps<{
  path: string
  keyName: string
  structure: MqttTopicStructure | null
  depth: number
}>()

const context = inject(topicTreeContextKey)!

const mqttTopicsStore = useMqttTopicsStore()
const settingsStore = useSettingsStore()
const appStore = useAppStore()
const now = useSharedNow()

const headerRef = useTemplateRef('headerRef')
const activityRef = useTemplateRef('activityRef')
const visible = useElementVisibility(headerRef, { rootMargin: '200px' })

const clientKey = computed(() => context.clientKey())

const { hasActions, favoritedTopics, isSelectedTopic, topicLastMessage, menuItems } =
  useTopicActions({ clientKey, topic: () => props.path })

const children = computed(() =>
  Object.entries(props.structure || {})
    .map(([key, value]) => ({ key, value, path: `${props.path}/${key}` }))
    .filter((child) => context.isVisible(child.path))
    .sort((a, b) => sortTopicKeys(a.key, b.key))
)

const isGroup = computed(() => Object.keys(props.structure || {}).length > 0)

const opened = computed(() => context.isOpen(props.path))

const topicsCount = computed(() =>
  mqttTopicsStore.getSubTopicsTopicsCount(clientKey.value, props.path)
)

const messagesCount = computed(() =>
  mqttTopicsStore.getSubTopicsMessagesCount(clientKey.value, props.path)
)

const age = computed(() => {
  const last = mqttTopicsStore.getSubTopicsLastMessageAt(clientKey.value, props.path)

  return last ? formatAge(now.value.getTime() - last) : ''
})

const leafTone = computed(() => {
  if (props.depth === 0) return 'root'

  return props.depth % 2 === 1 ? 'surface' : 'muted'
})

const containerClass = computed(() => {
  if (props.depth === 0) return opened.value ? 'rounded-lg border border-default' : ''
  const bg = props.depth % 2 === 1 ? 'bg-muted' : 'bg-default'

  return opened.value ? `${bg} rounded-md` : ''
})

const headerClass = computed(() => {
  const selected = isSelectedTopic.value ? 'ring-[1.5px] ring-inset ring-primary bg-primary/10' : ''
  const size = props.depth === 0 ? 'h-[42px] px-3.5' : 'h-[38px] px-3'

  if (opened.value) return [size, selected, 'rounded-[inherit]']

  if (props.depth === 0) {
    return [size, selected || 'border border-default hover:bg-muted', 'rounded-lg']
  }

  const bg = props.depth % 2 === 1 ? 'bg-muted hover:bg-accented' : 'bg-default hover:bg-elevated'

  return [size, selected || bg, 'rounded-md']
})

const handleHeaderClick = () => {
  if (settingsStore.smartTopicGroupClose) {
    if (isSelectedTopic.value && opened.value) context.setOpen(props.path, false)
    else if (!opened.value) context.setOpen(props.path, true)
  } else {
    context.setOpen(props.path, !opened.value)
  }

  context.select(props.path)
}

watch(
  () => topicLastMessage.value,
  () => visible.value && activityRef.value?.animate()
)

watch(messagesCount, () => {
  if (!visible.value || opened.value) return

  activityRef.value?.animate()
})
</script>

<template>
  <TopicLeafRow
    v-if="!isGroup"
    :client-key="clientKey"
    :topic="path"
    :label="keyName"
    :tone="leafTone"
    @select="context.select"
  />
  <div v-else role="treeitem" :aria-expanded="opened" class="flex flex-col" :class="containerClass">
    <UContextMenu :items="menuItems">
      <div
        ref="headerRef"
        :data-topic-path="path"
        class="relative flex shrink-0 cursor-pointer items-center gap-2.5 overflow-hidden text-[13px] select-none"
        :class="[headerClass, { 'transition-colors': !appStore.isScrubbingTopics }]"
        @click="handleHeaderClick"
      >
        <UIcon
          name="i-lucide-chevron-right"
          class="text-muted size-3.5 shrink-0 transition-transform"
          :class="{ 'rotate-90': opened }"
        />
        <span
          class="shrink-0 truncate font-mono font-bold"
          :class="{ 'text-dimmed italic': !keyName }"
        >
          {{ keyName || '(empty)' }}
        </span>
        <UIcon v-if="favoritedTopics" name="i-lucide-star" class="text-primary size-3 shrink-0" />
        <UIcon v-if="hasActions" name="i-lucide-play" class="text-accent size-3 shrink-0" />
        <span class="text-muted shrink-0 text-xs">
          {{ topicsCount.toLocaleString() }} {{ topicsCount === 1 ? 'topic' : 'topics' }}
        </span>
        <TopicValuePreview v-if="topicLastMessage" :message="topicLastMessage" />
        <span class="text-muted ml-auto shrink-0 text-xs">
          {{ formatCount(messagesCount) }} msgs
        </span>
        <span
          class="w-11 shrink-0 text-right text-xs"
          :class="age === 'now' ? 'text-primary font-bold' : 'text-muted'"
        >
          {{ age }}
        </span>
        <ActivityLayer ref="activityRef" :tone="hasActions ? 'action' : 'default'" />
      </div>
    </UContextMenu>
    <div
      v-if="opened"
      role="group"
      class="flex flex-col"
      :class="depth === 0 ? 'gap-1.5 px-2 pb-2' : 'gap-1 px-1.5 pb-1.5'"
    >
      <TopicTreeNode
        v-for="child in children"
        :key="child.path"
        :path="child.path"
        :key-name="child.key"
        :structure="child.value"
        :depth="depth + 1"
      />
    </div>
  </div>
</template>
