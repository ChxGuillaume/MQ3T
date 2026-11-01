<script setup lang="ts">
import { sortTopicKeys, TopicTreeContext, topicTreeContextKey } from './topic-tree-context'
import { MqttTopicStructure, useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import { useActionsCacheStore } from '@renderer/store/actions-cache'
import { useSharedNow } from '@renderer/composables/useSharedNow'
import { useExploreUiStore } from '@renderer/store/explore-ui'
import { sortTopics } from '@renderer/assets/js/sort-topics'
import { useAppStore } from '@renderer/store/app-store'
import { matchTopics } from '@renderer/assets/js/mqtt'
import { computed, provide, ref, watch } from 'vue'
import { refDebounced } from '@vueuse/core'
import TopicTreeNode from './TopicTreeNode.vue'
import TopicLeafRow from './TopicLeafRow.vue'

const CHANGING_WINDOW = 5000

const props = defineProps<{ clientKey: string }>()

const emit = defineEmits<{ count: [count: number] }>()

const actionsCacheStore = useActionsCacheStore()
const mqttTopicsStore = useMqttTopicsStore()
const exploreUiStore = useExploreUiStore()
const appStore = useAppStore()
const now = useSharedNow()

const containerRef = ref<HTMLElement | null>(null)
const filterCollapsed = ref(new Set<string>())

const search = computed(() => mqttTopicsStore.topicSearch.trim())
const debouncedSearch = refDebounced(search, 100)

const allTopics = computed(() => {
  const topics = new Set([
    ...Object.keys(mqttTopicsStore.topicsMessages[props.clientKey] || {}),
    ...Object.keys(actionsCacheStore.normalTopics[props.clientKey] || {})
  ])

  return Array.from(topics)
})

const matchesSearch = (topic: string, query: string) => {
  if (/[+#]/.test(query)) return matchTopics(query, topic)

  return query
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .some((keyword) => topic.toLowerCase().includes(keyword))
}

const filterActive = computed(
  () => !!debouncedSearch.value || exploreUiStore.filterChanging || exploreUiStore.filterRetained
)

const matchedTopics = computed(() => {
  if (!filterActive.value) return allTopics.value

  const query = debouncedSearch.value
  const changingSince = exploreUiStore.filterChanging ? now.value.getTime() - CHANGING_WINDOW : 0

  return allTopics.value.filter((topic) => {
    if (query && !matchesSearch(topic, query)) return false

    if (!exploreUiStore.filterChanging && !exploreUiStore.filterRetained) return true

    const last = mqttTopicsStore.getTopicLastMessage(props.clientKey, topic)

    if (exploreUiStore.filterRetained && !last?.retained) return false
    if (exploreUiStore.filterChanging && (!last || last.createdAt.getTime() < changingSince))
      return false

    return true
  })
})

const visibleSet = computed(() => {
  if (!filterActive.value) return null

  const set = new Set<string>()

  for (const topic of matchedTopics.value) {
    const parts = topic.split('/')

    for (let i = 1; i <= parts.length; i++) set.add(parts.slice(0, i).join('/'))
  }

  return set
})

watch(
  () => matchedTopics.value.length,
  (count) => emit('count', count),
  { immediate: true }
)

watch(
  [debouncedSearch, () => exploreUiStore.filterChanging, () => exploreUiStore.filterRetained],
  () => {
    filterCollapsed.value = new Set()
  }
)

const structure = computed(() => mqttTopicsStore.getConnectionTopicsStructure(props.clientKey))

const rootEntries = computed(() =>
  Object.entries(structure.value)
    .filter(([key]) => !visibleSet.value || visibleSet.value.has(key))
    .sort((a, b) => sortTopicKeys(a[0], b[0]))
)

const lineTopics = computed(() => matchedTopics.value.slice().sort(sortTopics))

const isOpen = (path: string) => {
  if (filterActive.value) return !filterCollapsed.value.has(path)

  return mqttTopicsStore.getTopicGroupOpened(props.clientKey, path)
}

const setOpen = (path: string, opened: boolean) => {
  if (!filterActive.value) {
    mqttTopicsStore.setTopicGroupOpened(props.clientKey, path, opened)
    return
  }

  const next = new Set(filterCollapsed.value)

  if (opened) next.delete(path)
  else next.add(path)

  filterCollapsed.value = next
}

const selectTopic = (path: string) => {
  if (
    mqttTopicsStore.selectedConnection === props.clientKey &&
    mqttTopicsStore.selectedTopic === path
  )
    return

  mqttTopicsStore.setSelectedTopic(props.clientKey, path)
}

const context: TopicTreeContext = {
  clientKey: () => props.clientKey,
  isVisible: (path) => !visibleSet.value || visibleSet.value.has(path),
  isOpen,
  setOpen,
  select: selectTopic
}

provide(topicTreeContextKey, context)

const hasChildren = (node: MqttTopicStructure | null) => Object.keys(node || {}).length > 0

const flattenVisible = (): string[] => {
  if (exploreUiStore.displayMode === 'line') return lineTopics.value

  const result: string[] = []

  const walk = (node: MqttTopicStructure | null, prefix: string) => {
    Object.entries(node || {})
      .map(([key, child]) => ({ key, child, path: prefix ? `${prefix}/${key}` : key }))
      .filter(({ path }) => context.isVisible(path))
      .sort((a, b) => sortTopicKeys(a.key, b.key))
      .forEach(({ child, path }) => {
        result.push(path)
        if (hasChildren(child) && isOpen(path)) walk(child, path)
      })
  }

  walk(structure.value, '')

  return result
}

const scrollToTopic = (path: string) => {
  const element = containerRef.value?.querySelector(`[data-topic-path="${CSS.escape(path)}"]`)

  element?.scrollIntoView({ block: 'nearest' })
}

const selectAndReveal = (path: string | undefined) => {
  if (path === undefined) return

  selectTopic(path)
  requestAnimationFrame(() => scrollToTopic(path))
}

let scrubbingTimeout: NodeJS.Timeout | undefined

const step = (direction: 1 | -1) => {
  const topics = flattenVisible()
  const index = topics.indexOf(mqttTopicsStore.selectedTopic)
  const next = index === -1 ? topics[0] : topics[index + direction]

  selectAndReveal(next)

  clearTimeout(scrubbingTimeout)
  scrubbingTimeout = setTimeout(() => appStore.setIsScrubbingTopics(true), 100)
}

const handleLeft = () => {
  const topic = mqttTopicsStore.selectedTopic
  const node = topic
    .split('/')
    .reduce<MqttTopicStructure | null>((acc, key) => acc?.[key] ?? null, structure.value)

  if (hasChildren(node) && isOpen(topic)) setOpen(topic, false)
  else selectAndReveal(topic.split('/').slice(0, -1).join('/') || undefined)
}

const handleRight = () => {
  const topic = mqttTopicsStore.selectedTopic
  const node = topic
    .split('/')
    .reduce<MqttTopicStructure | null>((acc, key) => acc?.[key] ?? null, structure.value)

  if (hasChildren(node) && !isOpen(topic)) setOpen(topic, true)
  else step(1)
}

const handleKeyDown = (event: KeyboardEvent) => {
  const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Escape']

  if (!keys.includes(event.key)) return

  event.preventDefault()

  if (event.key === 'ArrowUp') step(-1)
  else if (event.key === 'ArrowDown') step(1)
  else if (event.key === 'Escape') mqttTopicsStore.clearSelectedTopic()
  else if (exploreUiStore.displayMode === 'tree' && event.key === 'ArrowLeft') handleLeft()
  else if (exploreUiStore.displayMode === 'tree' && event.key === 'ArrowRight') handleRight()
}

const handleKeyUp = (event: KeyboardEvent) => {
  if (!['ArrowUp', 'ArrowDown'].includes(event.key)) return

  clearTimeout(scrubbingTimeout)
  appStore.setIsScrubbingTopics(false)
}

const focusContainer = () => containerRef.value?.focus({ preventScroll: true })

defineExpose({ scrollToTopic })
</script>

<template>
  <div
    ref="containerRef"
    role="tree"
    tabindex="0"
    aria-label="Topics"
    class="flex min-h-0 flex-1 flex-col gap-1.5 overflow-auto px-4 pb-4 outline-none"
    @keydown="handleKeyDown"
    @keyup="handleKeyUp"
    @click="focusContainer"
  >
    <template v-if="exploreUiStore.displayMode === 'line'">
      <TopicLeafRow
        v-for="topic in lineTopics"
        :key="topic"
        :client-key="clientKey"
        :topic="topic"
        :label="topic"
        tone="root"
        wide
        @select="selectTopic"
      />
    </template>
    <template v-else>
      <TopicTreeNode
        v-for="[key, node] in rootEntries"
        :key="key"
        :path="key"
        :key-name="key"
        :structure="node"
        :depth="0"
      />
    </template>

    <div
      v-if="!matchedTopics.length"
      class="text-muted flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center"
    >
      <UIcon
        :name="filterActive ? 'i-lucide-search-x' : 'i-lucide-radio-tower'"
        class="text-dimmed size-8"
      />
      <p class="text-default font-semibold">
        {{ filterActive ? 'No topic matches these filters' : 'Waiting for messages' }}
      </p>
      <p class="text-xs">
        {{
          filterActive
            ? 'Try another filter, wildcards like line-2/+/temperature work too.'
            : 'Topics show up here as soon as the broker sends them.'
        }}
      </p>
    </div>
  </div>
</template>
