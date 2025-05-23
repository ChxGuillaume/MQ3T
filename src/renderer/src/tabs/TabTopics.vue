<script setup lang="ts">
import ConnectionContextMenu from '../components/tap-topics/ConnectionContextMenu.vue'
import TabChainActions from '@renderer/components/tap-topics/TabChainActions.vue'
import BrokerDetailsPanel from '../components/tap-topics/BrokerDetailsPanel.vue'
import TabFavorites from '@renderer/components/tap-topics/TabFavorites.vue'
import ConnectionStatusChip from '../components/ConnectionStatusChip.vue'
import { useMqttConnectionsStore } from '../store/mqtt-connections'
import TabPublish from '../components/tap-topics/TabPublish.vue'
import { ElectronApi } from '@renderer/assets/js/electron-api'
import TopicItem from '../components/tap-topics/TopicItem.vue'
import TopicCard from '../components/tap-topics/TopicCard.vue'
import TabValues from '../components/tap-topics/TabValues.vue'
import GraphList from '../components/tap-topics/GraphList.vue'
import { useActionsCacheStore } from '../store/actions-cache'
import { sortTopics } from '@renderer/assets/js/sort-topics'
import { useSettingsStore } from '../store/settings-store'
import { useMqttTopicsStore } from '../store/mqtt-topics'
import SplitterIcon from '../components/SplitterIcon.vue'
import { useDataGraphsStore } from '../store/data-graphs'
import { useAppStore } from '../store/app-store'
import { computed, onMounted, ref } from 'vue'
import { scroll } from 'quasar'

const { setVerticalScrollPosition } = scroll

const mqttConnectionsStore = useMqttConnectionsStore()
const actionsCacheStore = useActionsCacheStore()
const mqttTopicsStore = useMqttTopicsStore()
const dataGraphsStore = useDataGraphsStore()
const settingsStore = useSettingsStore()
const appStore = useAppStore()

const visualizationSplitter = ref(400)

const scrubbingTimeout = ref<NodeJS.Timeout | undefined>(undefined)
const expandConnection = ref<{ [key: string]: boolean }>({})
const selectedConnection = ref('')

const topicTabRecord = ref<Record<string, string>>({})

const graphWindowShown = ref(ElectronApi.getGraphWindowShown())

const graphListVisible = computed(() => {
  if (graphWindowShown.value) return false

  return !!dataGraphsStore.dataGraph.length
})

const graphSplitterData = ref(40)
const graphSplitter = computed({
  get: () => {
    if (!graphListVisible.value) return 0
    return graphSplitterData.value
  },
  set: (value) => {
    graphSplitterData.value = value
  }
})

const isChainActionsTab = ref(false)
const isFavoriteTab = ref(false)
const topicTab = computed({
  get: () => {
    if (isChainActionsTab.value) return 'chain-actions'
    if (isFavoriteTab.value) return 'favorites'

    if (topicTabRecord.value[mqttTopicsStore.selectedTopic])
      return topicTabRecord.value[mqttTopicsStore.selectedTopic]

    const lastMessage = mqttTopicsStore.getTopicLastMessage(
      mqttTopicsStore.selectedConnection,
      mqttTopicsStore.selectedTopic
    )

    if (lastMessage) return 'values'

    const hasActions = actionsCacheStore.hasAction(
      mqttTopicsStore.selectedConnection,
      mqttTopicsStore.selectedTopic
    )

    if (hasActions) return 'publish'

    return 'values'
  },
  set: (value) => {
    switch (value) {
      case 'chain-actions':
        isChainActionsTab.value = true
        isFavoriteTab.value = false
        return
      case 'favorites':
        isChainActionsTab.value = false
        isFavoriteTab.value = true
        return
    }

    isChainActionsTab.value = false
    isFavoriteTab.value = false

    topicTabRecord.value[mqttTopicsStore.selectedTopic] = value
  }
})

const handleTopicClick = (clientKey: string, topic: string) => {
  handleSelectTopic(clientKey, topic)
}

const handleSelectTopic = (clientKey: string, topic: string) => {
  if (mqttTopicsStore.selectedConnection === clientKey && mqttTopicsStore.selectedTopic === topic)
    return

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

const allTopics = computed(() => {
  return mqttTopicsStore
    .getAllTopicList(mqttTopicsStore.selectedConnection)
    .slice()
    .sort(sortTopics)
})

const topicToSelect = (index: number, direction: 'up' | 'down'): string | null => {
  const nextIndex = direction === 'up' ? index - 1 : index + 1
  const topic = allTopics.value[nextIndex]

  if (!topic) return null

  const parts = topic.split('/').slice(0, -1)

  const isNotOpened = parts.find((_, index) => {
    return !mqttTopicsStore.getTopicGroupOpened(
      mqttTopicsStore.selectedConnection,
      parts.slice(0, index + 1).join('/')
    )
  })

  if (typeof isNotOpened !== 'string') return topic
  return topicToSelect(nextIndex, direction)
}

const handleKeyUp = (event: KeyboardEvent) => {
  if (['ArrowUp', 'ArrowDown'].includes(event.key)) {
    event.preventDefault()
  }

  if (event.key === 'ArrowUp') handleUpKeyUp()
  else if (event.key === 'ArrowDown') handleDownKeyUp()
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
    event.preventDefault()
  }

  if (event.key === 'ArrowUp') handleUpKeyDown()
  else if (event.key === 'ArrowDown') handleDownKeyDown()
  else if (event.key === 'ArrowLeft') handleLeftKey()
  else if (event.key === 'ArrowRight') handleRightKey()
}

