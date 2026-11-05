<script setup lang="ts">
import { childPath, isContainer, jsonTreeContextKey, JsonTreeContext } from './json-tree-context'
import { formatPreciseTime, parseMessage } from '@renderer/assets/js/payload-insight'
import { diffMessages, JsonChange, summarizeChanges } from '@renderer/assets/js/json-diff'
import CodePreview from '@renderer/components/tap-topics/CodePreview.vue'
import SegmentedControl from '@renderer/components/ui/SegmentedControl.vue'
import { useClipboardToast } from '@renderer/composables/useClipboardToast'
import { useExploreUiStore } from '@renderer/store/explore-ui'
import { useSettingsStore } from '@renderer/store/settings-store'
import { useDataGraphsStore } from '@renderer/store/data-graphs'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import SiblingTopicsAside from './SiblingTopicsAside.vue'
import { changesLabel } from './history-helpers'
import FullWidthHeader from './FullWidthHeader.vue'
import { computed, provide, ref, watch } from 'vue'
import JsonTreeNode from './JsonTreeNode.vue'

const props = defineProps<{ clientKey: string; topic: string }>()

const emit = defineEmits<{ select: [topic: string] }>()

const mqttTopicsStore = useMqttTopicsStore()
const dataGraphsStore = useDataGraphsStore()
const settingsStore = useSettingsStore()
const exploreUiStore = useExploreUiStore()
const { copy } = useClipboardToast()

const selectedIndex = ref(0)
const view = ref<'tree' | 'text'>('tree')
const find = ref('')
const onlyChanges = ref(false)
const expandAll = ref<boolean | null>(null)
const toggled = ref(new Map<string, boolean>())

const messages = computed(() => mqttTopicsStore.sortedTopicMessages(props.clientKey, props.topic))

const entries = computed(() =>
  messages.value.map((message, index) => {
    const previous = messages.value[index + 1]

    return {
      message,
      previous,
      count: previous ? diffMessages(previous.message, message.message).length : -1
    }
  })
)

const selected = computed(() => entries.value[selectedIndex.value] ?? entries.value[0])

const selectedValue = computed(() =>
  selected.value ? parseMessage(selected.value.message).value : null
)

const changes = computed(() => {
  const map = new Map<string, JsonChange>()

  if (!selected.value?.previous) return map

  diffMessages(selected.value.previous.message, selected.value.message.message).forEach((change) =>
    map.set(change.path, change)
  )

  return map
})

const rootSummary = computed(() => {
  const value = selectedValue.value

  if (!isContainer(value)) return ''

  const count = Array.isArray(value) ? value.length : Object.keys(value).length
  const summary = summarizeChanges(Array.from(changes.value.values()))
  const parts = [`${count} ${Array.isArray(value) ? 'items' : 'keys'}`]

  if (summary.changed) parts.push(`${summary.changed} changed`)
  if (summary.added) parts.push(`${summary.added} added`)
  if (summary.removed) parts.push(`${summary.removed} removed`)

  return parts.join(' · ')
})

const rootEntries = computed(() => {
  const value = selectedValue.value

  if (!isContainer(value)) return []

  return Array.isArray(value)
    ? value.map((item, index) => ({ key: String(index), value: item, path: childPath('', index) }))
    : Object.entries(value).map(([key, item]) => ({ key, value: item, path: key }))
})

