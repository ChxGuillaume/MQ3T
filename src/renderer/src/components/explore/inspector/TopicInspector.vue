<script setup lang="ts">
import {
  byteSize,
  formatBytes,
  formatRate,
  kindLabel,
  parseMessage
} from '@renderer/assets/js/payload-insight'
import { InspectorTab, useExploreUiStore } from '@renderer/store/explore-ui'
import { useClipboardToast } from '@renderer/composables/useClipboardToast'
import { useTopicActions } from '@renderer/composables/useTopicActions'
import { useActionsCacheStore } from '@renderer/store/actions-cache'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import InspectorPublish from '../publish/InspectorPublish.vue'
import InspectorHistory from '../history/InspectorHistory.vue'
import type { DropdownMenuItem } from '@nuxt/ui'
import InspectorGraph from './InspectorGraph.vue'
import InspectorValue from './InspectorValue.vue'
import FavoriteStarButton from './FavoriteStarButton.vue'
import { computed } from 'vue'

const props = defineProps<{ clientKey: string; topic: string }>()

const emit = defineEmits<{ select: [topic: string] }>()

const actionsCacheStore = useActionsCacheStore()
const mqttTopicsStore = useMqttTopicsStore()
const exploreUiStore = useExploreUiStore()
const { copy } = useClipboardToast()

const {
  favoritedTopics,
  topicLastMessage,
  toggleFavorite,
  handleCopyTopic,
  handleCopyLastMessage,
  handleClearRetained,
  handleEraseTopic,
  exportItems
} = useTopicActions({ clientKey: () => props.clientKey, topic: () => props.topic })

const parts = computed(() => props.topic.split('/'))
const parents = computed(() => parts.value.slice(0, -1))
const title = computed(() => parts.value[parts.value.length - 1])

const tabs = [
  { label: 'Value', value: 'value' },
  { label: 'History', value: 'history' },
  { label: 'Graph', value: 'graph' },
  { label: 'Publish here', value: 'publish' }
]

const tab = computed<InspectorTab>({
  get: () => {
    const stored = exploreUiStore.getTopicTab(props.clientKey, props.topic)

    if (stored) return stored
    if (topicLastMessage.value) return 'value'
    if (actionsCacheStore.hasAction(props.clientKey, props.topic)) return 'publish'

    return 'value'
  },
  set: (value) => {
    if (value === 'history' && exploreUiStore.layout !== 'split') exploreUiStore.layout = 'split'
    exploreUiStore.setTopicTab(props.clientKey, props.topic, value)
  }
})

const messages = computed(
  () => mqttTopicsStore.topicsMessages[props.clientKey]?.[props.topic] ?? []
)

const pills = computed(() => {
  const last = topicLastMessage.value

  if (!last) return []

  const kind = parseMessage(last).kind

  return [
    `QoS ${last.qos}`,
    `${kindLabel(kind, last.dataType)} · ${formatBytes(byteSize(last.message))}`,
    formatRate(messages.value)
  ].filter(Boolean)
})

const moreItems = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: 'Copy last message',
      icon: 'i-lucide-clipboard',
      disabled: !topicLastMessage.value,
      onSelect: handleCopyLastMessage
    },
    {
      label: 'Export history',
      icon: 'i-lucide-file-down',
      disabled: !topicLastMessage.value,
      children: exportItems()
    }
  ],
  [
    ...(topicLastMessage.value?.retained
      ? [
          {
            label: 'Clear retained message',
            icon: 'i-lucide-bookmark-x',
            onSelect: handleClearRetained
          }
        ]
      : []),
    {
      label: 'Erase topic',
      icon: 'i-lucide-eraser',
      color: 'error' as const,
      onSelect: handleEraseTopic
    }
  ]
])

const selectParent = (index: number) => emit('select', parents.value.slice(0, index + 1).join('/'))

const handlePublished = (topic: string) => {
  exploreUiStore.setTopicTab(props.clientKey, topic, 'publish')

  if (topic !== props.topic) emit('select', topic)
}
</script>

<template>
  <aside aria-label="Topic inspector" class="bg-default flex min-h-0 min-w-0 flex-col">
    <UEmpty
      v-if="!topic"
      icon="i-lucide-mouse-pointer-click"
      title="Select a topic"
      description="Pick a topic in the tree to see its value, history and graph. Use the arrow keys to move through topics."
      variant="naked"
      class="flex-1"
    />
    <template v-else>
      <div class="flex flex-col gap-2 px-5 pt-4">
        <nav
          v-if="parents.length"
          aria-label="Topic path"
          class="text-muted flex flex-wrap items-center gap-0.5 font-mono text-[13px]"
        >
          <template v-for="(part, index) in parents" :key="index">
            <UContextMenu
              :items="[
                [
                  {
                    label: 'Copy',
                    icon: 'i-lucide-copy',
                    onSelect: () => copy(part, 'Topic key copied to clipboard')
                  }
                ]
              ]"
            >
              <button
                type="button"
                class="hover:bg-muted hover:text-default rounded-md px-1.5 py-0.5"
                :class="{ 'italic opacity-70': !part }"
                @click="selectParent(index)"
              >
                {{ part || '(empty)' }}
              </button>
            </UContextMenu>
            <span>/</span>
          </template>
        </nav>
        <div class="flex items-center justify-between gap-2">
          <h1
            class="min-w-0 text-2xl leading-[30px] font-bold break-all"
            :class="{ 'text-dimmed italic': !title }"
          >
            {{ title || '(empty)' }}
          </h1>
          <div class="flex shrink-0 gap-0.5">
            <FavoriteStarButton :favorite="favoritedTopics" @click="toggleFavorite" />
            <UTooltip text="Copy topic">
              <UButton
                icon="i-lucide-copy"
                color="neutral"
                variant="ghost"
                aria-label="Copy topic"
                class="text-muted"
                @click="handleCopyTopic"
              />
            </UTooltip>
            <UDropdownMenu :items="moreItems" :content="{ align: 'end' }">
              <UButton
                icon="i-lucide-ellipsis"
                color="neutral"
                variant="ghost"
                aria-label="More topic actions"
                class="text-muted"
              />
            </UDropdownMenu>
          </div>
        </div>
        <div v-if="topicLastMessage" class="flex flex-wrap gap-1.5 text-xs">
          <span
            v-if="topicLastMessage.retained"
            class="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 font-semibold"
          >
            Retained
          </span>
          <span
            v-for="pill in pills"
            :key="pill"
            class="bg-muted text-muted rounded-full px-2.5 py-0.5"
          >
            {{ pill }}
          </span>
        </div>
        <UTabs
          v-model="tab"
          :items="tabs"
          :content="false"
          variant="link"
          size="sm"
          class="mt-1.5"
          :ui="{
            list: 'gap-[18px] border-default',
            trigger: 'px-0 font-medium data-[state=active]:font-bold'
          }"
        />
      </div>

      <div class="min-h-0 flex-1 overflow-auto px-5 py-4">
        <InspectorValue
          v-if="tab === 'value'"
          :client-key="clientKey"
          :topic="topic"
          @select="emit('select', $event)"
          @publish="tab = 'publish'"
        />
        <InspectorHistory v-else-if="tab === 'history'" :client-key="clientKey" :topic="topic" />
        <InspectorGraph v-else-if="tab === 'graph'" :client-key="clientKey" :topic="topic" />
        <InspectorPublish
          v-else-if="tab === 'publish'"
          :client-key="clientKey"
          :topic="topic"
          @published="handlePublished"
        />
      </div>
    </template>
  </aside>
</template>
