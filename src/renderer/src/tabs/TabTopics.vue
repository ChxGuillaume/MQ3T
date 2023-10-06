<script setup lang="ts">
import ConnectionContextMenu from '../components/tap-topics/ConnectionContextMenu.vue'
import ConnectionStatusChip from '../components/ConnectionStatusChip.vue'
import { useMqttConnectionsStore } from '../store/mqtt-connections'
import CodePreview from '../components/tap-topics/CodePreview.vue'
import CodeEditor from '../components/tap-topics/CodeEditor.vue'
import TopicItem from '../components/tap-topics/TopicItem.vue'
import CopyButton from '../components/buttons/CopyButton.vue'
import { useSettingsStore } from '../store/settings-store'
import { useMqttTopicsStore } from '../store/mqtt-topics'
import { computed, onMounted, ref, watch } from 'vue'

const mqttConnectionsStore = useMqttConnectionsStore()
const mqttTopicsStore = useMqttTopicsStore()
const settingsStore = useSettingsStore()

const splitterModel = ref(400)

const showTopics = ref(false)
const expandConnection = ref<{ [key: string]: boolean }>({})
const publishDataType = ref('raw')
const selectedConnection = ref('')

const tab = ref('values')
const current = ref(1)

const selectedTopicLastMessage = computed(() => {
  return mqttTopicsStore.getSelectedTopicLastMessage
})

const slicedMessages = computed(() => {
  const start = (current.value - 1) * 5
  const end = start + 5

  return mqttTopicsStore.sortedSelectedTopicMessages.slice(start, end)
})

const handleTopicClick = (clientKey: string, topic: string) => {
  handleSelectTopic(clientKey, topic)
}

const copySelectedTopic = () => {
  navigator.clipboard.writeText(mqttTopicsStore.selectedTopic)
}

const copySelectedTopicMessage = () => {
  navigator.clipboard.writeText(selectedTopicLastMessage.value?.message || '')
}

const copyMessage = (message: string) => {
  navigator.clipboard.writeText(message)
}

const codePreviewData = ref('{}')

const formatMessage = (message: string) => {
  let data = message

  try {
    data = JSON.parse(message)
    data = JSON.stringify(data, null, 4)
  } catch (e) {
    /* empty */
  }

  return data
}

const updateEditor = (message: string) => {
  if (!message) return

  codePreviewData.value = formatMessage(message)
}

watch(
  () => mqttTopicsStore.getSelectedTopicLastMessage,
  (mqttMessage) => {
    mqttMessage?.message && updateEditor(mqttMessage.message)
  }
)

onMounted(() => {
  setTimeout(() => {
    showTopics.value = true
  }, 100)
})

const breadcrumbs = computed(() => {
  return mqttTopicsStore.selectedTopic.split('/').filter((t) => t !== '')
})

const handleBreadcrumbClick = (index: number) => {
  handleSelectTopic(
    mqttTopicsStore.selectedConnection,
    breadcrumbs.value.slice(0, index + 1).join('/')
  )
}

const handleSelectTopic = (clientKey: string, topic: string) => {
  mqttTopicsStore.setSelectedTopic(clientKey, topic)
  codePreviewData.value = ''
  selectedConnection.value = ''
}

const topicSearch = computed({
  get: () => mqttTopicsStore.topicSearch,
  set: (value) => {
    mqttTopicsStore.setTopicSearch(value)
  }
})

const formatDuration = (duration: number) => {
  if (duration > -1000) return `${duration} ms`

  return `${(duration / 1000).toFixed(2)} s`
}

const handleExpandConnection = (clientKey: string) => {
  expandConnection.value[clientKey] = !expandConnection.value[clientKey]
  mqttTopicsStore.setSelectedTopic(clientKey, '')
  selectedConnection.value = clientKey
}
</script>