const graphPath = (path: string) => path.replace(/\[/g, '.[').replace(/^\./, '')

const context: JsonTreeContext = {
  changes,
  onlyChanges,
  find,
  isExpanded: (path, depth) => toggled.value.get(path) ?? expandAll.value ?? depth < 1,
  toggle: (path, depth) => {
    const next = new Map(toggled.value)

    next.set(path, !context.isExpanded(path, depth))
    toggled.value = next
  },
  keyMenu: (path, value) => [
    [
      { label: 'Copy path', icon: 'i-lucide-copy', onSelect: () => copy(path, 'Path copied') },
      {
        label: 'Copy value',
        icon: 'i-lucide-clipboard',
        onSelect: () =>
          copy(typeof value === 'string' ? value : JSON.stringify(value, null, 2), 'Value copied')
      },
      ...(typeof value === 'number'
        ? [
            {
              label: 'Add to Graphs',
              icon: 'i-lucide-chart-spline',
              onSelect: () =>
                dataGraphsStore.addDataGraph({
                  clientKey: props.clientKey,
                  topic: props.topic,
                  dataPath: graphPath(path)
                })
            }
          ]
        : [])
    ]
  ]
}

provide(jsonTreeContextKey, context)

const handleExpandAll = () => {
  expandAll.value = !expandAll.value
  toggled.value = new Map()
}

const handleListKeydown = (event: KeyboardEvent) => {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    selectedIndex.value = Math.min(entries.value.length - 1, selectedIndex.value + 1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    selectedIndex.value = Math.max(0, selectedIndex.value - 1)
  }
}

const time = (date: Date) =>
  formatPreciseTime(date, settingsStore.timeFormat, settingsStore.formatTime)

const exitToChanges = () => {
  exploreUiStore.historyMode = 'changes'
  exploreUiStore.layout = 'split'
}

watch(
  () => props.topic,
  () => {
    selectedIndex.value = 0
    toggled.value = new Map()
  }
)
</script>

<template>
  <div class="flex min-h-0 flex-1">
    <SiblingTopicsAside :client-key="clientKey" :topic="topic" @select="emit('select', $event)" />

    <section
      :aria-label="`History of ${topic}`"
      class="flex min-w-0 flex-[999_1_640px] flex-col gap-3.5 overflow-hidden px-6 py-4"
    >
      <FullWidthHeader :client-key="clientKey" :topic="topic">
        <SegmentedControl
          :model-value="'full'"
          :items="[
            { label: 'Changes', value: 'changes' },
            { label: 'Full', value: 'full' }
          ]"
          class="ml-auto"
          @update:model-value="$event === 'changes' && exitToChanges()"
        />
        <UButton
          label="Exit full width"
          icon="i-lucide-minimize-2"
          color="neutral"
          variant="outline"
          @click="exploreUiStore.layout = 'split'"
        />
      </FullWidthHeader>

      <div class="flex min-h-0 flex-1 gap-4">
        <div
          class="flex w-[250px] shrink-0 flex-col gap-0.5 overflow-auto outline-none"
          tabindex="0"
          role="listbox"
          aria-label="Messages"
          @keydown="handleListKeydown"
        >
          <div
            class="text-muted px-2.5 pb-1.5 text-[11px] font-semibold tracking-[0.1em] uppercase"
          >
            {{ messages.length }} messages
          </div>
          <button
            v-for="(entry, index) in entries"
            :key="entry.message.uid"
            type="button"
            role="option"
            :aria-selected="index === selectedIndex"
            class="flex h-9 shrink-0 items-center gap-2 rounded-md px-2.5 text-xs"
            :class="index === selectedIndex ? 'bg-primary/10 font-bold' : 'hover:bg-muted'"
            @click="selectedIndex = index"
          >
            <span class="font-mono" :class="index === selectedIndex ? 'text-primary' : ''">
              {{ time(entry.message.createdAt) }}
            </span>
            <span class="text-muted ml-auto font-normal">
              {{ entry.count === -1 ? 'oldest' : changesLabel(entry.count) }}
            </span>
          </button>
          <span class="text-muted px-2.5 py-2 text-xs">↑ ↓ to step through</span>
        </div>

        <div class="flex min-w-0 flex-1 flex-col gap-2.5">
          <div class="flex flex-wrap items-center gap-2">
            <UInput
              v-model="find"
              icon="i-lucide-search"
              size="sm"
              placeholder="Find a key or value"
              class="min-w-0 flex-[1_1_220px]"
            />
            <SegmentedControl
              v-model="view"
              :items="[
                { label: 'Tree', value: 'tree' },
                { label: 'Text', value: 'text' }
              ]"
              size="sm"
            />
            <UButton
              :label="expandAll ? 'Collapse all' : 'Expand all'"
              color="neutral"
              variant="outline"
              size="sm"
              :disabled="view !== 'tree'"
              @click="handleExpandAll"
            />
            <UButton
              label="Only changes"
              color="neutral"
              variant="outline"
              size="sm"
              :aria-pressed="onlyChanges"
              :class="{ 'bg-primary/10 text-primary': onlyChanges }"
              :disabled="view !== 'tree'"
              @click="onlyChanges = !onlyChanges"
            />
            <UButton
              label="Copy"
              icon="i-lucide-copy"
              color="neutral"
              variant="outline"
              size="sm"
              :disabled="!selected"
              @click="selected && copy(selected.message.message, 'Message copied to clipboard')"
            />
          </div>

          <div
            v-if="selected && view === 'tree' && isContainer(selectedValue)"
            class="border-default min-h-0 flex-1 overflow-auto rounded-lg border p-2.5 font-mono text-[13px]"
          >
            <div class="flex min-h-[30px] items-center gap-2.5 px-2.5">
              <span class="text-muted w-3">▾</span>
              <span class="text-muted">{{ Array.isArray(selectedValue) ? '[]' : '{}' }}</span>
              <span class="text-muted font-sans text-xs">{{ rootSummary }}</span>
            </div>
            <div class="border-default ml-4 border-l pl-2">
              <JsonTreeNode
                v-for="entry in rootEntries"
                :key="entry.path"
                :name="entry.key"
                :value="entry.value"
                :path="entry.path"
                :depth="0"
              />
            </div>
          </div>
          <div v-else-if="selected" class="bg-muted min-h-0 flex-1 overflow-hidden rounded-lg">
            <CodePreview
              :value="selected.message.message"
              :language="selected.message.dataType"
              hide-top-border
            />
          </div>

          <p class="text-muted text-xs">
            Right-click a key to copy its path, e.g.
            <span class="text-default font-mono">motors[2].current</span>, or to graph it.
          </p>
        </div>
      </div>
    </section>
  </div>
</template>
