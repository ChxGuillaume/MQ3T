<script setup lang="ts">
import ConnectionContextMenu from '../components/tap-topics/ConnectionContextMenu.vue'
import ConnectionStatusChip from '../components/ConnectionStatusChip.vue'
import { useMqttConnectionsStore } from '../store/mqtt-connections'
import { ElectronIpc } from '../../../types/electron-ipc-callbacks'
import CodePreview from '../components/tap-topics/CodePreview.vue'
import TabPublish from '../components/tap-topics/TabPublish.vue'
import TopicItem from '../components/tap-topics/TopicItem.vue'
import TopicCard from '../components/tap-topics/TopicCard.vue'
import CopyButton from '../components/buttons/CopyButton.vue'
import { useSettingsStore } from '../store/settings-store'
import { useMqttTopicsStore } from '../store/mqtt-topics'
import { computed, onMounted, ref, watch } from 'vue'

const mqttConnectionsStore = useMqttConnectionsStore()
const mqttTopicsStore = useMqttTopicsStore()
const settingsStore = useSettingsStore()

const electronApi = window.api as ElectronIpc

const splitterModel = ref(400)

const showTopics = ref(false)
const expandConnection = ref<{ [key: string]: boolean }>({})
const selectedConnection = ref('')

const tab = ref('values')
const current = ref(1)

const selectedTopicLastMessage = computed(() => {
  return mqttTopicsStore.getSelectedTopicLastMessage
})

const slicedMessages = computed(() => {
  if (!settingsStore.messagesPagination) return mqttTopicsStore.getSelectedTopicMessages

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
  if (settingsStore.smartTopicGroupClose) {
    if (!expandConnection.value[clientKey] && selectedConnection.value === clientKey) {
      expandConnection.value[clientKey] = !expandConnection.value[clientKey]
    } else if (expandConnection.value[clientKey]) {
      expandConnection.value[clientKey] = !expandConnection.value[clientKey]
    }
  } else {
    expandConnection.value[clientKey] = !expandConnection.value[clientKey]
  }

  mqttTopicsStore.setSelectedTopic(clientKey, '')
  selectedConnection.value = clientKey
}

const handleClearRetained = () => {
  electronApi.sendMqttMessage(
    mqttTopicsStore.selectedConnection,
    mqttTopicsStore.selectedTopic,
    '',
    { retain: true, qos: 0 }
  )

  mqttTopicsStore.addPublishMessage(
    mqttTopicsStore.selectedConnection,
    mqttTopicsStore.selectedTopic,
    '',
    { retained: true, qos: 0 }
  )
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
        <div class="">
          <q-input v-model="topicSearch" filled label="Search Topic..." dense square />
        </div>
        <q-separator />
        <div class="tw-overflow-auto">
          <q-virtual-scroll
            v-slot="{ item: [_, value] }"
            class="tw-h-full tw-max-h-full"
            :items="Object.entries(mqttConnectionsStore.getConnectionsWithStatus)"
          >
            <div class="tw-p-3 tw-flex tw-flex-col tw-gap-1" :key="value.clientKey">
              <topic-card
                expandable
                :active="selectedConnection === value.clientKey"
                :opened="!expandConnection[value.clientKey]"
                @open:toggle="handleExpandConnection(value.clientKey)"
              >
                <span class="connection-card-title">{{ value.name }}</span>
                <span class="tw-ml-1">
                  <connection-status-chip
                    :connection-status="mqttConnectionsStore.getConnectionStatus(value.clientKey)"
                    size="xs"
                  />
                </span>
                <connection-context-menu :connection="value" />
              </topic-card>
              <template v-if="!expandConnection[value.clientKey]">
                <TopicItem
                  v-for="[pathKey, structure] in Object.entries(
                    mqttTopicsStore.getFilteredTopicsStructure(value.clientKey)
                  ).sort((a, b) => a[0].localeCompare(b[0]))"
                  :key="pathKey"
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
      <q-card class="tw-h-full tw-grid" style="grid-template-rows: 1fr auto auto">
        <q-tab-panels v-model="tab" animated keep-alive>
          <q-tab-panel
            name="values"
            class="tw-p-0 tw-grid"
            style="grid-template-rows: auto auto 1fr"
          >
            <div class="tw-p-4 tw-flex tw-flex-col tw-gap-1 tw-h-[94px]">
              <div class="tw-flex tw-gap-2">
                <h2 class="tw-text-xl tw-font-bold">Topic</h2>
                <copy-button @click="copySelectedTopic" />
              </div>
              <div class="tw-flex tw-items-center tw-min-h-[28px]">
                <span v-if="!breadcrumbs.length">No Topic Selected</span>
                <q-breadcrumbs v-else gutter="none">
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
            </div>
            <q-separator />
            <div class="tw-overflow-auto">
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
                      @click="handleClearRetained"
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
                    v-if="settingsStore.messagesPagination"
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
                        <span v-if="message.createdDiff" class="tw-text-xs message-details">
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
            </div>
          </q-tab-panel>

          <q-tab-panel name="publish" class="tw-p-0">
            <tab-publish />
          </q-tab-panel>

          <q-tab-panel name="stats" class="tw-flex tw-justify-center tw-items-center">
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
.body--light {
  .connection-card-title {
    @apply tw-text-black;
  }

  .message-details {
    @apply tw-text-neutral-500;
  }
}

.body--dark {
  .connection-card-title {
    @apply tw-text-white;
  }

  .message-details {
    @apply tw-text-neutral-400;
  }
}
</style>