<template>
  <q-splitter
    v-model="splitterModel"
    class="tw-h-full tw-max-h-full"
    :limits="[400, 700]"
    unit="px"
    reverse
  >
    <template #before>
      <div class="tw-h-full tw-grid" style="grid-template-rows: auto auto 1fr">
        <div class="tw-p-2">
          <q-input v-model="topicSearch" filled label="Search" dense />
        </div>
        <q-separator />
        <div class="tw-overflow-auto">
          <q-virtual-scroll
            v-slot="{ item: [key, value] }"
            class="tw-h-full tw-max-h-full"
            :items="Object.entries(mqttConnectionsStore.getConnectionsWithStatus)"
          >
            <div class="tw-p-3 tw-flex tw-flex-col tw-gap-1">
              <q-card
                :key="key"
                flat
                :class="{
                  active: selectedConnection === value.clientKey,
                  opened: !expandConnection[value.clientKey]
                }"
                class="topic-item-card card-secondary-background tw-pr-3 tw-select-none"
                @click.stop="handleExpandConnection(value.clientKey)"
              >
                <q-icon name="fa-solid fa-caret-right" size="xs" class="expand-icon" />
                {{ value.name }}
                <span>
                  <connection-status-chip
                    :connection-status="mqttConnectionsStore.getConnectionStatus(value.clientKey)"
                    size="xs"
                  />
                </span>
                <connection-context-menu :connection="value" />
              </q-card>
              <template v-if="!expandConnection[value.clientKey]">
                <TopicItem
                  v-for="[pathKey, structure] in Object.entries(
                    mqttTopicsStore.getFilteredTopicsStructure(value.clientKey)
                  ).sort((a, b) => a[0].localeCompare(b[0]))"
                  :client-key="value.clientKey"
                  :topic-key="pathKey"
                  :topic-path="pathKey"
                  :topic-index="1"
                  :topic-structure="structure"
                  @topic:click="handleTopicClick(value.clientKey, $event)"
                />
              </template>
            </div>
            <q-separator />
          </q-virtual-scroll>
        </div>
      </div>
    </template>

    <template #after>
      <q-card class="tw-h-full tw-grid" style="grid-template-rows: auto auto 1fr auto">
        <div class="tw-p-4 tw-flex tw-flex-col tw-gap-4">
          <div class="tw-flex tw-gap-2">
            <h2 class="tw-text-xl tw-font-bold">Topic</h2>
            <copy-button @click="copySelectedTopic" />
          </div>
          <q-breadcrumbs gutter="none">
            <q-breadcrumbs-el v-for="(topicPart, index) in breadcrumbs" :key="index">
              <q-chip
                size="sm"
                color="primary"
                text-color="white"
                square
                ripple
                clickable
                :label="topicPart"
                @click="handleBreadcrumbClick(index)"
              />
            </q-breadcrumbs-el>
          </q-breadcrumbs>
        </div>

        <q-separator />

        <q-tab-panels v-model="tab" animated keep-alive>
          <q-tab-panel name="values" class="tw-p-0">
            <div v-if="selectedTopicLastMessage">
              <div class="tw-p-4 tw-flex justify-between">
                <div>
                  QoS: {{ selectedTopicLastMessage?.qos || 0 }}
                  <copy-button @click="copySelectedTopicMessage" />
                </div>
                <div v-if="selectedTopicLastMessage?.retained">
                  <q-chip
                    size="sm"
                    class="text-weight-bold"
                    color="primary"
                    text-color="white"
                    icon-right="fa-solid fa-xmark"
                    square
                    clickable
                    label="Retained"
                  />
                </div>
                <div class="tw-flex tw-flex-col items-end">
                  <div>
                    {{
                      selectedTopicLastMessage?.createdAt &&
                      settingsStore.formatDate(selectedTopicLastMessage?.createdAt)
                    }}
                  </div>
                  <div>
                    {{
                      selectedTopicLastMessage?.createdAt &&
                      settingsStore.formatTime(selectedTopicLastMessage?.createdAt)
                    }}
                  </div>
                </div>
              </div>
              <code-preview :value="codePreviewData" />
              <div class="tw-px-4 tw-pt-2 tw-flex justify-between">
                <div class="tw-flex items-center tw-gap-2">
                  History
                  <q-chip size="sm" color="primary" text-color="white">
                    {{ mqttTopicsStore.getSelectedTopicMessages.length }} messages
                  </q-chip>
                </div>
                <q-pagination
                  v-model="current"
                  size="xs"
                  :max="Math.ceil(mqttTopicsStore.getSelectedTopicMessages.length / 5)"
                  input
                />
              </div>
              <div class="tw-p-3 tw-flex tw-flex-col tw-gap-2">
                <q-card
                  v-for="message in slicedMessages"
                  :key="message.uid"
                  flat
                  class="tw-p-2 tw-cursor-pointer tw-select-none card-secondary-background"
                >
                  <div class="tw-mb-2 tw-flex tw-justify-between">
                    <div>
                      {{ settingsStore.formatDateTime(message.createdAt) }}
                      <span v-if="message.createdDiff" class="tw-text-xs topic-item-details">
                        ({{ formatDuration(message.createdDiff) }})
                      </span>
                    </div>
                    <copy-button @click="copyMessage(message.message)" />
                  </div>
                  <div class="tw-w-full tw-max-w-full tw-break-all tw-overflow-hidden">
                    {{ formatMessage(message.message) }}
                  </div>
                </q-card>
              </div>
            </div>
            <div
              v-else
              class="tw-h-full tw-flex tw-justify-center tw-items-center tw-text-2xl tw-font-bold"
            >
              No Messages
            </div>
          </q-tab-panel>

          <q-tab-panel name="publish" class="tw-p-0">
            <div class="text-h6">Publish In Work</div>
            <q-card flat bordered class="tw-inline-block tw-m-2">
              <q-btn-toggle
                v-model="publishDataType"
                toggle-color="primary"
                :options="[
                  { label: 'Raw', value: 'raw' },
                  { label: 'JSON', value: 'json' },
                  { label: 'XML', value: 'xml' }
                ]"
              />
            </q-card>
            <code-editor :value="codePreviewData" :language="publishDataType" />
          </q-tab-panel>

          <q-tab-panel name="stats">
            <div class="text-h6">Stats In Work</div>
          </q-tab-panel>
        </q-tab-panels>

        <q-separator />

        <q-tabs
          v-model="tab"
          inline-label
          active-color="white"
          active-bg-color="primary"
          indicator-color="transparent"
        >
          <q-tab name="values">
            <q-icon name="fa-solid fa-list-ol" class="tw-mr-2" />
            Values
          </q-tab>
          <q-tab name="publish">
            <q-icon name="fa-solid fa-paper-plane" class="tw-mr-2" />
            Publish
          </q-tab>
          <q-tab name="stats">
            <q-icon name="fa-solid fa-chart-simple" class="tw-mr-2" />
            Stats
          </q-tab>
        </q-tabs>
      </q-card>
    </template>
  </q-splitter>
</template>

<style scoped lang="less">
.opened {
  .expand-icon {
    transform: rotate(90deg);
  }
}

.topic-item-card {
  @apply tw-py-1 tw-line-clamp-1 tw-cursor-pointer tw-transition-colors;
}

.body--light {
  .topic-item-card:hover {
    background: #65016433 !important;
  }

  .topic-item-card.active {
    background: #65016455 !important;
  }

  .topic-item-details {
    @apply tw-text-neutral-500;
  }
}

.body--dark {
  .topic-item-card:hover {
    background: #65016488 !important;
  }

  .topic-item-card.active {
    background: #650164ee !important;
  }

  .topic-item-details {
    @apply tw-text-neutral-400;
  }
}
</style>