const handleUpKeyDown = () => {
  const clientKey = mqttTopicsStore.selectedConnection
  const selectedTopicIndex = allTopics.value.indexOf(mqttTopicsStore.selectedTopic)
  const previousTopic = topicToSelect(selectedTopicIndex, 'up')

  if (previousTopic) {
    handleSelectTopic(mqttTopicsStore.selectedConnection, previousTopic)
    handleScrollPreviousTopic(clientKey, previousTopic)
  }

  scrubbingTimeout.value = setTimeout(() => {
    appStore.setIsScrubbingTopics(true)
  }, 100)
}

const handleUpKeyUp = () => {
  clearTimeout(scrubbingTimeout.value)

  appStore.setIsScrubbingTopics(false)
}

const handleDownKeyDown = () => {
  const clientKey = mqttTopicsStore.selectedConnection
  const selectedTopicIndex = allTopics.value.indexOf(mqttTopicsStore.selectedTopic)
  const nextTopic = topicToSelect(selectedTopicIndex, 'down')

  if (nextTopic) {
    handleSelectTopic(mqttTopicsStore.selectedConnection, nextTopic)
    handleScrollNextTopic(clientKey, nextTopic)
  }

  scrubbingTimeout.value = setTimeout(() => {
    appStore.setIsScrubbingTopics(true)
  }, 100)
}

const handleDownKeyUp = () => {
  clearTimeout(scrubbingTimeout.value)

  appStore.setIsScrubbingTopics(false)
}

const handleLeftKey = () => {
  const clientKey = mqttTopicsStore.selectedConnection
  const topic = mqttTopicsStore.selectedTopic

  const isGroup = mqttTopicsStore.topicHasSubTopics(clientKey, topic)
  const isOpened = mqttTopicsStore.getTopicGroupOpened(clientKey, topic)

  if (isGroup && isOpened) mqttTopicsStore.setTopicGroupOpened(clientKey, topic, false)
  else {
    const previousTopic = topic.split('/').slice(0, -1).join('/')

    if (previousTopic) {
      handleSelectTopic(clientKey, previousTopic)
      handleScrollPreviousTopic(clientKey, previousTopic)
    }
  }
}

const handleRightKey = () => {
  const clientKey = mqttTopicsStore.selectedConnection
  const topic = mqttTopicsStore.selectedTopic

  const isGroup = mqttTopicsStore.topicHasSubTopics(clientKey, topic)
  const isOpened = mqttTopicsStore.getTopicGroupOpened(clientKey, topic)

  if (isGroup && !isOpened) mqttTopicsStore.setTopicGroupOpened(clientKey, topic, true)
  else {
    const nextTopic = topicToSelect(allTopics.value.indexOf(topic), 'down')

    if (nextTopic) {
      handleSelectTopic(clientKey, nextTopic)
      handleScrollNextTopic(clientKey, nextTopic)
    }
  }
}

const handleScrollPreviousTopic = (clientKey: string, previousTopic: string) => {
  const virtualScroll = document.getElementById('topicsVirtualScroll')
  const element = document.getElementById(`topic-item-${clientKey}:${previousTopic}-intersection`)

  if (virtualScroll && element) {
    if (element.offsetTop < virtualScroll.scrollTop) {
      setVerticalScrollPosition(virtualScroll, element.offsetTop)
    } else if (element.offsetTop > virtualScroll.scrollTop + virtualScroll.clientHeight) {
      setVerticalScrollPosition(
        virtualScroll,
        element.offsetTop - virtualScroll.clientHeight + element.offsetHeight
      )
    }
  }
}

const handleScrollNextTopic = (clientKey: string, nextTopic: string) => {
  const virtualScroll = document.getElementById('topicsVirtualScroll')
  const element = document.getElementById(`topic-item-${clientKey}:${nextTopic}-intersection`)

  if (virtualScroll && element) {
    if (
      element.offsetTop + element.offsetHeight >
      virtualScroll.scrollTop + virtualScroll.clientHeight
    ) {
      setVerticalScrollPosition(
        virtualScroll,
        element.offsetTop + element.offsetHeight - virtualScroll.clientHeight
      )
    } else if (element.offsetTop < virtualScroll.scrollTop) {
      setVerticalScrollPosition(virtualScroll, element.offsetTop)
    }
  }
}

const tabIconSize = computed(() => {
  return visualizationSplitter.value > 480 ? 'xs' : 'sm'
})

const showTabsText = computed(() => {
  return visualizationSplitter.value > 480
})

