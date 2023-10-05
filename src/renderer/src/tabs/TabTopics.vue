<script setup lang="ts">
import CodePreview from '../components/tap-topics/CodePreview.vue'
import TopicItem from '../components/tap-topics/TopicItem.vue'
import CopyButton from '../components/buttons/CopyButton.vue'
import { useSettingsStore } from '../store/settings-store'
import { useMqttTopicsStore } from '../store/mqtt-topics'
import { computed, onMounted, ref, watch } from 'vue'

const mqttTopicsStore = useMqttTopicsStore()
const settingsStore = useSettingsStore()

const splitterModel = ref(400)

const showTopics = ref(false)

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

const handleTopicClick = (key: string) => {
  handleSelectTopic(key)
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
  const topic = [mqttTopicsStore.selectedConnection, ...breadcrumbs.value.slice(0, index + 1)]

  handleSelectTopic(topic.join('/'))
}

const handleSelectTopic = (topic: string) => {
  mqttTopicsStore.setSelectedTopic(topic)
  codePreviewData.value = ''
}

const topicSearch = computed({
  get: () => mqttTopicsStore.topicSearch,
  set: (value) => {
    mqttTopicsStore.setTopicSearch(value)
  }
})
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
            class="tw-p-3 tw-h-full tw-max-h-full"
            :items="Object.entries(mqttTopicsStore.topicsStructure)"
          >
            <TopicItem
              :key="key"
              :client-key="key"
              :topic-key="key"
              :topic-path="key"
              :topic-index="0"
              :topic-structure="value"
              @topic:click="handleTopicClick"
            />
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
                  <div>{{ settingsStore.formatDateTime(message.createdAt) }}</div>
                  <copy-button @click="copyMessage(message.message)" />
                </div>
                <div class="tw-whitespace-pre">{{ formatMessage(message.message) }}</div>
              </q-card>
            </div>
          </q-tab-panel>

          <q-tab-panel name="publish">
            <div class="text-h6">Publish In Work</div>
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

<style scoped lang="less"></style>
