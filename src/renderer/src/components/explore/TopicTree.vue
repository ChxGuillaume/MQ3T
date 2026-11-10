<script setup lang="ts">
import {
  sortTopicKeys,
  TopicTreeContext,
  topicListGridClass,
  topicTreeContextKey
} from './topic-tree-context'
import { MqttTopicStructure, useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import { useActionsCacheStore } from '@renderer/store/actions-cache'
import { useTopicFilter } from '@renderer/composables/useTopicQuery'
import { TopicListSortKey, useExploreUiStore } from '@renderer/store/explore-ui'
import { sortTopics } from '@renderer/assets/js/sort-topics'
import { useAppStore } from '@renderer/store/app-store'
import { computed, provide, ref, watch } from 'vue'
import TopicTreeRow from './TopicTreeRow.vue'
import TopicListRow from './TopicListRow.vue'

const props = defineProps<{ clientKey: string }>()

const emit = defineEmits<{ count: [matched: number, total: number] }>()

const actionsCacheStore = useActionsCacheStore()
const mqttTopicsStore = useMqttTopicsStore()
const exploreUiStore = useExploreUiStore()
const appStore = useAppStore()

const containerRef = ref<HTMLElement | null>(null)
const filterCollapsed = ref(new Set<string>())

const { query, filterActive, topicStage, factsStage } = useTopicFilter(() => props.clientKey)

const allTopics = computed(() => {
  const topics = new Set([
    ...Object.keys(mqttTopicsStore.topicsMessages[props.clientKey] || {}),
    ...Object.keys(actionsCacheStore.normalTopics[props.clientKey] || {})
  ])

  return Array.from(topics)
})

const keywords = computed(() => query.value.highlightKeywords)

const topicMatches = computed(() => topicStage(allTopics.value))

const sameTopics = (a: string[], b: string[]) =>
  a.length === b.length && a.every((topic, index) => topic === b[index])

const matchedTopics = computed<string[]>((previous) => {
  const next = factsStage(topicMatches.value)

  return previous && sameTopics(previous, next) ? previous : next
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
  [() => matchedTopics.value.length, () => allTopics.value.length],
  ([matched, total]) => emit('count', matched, total),
  { immediate: true }
)

watch(query, () => {
  filterCollapsed.value = new Set()
})

const structure = computed(() => mqttTopicsStore.getConnectionTopicsStructure(props.clientKey))

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

const parentOf = (path: string) => path.split('/').slice(0, -1).join('/')

const selectedTopic = computed(() =>
  mqttTopicsStore.selectedConnection === props.clientKey ? mqttTopicsStore.selectedTopic : ''
)

const isOnSelectedPath = (path: string) => {
  const selected = selectedTopic.value

  if (!selected) return false

  return (
    selected === path || selected.startsWith(`${path}/`) || parentOf(path) === parentOf(selected)
  )
}

const treeRows = computed(() => {
  const rows: { path: string; key: string; depth: number; isGroup: boolean; opened: boolean }[] = []

  const walk = (node: MqttTopicStructure | null, prefix: string, depth: number) => {
    Object.entries(node || {})
      .map(([key, child]) => ({ key, child, path: prefix ? `${prefix}/${key}` : key }))
      .filter(({ path }) => context.isVisible(path))
      .sort((a, b) => sortTopicKeys(a.key, b.key))
      .forEach(({ key, child, path }) => {
        const isGroup = hasChildren(child)
        const opened = isGroup && isOpen(path)

        rows.push({ path, key, depth, isGroup, opened })
        if (opened) walk(child, path, depth + 1)
      })
  }

  walk(structure.value, '', 0)

  return rows
})

const listOrder = ref<string[]>([])

const listCompare = (key: TopicListSortKey) => {
  if (key === 'topic') return sortTopics

  if (key === 'msgs') {
    const count = (topic: string) =>
      mqttTopicsStore.getSubTopicsMessagesCount(props.clientKey, topic)

    return (a: string, b: string) => count(a) - count(b) || sortTopics(a, b)
  }

  const at = (topic: string) =>
    mqttTopicsStore.getTopicLastMessage(props.clientKey, topic)?.createdAt.getTime() ?? 0

  return (a: string, b: string) => at(a) - at(b) || sortTopics(a, b)
}

const sortList = () => {
  if (exploreUiStore.displayMode !== 'line') return

  const { key, descending } = exploreUiStore.listSort
  const compare = listCompare(key)

  listOrder.value = matchedTopics.value
    .slice()
    .sort((a, b) => (descending ? compare(b, a) : compare(a, b)))
}

// The order is a snapshot: it only changes when topics appear or disappear, or the sort changes,
// so rows don't jump around while values update.
watch(
  matchedTopics,
  (next, previous) => {
    if (previous && next.length === previous.length) {
      const known = new Set(previous)

      if (next.every((topic) => known.has(topic))) return
    }

    sortList()
  },
  { immediate: true }
)

watch([() => exploreUiStore.listSort, () => exploreUiStore.displayMode], sortList, { deep: true })

const listColumns: { key: TopicListSortKey | null; label: string; align: 'left' | 'right' }[] = [
  { key: 'topic', label: 'Topic', align: 'left' },
  { key: null, label: 'Latest value', align: 'left' },
  { key: 'msgs', label: 'Msgs', align: 'right' },
  { key: 'updated', label: 'Updated', align: 'right' }
]

const toggleSort = (key: TopicListSortKey) => {
  const current = exploreUiStore.listSort

  exploreUiStore.listSort =
    current.key === key
      ? { key, descending: !current.descending }
      : { key, descending: key !== 'topic' }
}

const flattenVisible = (): string[] => {
  if (exploreUiStore.displayMode === 'line') return listOrder.value

  return treeRows.value.map((row) => row.path)
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

const collapseAll = () => {
  if (!filterActive.value) {
    mqttTopicsStore.collapseAllTopicGroups(props.clientKey)
    return
  }

  filterCollapsed.value = new Set(
    treeRows.value.filter((row) => row.isGroup).map((row) => row.path)
  )
}

const revealSelected = () => {
  const topic = selectedTopic.value

  if (!topic) return

  const parts = topic.split('/')

  for (let i = 1; i < parts.length; i++) setOpen(parts.slice(0, i).join('/'), true)

  requestAnimationFrame(() => scrollToTopic(topic))
}

defineExpose({ scrollToTopic, collapseAll, revealSelected })
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col">
    <div
      v-if="exploreUiStore.displayMode === 'line' && matchedTopics.length"
      class="[scrollbar-gutter:stable] overflow-hidden px-4"
    >
      <div
        class="border-default text-muted h-8 items-center border-b px-2 text-[11px] font-semibold tracking-[0.08em] uppercase"
        :class="topicListGridClass"
      >
        <span class="sr-only">Type</span>
        <template v-for="column in listColumns" :key="column.label">
          <span v-if="!column.key">{{ column.label }}</span>
          <button
            v-else
            type="button"
            class="flex items-center gap-1 uppercase"
            :class="{
              'justify-end': column.align === 'right',
              'text-primary': exploreUiStore.listSort.key === column.key
            }"
            @click="toggleSort(column.key)"
          >
            {{ column.label }}
            <UIcon
              v-if="exploreUiStore.listSort.key === column.key"
              :name="
                exploreUiStore.listSort.descending ? 'i-lucide-arrow-down' : 'i-lucide-arrow-up'
              "
              class="size-3"
            />
          </button>
        </template>
      </div>
    </div>

    <div
      ref="containerRef"
      :role="exploreUiStore.displayMode === 'line' ? 'listbox' : 'tree'"
      tabindex="0"
      aria-label="Topics"
      class="flex min-h-0 flex-1 [scrollbar-gutter:stable] flex-col overflow-auto outline-none"
      :class="exploreUiStore.displayMode === 'line' ? 'px-4 pb-4' : 'px-2 pt-1 pb-3'"
      @keydown="handleKeyDown"
      @keyup="handleKeyUp"
      @click="focusContainer"
    >
      <template v-if="exploreUiStore.displayMode === 'line'">
        <TopicListRow
          v-for="topic in listOrder"
          :key="topic"
          :client-key="clientKey"
          :topic="topic"
          :keywords="keywords"
          @select="selectTopic"
        />
      </template>
      <template v-else>
        <TopicTreeRow
          v-for="row in treeRows"
          :key="row.path"
          :path="row.path"
          :key-name="row.key"
          :depth="row.depth"
          :is-group="row.isGroup"
          :opened="row.opened"
          :on-selected-path="isOnSelectedPath(row.path)"
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
              ? 'Try another filter, or open the search help for examples like temp>20 is:retained.'
              : 'Topics show up here as soon as the broker sends them.'
          }}
        </p>
      </div>
    </div>
  </div>
</template>
