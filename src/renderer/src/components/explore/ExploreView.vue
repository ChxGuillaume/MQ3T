<script setup lang="ts">
import { useFavoriteTopicsStore } from '@renderer/store/favorite-topics'
import { useExploreUiStore } from '@renderer/store/explore-ui'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import HistoryCompareView from './history/HistoryCompareView.vue'
import HistoryFullView from './history/HistoryFullView.vue'
import ExploreFilterBar from './ExploreFilterBar.vue'
import NewMessagePanel from './publish/NewMessagePanel.vue'
import TopicInspector from './inspector/TopicInspector.vue'
import FavoritesGrid from './favorites/FavoritesGrid.vue'
import { computed, nextTick, ref, useTemplateRef } from 'vue'
import TopicTree from './TopicTree.vue'

const favoriteTopicsStore = useFavoriteTopicsStore()
const mqttTopicsStore = useMqttTopicsStore()
const exploreUiStore = useExploreUiStore()

const treeRef = useTemplateRef('treeRef')

const topicsCount = ref(0)

const clientKey = computed(() => mqttTopicsStore.selectedConnection)

const favoritesCount = computed(
  () => favoriteTopicsStore.getClientFavoriteTopics(clientKey.value).length
)

const countLabel = computed(() => {
  if (exploreUiStore.filterFavorites) {
    return `${favoritesCount.value} ${favoritesCount.value === 1 ? 'favorite' : 'favorites'} · drag to reorder`
  }

  return `${topicsCount.value.toLocaleString()} ${topicsCount.value === 1 ? 'topic' : 'topics'}`
})

const splitterItems = [
  { slot: 'tree', defaultSize: 60, minSize: 30 },
  { slot: 'side', defaultSize: 40, minSize: 25 }
]

const revealTopic = (topic: string) => {
  const parts = topic.split('/')

  for (let i = 1; i < parts.length; i++) {
    mqttTopicsStore.setTopicGroupOpened(clientKey.value, parts.slice(0, i).join('/'), true)
  }

  mqttTopicsStore.setSelectedTopic(clientKey.value, topic)

  nextTick(() => requestAnimationFrame(() => treeRef.value?.scrollToTopic(topic)))
}

const openFromFavorites = (topic: string) => {
  exploreUiStore.filterFavorites = false
  revealTopic(topic)
}
</script>

<template>
  <div v-if="clientKey" class="flex h-full min-h-0 flex-col">
    <HistoryFullView
      v-if="exploreUiStore.layout === 'history-full' && mqttTopicsStore.selectedTopic"
      :client-key="clientKey"
      :topic="mqttTopicsStore.selectedTopic"
      @select="revealTopic"
    />
    <HistoryCompareView
      v-else-if="exploreUiStore.layout === 'compare' && mqttTopicsStore.selectedTopic"
      :client-key="clientKey"
      :topic="mqttTopicsStore.selectedTopic"
      @select="revealTopic"
    />
    <div v-else-if="exploreUiStore.filterFavorites" class="flex min-h-0 flex-1">
      <main class="flex min-w-0 flex-1 flex-col">
        <ExploreFilterBar :count-label="countLabel" />
        <FavoritesGrid :client-key="clientKey" @open="openFromFavorites" />
      </main>
      <aside
        v-if="exploreUiStore.newMessageOpened"
        class="border-default w-[420px] shrink-0 border-l"
      >
        <NewMessagePanel :client-key="clientKey" />
      </aside>
    </div>
    <USplitter
      v-else
      :items="splitterItems"
      auto-save-id="mq3t-explore-splitter"
      class="min-h-0 flex-1"
      :ui="{ panel: 'min-w-0 flex-col' }"
    >
      <template #tree>
        <section aria-label="Topic explorer" class="flex h-full min-w-0 flex-1 flex-col">
          <ExploreFilterBar :count-label="countLabel" />
          <TopicTree ref="treeRef" :client-key="clientKey" @count="topicsCount = $event" />
        </section>
      </template>

      <template #side>
        <NewMessagePanel
          v-if="exploreUiStore.newMessageOpened"
          :client-key="clientKey"
          class="border-default h-full border-l"
        />
        <TopicInspector
          v-else
          :client-key="clientKey"
          :topic="mqttTopicsStore.selectedTopic"
          class="border-default h-full border-l"
          @select="revealTopic"
        />
      </template>

      <template #resize-handle>
        <div
          class="group-hover:bg-primary/40 group-data-[resize-handle-state=drag]:bg-primary absolute inset-y-0 left-1/2 w-px -translate-x-1/2 transition-colors"
        />
      </template>
    </USplitter>
  </div>
</template>