onMounted(() => {
  ElectronApi.handleGraphWindowShown((_, shown) => (graphWindowShown.value = shown))
  ElectronApi.handleRequestMqttMessages(() => {
    ElectronApi.transferMqttMessages(JSON.parse(JSON.stringify(mqttTopicsStore.topicsMessages)))
  })
})
</script>

<template>
  <q-splitter
    v-model="visualizationSplitter"
    class="tw-h-full tw-max-h-full"
    :limits="[400, 700]"
    emit-immediately
    unit="px"
    reverse
  >
    <template #before>
      <q-splitter
        v-model="graphSplitter"
        class="overflow-hidden"
        :limits="[0, 90]"
        horizontal
        reverse
        :disable="!graphListVisible"
      >
        <template #before>
          <div class="tw-grid tw-h-full" style="grid-template-rows: auto auto 1fr">
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
            <div class="tw-overflow-auto" @keyup="handleKeyUp" @keydown="handleKeyDown">
              <q-virtual-scroll
                id="topicsVirtualScroll"
                v-slot="{ item: [_, value] }"
                class="tw-h-full tw-max-h-full"
                :items="Object.entries(mqttConnectionsStore.getConnectionsWithStatus)"
              >
                <div class="tw-flex tw-flex-col tw-gap-1 tw-p-3" :key="value.clientKey">
                  <topic-card
                    expandable
                    :active="selectedConnection === value.clientKey"
                    :opened="!expandConnection[value.clientKey]"
                    @open:toggle="handleExpandConnection(value.clientKey)"
                  >
                    <span class="connection-card-title">{{ value.name }}</span>
                    <span class="tw-ml-1">
                      <connection-status-chip
                        :connection-status="
                          mqttConnectionsStore.getConnectionStatus(value.clientKey)
                        "
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

        <template #separator>
          <splitter-icon v-if="graphListVisible" @click:double="graphSplitter = 40" />
        </template>

        <template #after>
          <div class="tw-flex tw-flex-col tw-gap-2 tw-p-2">
            <graph-list />
            <q-btn class="tw-px-5" @click="ElectronApi.showGraphWindow" dense flat>
              <q-icon name="fa-solid fa-external-link-alt" size="10px" left />
              Show in external window
            </q-btn>
          </div>
        </template>
      </q-splitter>
    </template>

    <template v-slot:separator>
      <splitter-icon vertical @click:double="visualizationSplitter = 400" />
    </template>

    <template #after>
      <q-card
        class="tw-relative tw-grid tw-h-full tw-overflow-hidden"
        style="grid-template-rows: 1fr auto auto"
        square
        flat
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
            class="tw-grid tw-p-0"
            style="grid-template-rows: auto auto 1fr"
          >
            <tab-values />
          </q-tab-panel>

          <q-tab-panel name="publish" class="tw-p-0">
            <tab-publish @click:publish="handleMessagePublished" />
          </q-tab-panel>

          <q-tab-panel name="stats" class="tw-flex tw-items-center tw-justify-center">
            <div class="text-h6">Stats In Work</div>
          </q-tab-panel>

          <q-tab-panel name="favorites" class="tw-p-0">
            <tab-favorites />
          </q-tab-panel>

          <q-tab-panel name="chain-actions" class="tw-p-0">
            <tab-chain-actions />
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
            <div class="tw-flex tw-flex-col tw-items-center tw-gap-1 tw-pt-1">
              <q-icon name="fa-solid fa-list-ol" class="tw-mr-2" :size="tabIconSize" />
              <div v-if="showTabsText">Values</div>
              <q-tooltip v-else>Values</q-tooltip>
            </div>
          </q-tab>
          <q-tab name="publish">
            <div class="tw-flex tw-flex-col tw-items-center tw-gap-1 tw-pt-1">
              <q-icon name="fa-solid fa-paper-plane" class="tw-mr-2" :size="tabIconSize" />
              <div v-if="showTabsText">Publish</div>
              <q-tooltip v-else>Publish</q-tooltip>
            </div>
          </q-tab>
          <q-tab name="stats" v-if="false">
            <div class="tw-flex tw-flex-col tw-items-center tw-gap-1 tw-pt-1">
              <q-icon name="fa-solid fa-chart-simple" class="tw-mr-2" :size="tabIconSize" />
              <div v-if="showTabsText">Stats</div>
              <q-tooltip v-else>Stats</q-tooltip>
            </div>
          </q-tab>
          <q-tab name="favorites">
            <div class="tw-flex tw-flex-col tw-items-center tw-gap-1 tw-pt-1">
              <q-icon name="fa-solid fa-star" class="tw-mr-2" :size="tabIconSize" />
              <div v-if="showTabsText">Favorites</div>
              <q-tooltip v-else>Favorites</q-tooltip>
            </div>
          </q-tab>
          <q-tab name="chain-actions">
            <div class="tw-flex tw-flex-col tw-items-center tw-gap-1 tw-pt-1">
              <q-icon name="fa-solid fa-diagram-project" class="tw-mr-2" :size="tabIconSize" />
              <div v-if="showTabsText">Chain Actions</div>
              <q-tooltip v-else>Chain Actions</q-tooltip>
            </div>
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
  @apply tw-absolute tw-h-full tw-w-full tw-transition-transform;
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
