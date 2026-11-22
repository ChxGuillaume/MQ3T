<script setup lang="ts">
import {
  deltaPath,
  messagePreview,
  numericDelta,
  withChanges,
  changesLabel
} from './history-helpers'
import { formatPreciseTime, parseMessage } from '@renderer/assets/js/payload-insight'
import { MqttMessage, useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import SegmentedControl from '@renderer/components/ui/SegmentedControl.vue'
import CodePreview from '@renderer/components/tap-topics/CodePreview.vue'
import { useClipboardToast } from '@renderer/composables/useClipboardToast'
import { HistoryMode, useExploreUiStore } from '@renderer/store/explore-ui'
import { useTopicActions } from '@renderer/composables/useTopicActions'
import { useSettingsStore } from '@renderer/store/settings-store'
import type { DropdownMenuItem } from '@nuxt/ui'
import CodeDiffPreview from '../CodeDiffPreview.vue'
import HistoryChanges from './HistoryChanges.vue'
import { usePagedList } from './usePagedList'
import HistoryPager from './HistoryPager.vue'
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import { useResizeObserver } from '@vueuse/core'

const PAGE_SIZE = 8

const props = defineProps<{ clientKey: string; topic: string }>()

const mqttTopicsStore = useMqttTopicsStore()
const settingsStore = useSettingsStore()
const exploreUiStore = useExploreUiStore()
const { copy } = useClipboardToast()

const { exportItems } = useTopicActions({
  clientKey: () => props.clientKey,
  topic: () => props.topic
})

const selected = ref<MqttMessage>()

const messages = computed(() => mqttTopicsStore.sortedTopicMessages(props.clientKey, props.topic))
const latest = computed(() => messages.value[0])

const received = computed(() => {
  const count = mqttTopicsStore.getSubTopicsMessagesCount(props.clientKey, props.topic)

  return Math.max(count, messages.value.length)
})

const isJsonObject = computed(() => {
  if (!latest.value) return false

  const parsed = parseMessage(latest.value)

  return parsed.kind === 'json'
})

const mode = computed<HistoryMode>({
  get: () => {
    if (!isJsonObject.value) return 'list'
    if (exploreUiStore.historyMode) return exploreUiStore.historyMode

    return (latest.value?.message.length ?? 0) > 300 ? 'changes' : 'list'
  },
  set: (value) => (exploreUiStore.historyMode = value)
})

const modeItems = [
  { label: 'List', value: 'list' as const },
  { label: 'Changes', value: 'changes' as const },
  { label: 'Full', value: 'full' as const }
]

const modeModel = computed({
  get: () => mode.value as HistoryMode | 'full',
  set: (value) => {
    if (value === 'full') exploreUiStore.layout = 'history-full'
    else mode.value = value
  }
})

const numericPath = computed(() => deltaPath(latest.value))

const { page, pages, pageItems } = usePagedList(messages, PAGE_SIZE, () => props.topic)

const rows = computed(() => {
  const start = messages.value.indexOf(pageItems.value[0])

  return pageItems.value.map((message, index) => {
    const previous = messages.value[start + index + 1]
    let delta = numericDelta(message, previous, numericPath.value)

    if (delta === null && previous) {
      const count = withChanges([message, previous])[0].changes.length

      delta = count ? changesLabel(count) : 'same'
    }

    return { message, delta }
  })
})

const receivedLabel = computed(
  () => `${received.value.toLocaleString()} received · last ${settingsStore.maxMessages} kept`
)

const time = (date: Date) =>
  formatPreciseTime(date, settingsStore.timeFormat, settingsStore.formatTime)

// Checkbox items show a real checkbox on the left instead of the default check on the right.
const checkboxItem = (
  label: string,
  checked: boolean,
  update: (value: boolean) => void
): DropdownMenuItem => ({
  label,
  type: 'checkbox',
  slot: 'checkbox',
  checked,
  onUpdateChecked: update,
  onSelect: (e: Event) => e.preventDefault(),
  ui: { itemTrailingIcon: 'hidden' }
})

const menuItems = computed<DropdownMenuItem[][]>(() => [
  [{ label: 'Export', icon: 'i-lucide-file-down', children: exportItems() }],
  [
    ...(mode.value === 'changes'
      ? [
          checkboxItem(
            'Hide "no change"',
            exploreUiStore.hideNoChange,
            (value) => (exploreUiStore.hideNoChange = value)
          )
        ]
      : []),
    checkboxItem('Pagination', settingsStore.messagesPagination, (value) =>
      settingsStore.setMessagesPagination(value)
    ),
    checkboxItem('Compare selected with latest', settingsStore.selectedMessageCompare, (value) =>
      settingsStore.setSelectedMessageCompare(value)
    )
  ]
])

const SCROLL_DURATION = 180

const preview = useTemplateRef<HTMLElement>('preview')
const list = useTemplateRef<HTMLElement>('list')
const root = useTemplateRef<HTMLElement>('root')

// Below this height the list and the preview don't both fit, so only the panel scrolls.
const SPLIT_MIN_HEIGHT = 512

const panelHeight = ref(0)

useResizeObserver(
  computed(() => root.value?.parentElement),
  ([entry]) => (panelHeight.value = entry.contentRect.height)
)

// With a message open and enough room, the list scrolls on its own so the preview stays in view.
const splitView = computed(
  () => mode.value === 'list' && !!selected.value && panelHeight.value >= SPLIT_MIN_HEIGHT
)

const scrollParent = (element: HTMLElement) => {
  for (let el = element.parentElement; el; el = el.parentElement) {
    const { overflowY } = getComputedStyle(el)

    if (/auto|scroll/.test(overflowY) && el.scrollHeight > el.clientHeight) return el
  }

  return null
}

const scrollToBottom = (element: HTMLElement) => {
  const container = scrollParent(element)

  if (!container) return

  const start = container.scrollTop
  const distance = container.scrollHeight - container.clientHeight - start
  const startedAt = performance.now()

  const step = (now: number) => {
    const progress = Math.min((now - startedAt) / SCROLL_DURATION, 1)

    container.scrollTop = start + distance * (1 - (1 - progress) ** 3)

    if (progress < 1) requestAnimationFrame(step)
  }

  if (distance > 0) requestAnimationFrame(step)
}

const toggleSelected = async (message: MqttMessage) => {
  selected.value = selected.value?.uid === message.uid ? undefined : message

  if (!selected.value) return

  await nextTick()

  list.value
    ?.querySelector(`[data-uid="${CSS.escape(String(message.uid))}"]`)
    ?.scrollIntoView({ block: 'nearest' })

  if (preview.value) scrollToBottom(preview.value)
}

const clearHistory = () => {
  selected.value = undefined
  mqttTopicsStore.clearTopicHistory(props.clientKey, props.topic)
}

watch(
  () => props.topic,
  () => (selected.value = undefined)
)
</script>

<template>
  <UEmpty
    v-if="!messages.length"
    icon="i-lucide-history"
    title="No history yet"
    description="Received messages for this topic are kept here."
    variant="naked"
  />
  <div v-else ref="root" class="flex flex-col gap-3" :class="splitView ? 'h-full' : 'min-h-full'">
    <div class="@container flex items-center gap-2">
      <SegmentedControl
        v-if="isJsonObject"
        v-model="modeModel"
        :items="modeItems"
        size="sm"
        class="shrink-0"
      />
      <span class="text-muted min-w-0 truncate text-xs" :title="receivedLabel">
        {{ receivedLabel }}
      </span>
      <div class="ml-auto flex shrink-0 items-center gap-2">
        <UTooltip text="Compare two messages">
          <UButton
            label="Compare two…"
            icon="i-lucide-git-compare-arrows"
            color="neutral"
            variant="outline"
            size="sm"
            aria-label="Compare two messages"
            class="font-semibold"
            :ui="{ label: 'hidden @lg:inline', leadingIcon: '@lg:hidden' }"
            :disabled="messages.length < 2"
            @click="exploreUiStore.layout = 'compare'"
          />
        </UTooltip>
        <UTooltip text="Clear history">
          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="outline"
            size="sm"
            aria-label="Clear history"
            class="text-muted"
            @click="clearHistory"
          />
        </UTooltip>
        <UDropdownMenu :items="menuItems" :content="{ align: 'end' }">
          <UButton
            icon="i-lucide-ellipsis-vertical"
            color="neutral"
            variant="ghost"
            size="sm"
            aria-label="History options"
            class="text-muted"
          />
          <template #checkbox-leading="{ item }">
            <UCheckbox
              :model-value="(item as DropdownMenuItem).checked"
              size="sm"
              tabindex="-1"
              class="pointer-events-none"
            />
          </template>
        </UDropdownMenu>
      </div>
    </div>

    <HistoryChanges
      v-if="mode === 'changes'"
      :client-key="clientKey"
      :topic="topic"
      :messages="messages"
    />

    <template v-else>
      <div
        ref="list"
        role="list"
        class="border-default rounded-lg border"
        :class="splitView ? 'min-h-30 overflow-y-auto' : 'overflow-hidden'"
      >
        <button
          v-for="row in rows"
          :key="row.message.uid"
          type="button"
          role="listitem"
          :data-uid="row.message.uid"
          class="border-default flex h-10 w-full items-center gap-3 border-t px-3 text-left first:border-t-0"
          :class="selected?.uid === row.message.uid ? 'bg-primary/10' : 'hover:bg-muted'"
          @click="toggleSelected(row.message)"
        >
          <span class="text-muted w-24 shrink-0 font-mono text-xs">{{
            time(row.message.createdAt)
          }}</span>
          <span class="min-w-0 flex-1 truncate font-mono text-xs">
            {{ messagePreview(row.message) }}
          </span>
          <UIcon
            v-if="row.message.retained"
            name="i-lucide-bookmark"
            class="text-muted size-3.5 shrink-0"
          />
          <span
            v-if="row.delta"
            class="shrink-0 text-xs"
            :class="row.delta === 'same' ? 'text-muted' : 'text-primary font-bold'"
          >
            {{ row.delta }}
          </span>
        </button>
      </div>

      <div class="text-muted flex items-center gap-2 text-xs">
        <span>Click a message to see it in full</span>
        <HistoryPager v-if="settingsStore.messagesPagination" v-model="page" :pages="pages" />
      </div>

      <section
        v-if="selected"
        ref="preview"
        class="flex min-h-[max(18rem,50%)] flex-1 flex-col gap-2"
      >
        <div class="flex items-center gap-2">
          <h2 class="text-muted text-[11px] font-semibold tracking-[0.1em] uppercase">
            {{
              settingsStore.selectedMessageCompare && selected.uid !== latest?.uid
                ? 'Compared with latest'
                : 'Message'
            }}
          </h2>
          <span class="text-muted font-mono text-xs">
            {{ settingsStore.formatDate(selected.createdAt) }} {{ time(selected.createdAt) }} · QoS
            {{ selected.qos }}{{ selected.retained ? ' · Retained' : '' }}
          </span>
          <UButton
            icon="i-lucide-copy"
            size="xs"
            color="neutral"
            variant="ghost"
            aria-label="Copy message"
            class="text-muted ml-auto"
            @click="copy(selected.message, 'Message copied to clipboard')"
          />
          <UButton
            icon="i-lucide-x"
            size="xs"
            color="neutral"
            variant="ghost"
            aria-label="Close message"
            class="text-muted"
            @click="selected = undefined"
          />
        </div>
        <div class="bg-muted relative min-h-64 flex-1 overflow-hidden rounded-lg">
          <div class="absolute inset-0">
            <CodeDiffPreview
              v-if="settingsStore.selectedMessageCompare && latest && selected.uid !== latest.uid"
              :value="selected.message"
              :modified-value="latest.message"
              :language="selected.dataType"
            />
            <CodePreview
              v-else
              :value="selected.message"
              :language="selected.dataType"
              hide-top-border
            />
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
