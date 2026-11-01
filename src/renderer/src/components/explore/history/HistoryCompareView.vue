<script setup lang="ts">
import { formatDuration, formatPreciseTime } from '@renderer/assets/js/payload-insight'
import SegmentedControl from '@renderer/components/ui/SegmentedControl.vue'
import { MqttMessage, useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import { useSettingsStore } from '@renderer/store/settings-store'
import { diffMessages } from '@renderer/assets/js/json-diff'
import SiblingTopicsAside from './SiblingTopicsAside.vue'
import FullWidthHeader from './FullWidthHeader.vue'
import CodeDiffPreview from '../CodeDiffPreview.vue'
import { changesLabel } from './history-helpers'
import { usePagedList } from './usePagedList'
import HistoryPager from './HistoryPager.vue'
import { computed, ref, watch } from 'vue'

const PAGE_SIZE = 7

const props = defineProps<{ clientKey: string; topic: string }>()

const emit = defineEmits<{ select: [topic: string] }>()

const mqttTopicsStore = useMqttTopicsStore()
const settingsStore = useSettingsStore()

const picked = ref<string[]>([])
const diffView = ref<'side' | 'inline'>('side')

const messages = computed(() => mqttTopicsStore.sortedTopicMessages(props.clientKey, props.topic))

const { page, pages, pageItems } = usePagedList(messages, PAGE_SIZE, () => props.topic)

const byUid = (uid: string | undefined) => messages.value.find((m) => m.uid === uid)

const ordered = computed(() => {
  const [first, second] = picked.value.map(byUid).filter((m): m is MqttMessage => !!m)

  if (!first || !second) return null

  return first.createdAt <= second.createdAt ? { a: first, b: second } : { a: second, b: first }
})

const mark = (uid: string) => {
  if (!ordered.value) return picked.value.includes(uid) ? 'A' : ''
  if (ordered.value.a.uid === uid) return 'A'
  if (ordered.value.b.uid === uid) return 'B'

  return ''
}

const toggle = (uid: string) => {
  if (picked.value.includes(uid)) picked.value = picked.value.filter((p) => p !== uid)
  else picked.value = [...picked.value, uid].slice(-2)
}

const summary = computed(() => {
  if (!ordered.value) return ''

  const count = diffMessages(ordered.value.a.message, ordered.value.b.message).length
  const apart = ordered.value.b.createdAt.getTime() - ordered.value.a.createdAt.getTime()

  return `${changesLabel(count)} · ${formatDuration(apart)} apart`
})

const time = (date: Date) =>
  formatPreciseTime(date, settingsStore.timeFormat, settingsStore.formatTime)

const meta = (message: MqttMessage) => `${message.retained ? 'Retained · ' : ''}QoS ${message.qos}`

const clearHistory = () => {
  picked.value = []
  mqttTopicsStore.clearTopicHistory(props.clientKey, props.topic)
}

watch(
  () => props.topic,
  () => {
    picked.value = messages.value.slice(0, 2).map((m) => m.uid)
  },
  { immediate: true }
)
</script>

<template>
  <div class="flex min-h-0 flex-1">
    <SiblingTopicsAside :client-key="clientKey" :topic="topic" @select="emit('select', $event)" />

    <section
      :aria-label="`History of ${topic}`"
      class="flex min-w-0 flex-[999_1_640px] flex-col gap-3.5 overflow-auto px-6 py-4"
    >
      <FullWidthHeader :client-key="clientKey" :topic="topic">
        <span class="text-muted ml-auto text-xs">Pick two messages to compare</span>
        <UButton label="Clear history" color="neutral" variant="outline" @click="clearHistory" />
      </FullWidthHeader>

      <div
        role="listbox"
        aria-multiselectable="true"
        aria-label="Messages"
        class="border-default shrink-0 overflow-hidden rounded-xl border"
      >
        <div
          v-for="message in pageItems"
          :key="message.uid"
          role="option"
          :aria-selected="!!mark(message.uid)"
          tabindex="0"
          class="border-default flex h-10 cursor-pointer items-center gap-3 border-t px-3.5 first:border-t-0"
          :class="mark(message.uid) ? 'bg-primary/10' : 'hover:bg-muted'"
          @click="toggle(message.uid)"
          @keydown.enter.space.prevent="toggle(message.uid)"
        >
          <span
            aria-hidden="true"
            class="flex size-[18px] shrink-0 items-center justify-center rounded-[5px] text-[11px] font-bold"
            :class="
              mark(message.uid) ? 'bg-primary text-inverted' : 'border-default border-[1.5px]'
            "
          >
            {{ mark(message.uid) }}
          </span>
          <span class="text-muted w-[110px] shrink-0 font-mono text-xs">
            {{ time(message.createdAt) }}
          </span>
          <span class="min-w-0 flex-1 truncate font-mono text-xs">{{ message.message }}</span>
          <span class="text-muted shrink-0 text-xs">{{ meta(message) }}</span>
        </div>
        <div class="border-default text-muted flex items-center gap-2 border-t px-3.5 py-2 text-xs">
          <span>{{ messages.length }} kept</span>
          <HistoryPager v-if="settingsStore.messagesPagination" v-model="page" :pages="pages" />
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2.5">
        <h2 class="text-muted text-[11px] font-semibold tracking-[0.1em] uppercase">Compare</h2>
        <template v-if="ordered">
          <span class="font-mono text-xs">
            <b class="text-primary">A</b> {{ time(ordered.a.createdAt) }}
          </span>
          <UIcon name="i-lucide-arrow-right" class="text-muted size-3.5" />
          <span class="font-mono text-xs">
            <b class="text-primary">B</b> {{ time(ordered.b.createdAt) }}
          </span>
          <span class="text-muted text-xs">{{ summary }}</span>
        </template>
        <span v-else class="text-muted text-xs">Select two messages in the list above</span>
        <SegmentedControl
          v-model="diffView"
          :items="[
            { label: 'Side by side', value: 'side' },
            { label: 'Inline', value: 'inline' }
          ]"
          class="ml-auto"
        />
      </div>

      <div v-if="ordered" class="bg-muted h-[360px] shrink-0 overflow-hidden rounded-[10px]">
        <CodeDiffPreview
          :value="ordered.a.message"
          :modified-value="ordered.b.message"
          :language="ordered.b.dataType"
          :side-by-side="diffView === 'side'"
        />
      </div>
    </section>
  </div>
</template>
