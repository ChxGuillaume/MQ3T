<script setup lang="ts">
import ConnectionContextMenu from '../components/tap-topics/ConnectionContextMenu.vue'
import BrokerDetailsPanel from '../components/tap-topics/BrokerDetailsPanel.vue'
import ConnectionStatusChip from '../components/ConnectionStatusChip.vue'
import { useMqttConnectionsStore } from '../store/mqtt-connections'
import TabPublish from '../components/tap-topics/TabPublish.vue'
import TopicItem from '../components/tap-topics/TopicItem.vue'
import TopicCard from '../components/tap-topics/TopicCard.vue'
import TabValues from '../components/tap-topics/TabValues.vue'
import { useSettingsStore } from '../store/settings-store'
import { useMqttTopicsStore } from '../store/mqtt-topics'
import SplitterIcon from '../components/SplitterIcon.vue'
import { computed, ref } from 'vue'

const mqttConnectionsStore = useMqttConnectionsStore()
const mqttTopicsStore = useMqttTopicsStore()
const settingsStore = useSettingsStore()

const splitterModel = ref(400)

const expandConnection = ref<{ [key: string]: boolean }>({})
const selectedConnection = ref('')

const topicTabRecord = ref<Record<string, string>>({})

const topicTab = computed({
  get: () => topicTabRecord.value[mqttTopicsStore.selectedTopic] || 'values',
  set: (value) => (topicTabRecord.value[mqttTopicsStore.selectedTopic] = value)
})

const handleTopicClick = (clientKey: string, topic: string) => {
  handleSelectTopic(clientKey, topic)
}

const handleSelectTopic = (clientKey: string, topic: string) => {
  if (topic === mqttTopicsStore.selectedTopic) return

  selectedConnection.value = ''

  mqttTopicsStore.setSelectedTopic(clientKey, topic)
}

const topicSearch = computed({
  get: () => mqttTopicsStore.topicSearch,
  set: (value) => mqttTopicsStore.setTopicSearch(value)
})

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

const handleMessagePublished = (topic: string) => {
  topicTabRecord.value[topic] = 'publish'
  mqttTopicsStore.setSelectedTopic(mqttTopicsStore.selectedConnection, topic)
}

const allTopics = computed(() =>
  mqttTopicsStore.getAllTopicList(mqttTopicsStore.selectedConnection).sort()
)

const handleUpKey = () => {
  const selectedTopicIndex = allTopics.value.indexOf(mqttTopicsStore.selectedTopic)

  // TODO: find a way to skip topic that are not visible

  if (selectedTopicIndex > 0) {
    handleSelectTopic(mqttTopicsStore.selectedConnection, allTopics.value[selectedTopicIndex - 1])
  }
}

const handleDownKey = () => {
  const selectedTopicIndex = allTopics.value.indexOf(mqttTopicsStore.selectedTopic)

  // TODO: find a way to skip topic that are not visible

  if (selectedTopicIndex < allTopics.value.length - 1) {
    handleSelectTopic(mqttTopicsStore.selectedConnection, allTopics.value[selectedTopicIndex + 1])
  }
}

const handleLeftKey = () => {
  const clientKey = mqttTopicsStore.selectedConnection
  const topic = mqttTopicsStore.selectedTopic

  const isGroup = mqttTopicsStore.topicHasSubTopics(clientKey, topic)

  if (isGroup) mqttTopicsStore.setTopicGroupOpened(clientKey, topic, false)
}

const handleRightKey = () => {
  const clientKey = mqttTopicsStore.selectedConnection
  const topic = mqttTopicsStore.selectedTopic

  const isGroup = mqttTopicsStore.topicHasSubTopics(clientKey, topic)

  if (isGroup) mqttTopicsStore.setTopicGroupOpened(clientKey, topic, true)
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
          <q-input
            v-model="topicSearch"
            filled
            label="Search Topic..."
            dense
            square
            debounce="100"
          />
        </div>
        <q-separator />
        <div
          class="tw-overflow-auto"
          @keydown.up.prevent="handleUpKey"
          @keydown.down.prevent="handleDownKey"
          @keydown.left.prevent="handleLeftKey"
          @keydown.right.prevent="handleRightKey"
        >
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

    <template v-slot:separator>
      <splitter-icon vertical @click:double="splitterModel = 400" />
    </template>

    <template #after>
      <q-card
        class="tw-relative tw-h-full tw-grid tw-overflow-hidden"
        style="grid-template-rows: 1fr auto auto"
      >
        <q-tab-panels
          v-model="topicTab"
          animated
          keep-alive
          transition-prev="slide-down"
          transition-next="slide-up"
        >
          <q-tab-panel
            name="values"
            class="tw-p-0 tw-grid"
            style="grid-template-rows: auto auto 1fr"
          >
            <tab-values />
          </q-tab-panel>

          <q-tab-panel name="publish" class="tw-p-0">
            <tab-publish @click:publish="handleMessagePublished" />
          </q-tab-panel>

          <q-tab-panel name="stats" class="tw-flex tw-justify-center tw-items-center">
            <div class="text-h6">Stats In Work</div>
          </q-tab-panel>
        </q-tab-panels>

        <q-separator />

        <q-tabs
          v-model="topicTab"
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
          <q-tab name="stats" v-if="false">
            <q-icon name="fa-solid fa-chart-simple" class="tw-mr-2" />
            Stats
          </q-tab>
        </q-tabs>

        <transition
          appear
          enter-active-class="animated fadeInRight"
          leave-active-class="animated fadeOutRight"
        >
          <broker-details-panel
            v-if="selectedConnection !== '' && mqttTopicsStore.selectedTopic === ''"
            class="broker-details-panel"
          />
        </transition>
      </q-card>
    </template>
  </q-splitter>
</template>

<style scoped lang="less">
.broker-details-panel {
  @apply tw-absolute tw-w-full tw-h-full tw-transition-transform;
}

.broker-details-panel.show {
  transform: translateX(0);
}

.body--light {
  .connection-card-title {
    @apply tw-text-black;
  }
}

.body--dark {
  .connection-card-title {
    @apply tw-text-white;
  }
}
</style>
