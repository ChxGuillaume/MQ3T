<script setup lang="ts">
import { formatPreciseTime, parseMessage } from '@renderer/assets/js/payload-insight'
import { leafPaths, summarizeChanges } from '@renderer/assets/js/json-diff'
import { useExploreUiStore } from '@renderer/store/explore-ui'
import { useSettingsStore } from '@renderer/store/settings-store'
import type { MqttMessage } from '@renderer/store/mqtt-topics'
import CodeDiffPreview from '../CodeDiffPreview.vue'
import { withChanges } from './history-helpers'
import { usePagedList } from './usePagedList'
import HistoryPager from './HistoryPager.vue'
import ChangeLine from './ChangeLine.vue'
import { computed, ref, watch } from 'vue'

const PAGE_SIZE = 5
const SHOWN_CHANGES = 3

const props = defineProps<{ clientKey: string; topic: string; messages: MqttMessage[] }>()

const settingsStore = useSettingsStore()
const exploreUiStore = useExploreUiStore()

const expanded = ref(new Set<string>())

const keyFilters = computed({
  get: () => exploreUiStore.getKeyFilters(props.clientKey, props.topic),
  set: (filters: string[]) => exploreUiStore.setKeyFilters(props.clientKey, props.topic, filters)
})

const knownPaths = computed(() => {
  const latest = props.messages[0]

  if (!latest) return []

  return leafPaths(parseMessage(latest).value).filter((path) => !keyFilters.value.includes(path))
})

const newKey = ref<string>()

watch(newKey, (key) => {
  if (!key) return

  keyFilters.value = [...keyFilters.value, key]
  newKey.value = undefined
})

const entries = computed(() => {
  const list = withChanges(props.messages, keyFilters.value)

  if (!exploreUiStore.hideNoChange) return list

  return list.filter((entry) => entry.changes.length || !entry.previous)
})

const { page, pages, pageItems } = usePagedList(entries, PAGE_SIZE, () => props.topic)

watch(
  () => props.topic,
  () => (expanded.value = new Set(props.messages[0] ? [props.messages[0].uid] : [])),
  { immediate: true }
)

const toggle = (uid: string) => {
  const next = new Set(expanded.value)

  if (next.has(uid)) next.delete(uid)
  else next.add(uid)

  expanded.value = next
}

const removeFilter = (filter: string) => {
  keyFilters.value = keyFilters.value.filter((f) => f !== filter)
}

const time = (date: Date) =>
  formatPreciseTime(date, settingsStore.timeFormat, settingsStore.formatTime)
</script>

<template>
  <div class="text-muted flex flex-wrap items-center gap-1.5 text-xs">
    Only keys:
    <span
      v-for="filter in keyFilters"
      :key="filter"
      class="border-default text-default inline-flex items-center gap-1 rounded-full border py-0.5 pr-1 pl-2 font-mono"
    >
      {{ filter }}
      <UButton
        icon="i-lucide-x"
        size="xs"
        color="neutral"
        variant="link"
        :aria-label="`Remove ${filter} filter`"
        class="text-muted p-0"
        @click="removeFilter(filter)"
      />
    </span>
    <USelectMenu
      v-model="newKey"
      :items="knownPaths"
      create-item
      placeholder="+ key"
      size="xs"
      variant="none"
      :search-input="{ placeholder: 'Key path, e.g. motors[*].current' }"
      class="border-default text-muted w-auto rounded-full border border-dashed px-2"
      :ui="{ trailing: 'hidden', content: 'min-w-64' }"
      @create="newKey = $event"
    />
  </div>

  <div role="list" class="border-default overflow-hidden rounded-[10px] border">
    <div
      v-for="entry in pageItems"
      :key="entry.message.uid"
      role="listitem"
      class="border-default flex flex-col gap-1.5 border-t px-3 py-2.5 first:border-t-0"
      :class="{ 'bg-primary/10': expanded.has(entry.message.uid) }"
    >
      <button
        type="button"
        class="flex items-center gap-2 text-left"
        :aria-expanded="expanded.has(entry.message.uid)"
        @click="toggle(entry.message.uid)"
      >
        <UIcon
          name="i-lucide-chevron-right"
          class="text-muted size-4 shrink-0 transition-transform"
          :class="{ 'rotate-90': expanded.has(entry.message.uid) }"
        />
        <span class="text-muted font-mono text-xs">{{ time(entry.message.createdAt) }}</span>
        <template v-if="!entry.previous">
          <span class="bg-muted text-muted rounded-full px-[7px] py-px text-[11px] font-bold">
            oldest kept
          </span>
        </template>
        <template v-else-if="entry.changes.length">
          <template v-for="(count, type) in summarizeChanges(entry.changes)" :key="type">
            <span
              v-if="count"
              class="rounded-full px-[7px] py-px text-[11px] font-bold"
              :class="type === 'changed' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted'"
            >
              {{ count }} {{ type }}
            </span>
          </template>
        </template>
        <span v-else class="bg-muted text-muted rounded-full px-[7px] py-px text-[11px] font-bold">
          no change
        </span>
      </button>
      <div v-if="entry.changes.length" class="flex flex-col gap-1 pl-6">
        <ChangeLine
          v-for="change in entry.changes.slice(0, SHOWN_CHANGES)"
          :key="change.path"
          :change="change"
        />
        <div v-if="entry.changes.length > SHOWN_CHANGES" class="text-muted truncate text-xs">
          +{{ entry.changes.length - SHOWN_CHANGES }} more:
          {{
            entry.changes
              .slice(SHOWN_CHANGES, SHOWN_CHANGES + 4)
              .map((c) => c.path)
              .join(', ')
          }}
        </div>
      </div>
      <div
        v-if="expanded.has(entry.message.uid) && entry.previous"
        class="bg-default mt-1 ml-6 h-60 overflow-hidden rounded-lg"
      >
        <CodeDiffPreview
          :value="entry.previous.message"
          :modified-value="entry.message.message"
          :language="entry.message.dataType"
          hide-unchanged
        />
      </div>
    </div>
    <div v-if="!pageItems.length" class="text-muted px-3 py-6 text-center text-xs">
      No message changed these keys
    </div>
  </div>

  <div class="text-muted flex items-center gap-2 text-xs">
    <span>Each row shows what changed since the message before it</span>
    <HistoryPager v-if="settingsStore.messagesPagination" v-model="page" :pages="pages" />
  </div>
</template>
