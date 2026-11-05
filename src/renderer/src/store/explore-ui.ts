import { defineStore } from 'pinia'

export type InspectorTab = 'value' | 'history' | 'graph' | 'publish'
export type ExploreLayout = 'split' | 'history-full' | 'compare'
export type HistoryMode = 'list' | 'changes'
export type TopicDisplayMode = 'tree' | 'line'
export type TopicListSortKey = 'topic' | 'msgs' | 'updated'
export type PublishFormat = 'raw' | 'json' | 'xml' | 'yaml'

export const useExploreUiStore = defineStore('explore-ui', {
  state: () => ({
    newMessageOpened: false,
    newMessageTopic: '',
    layout: 'split' as ExploreLayout,
    displayMode: 'tree' as TopicDisplayMode,
    listSort: { key: 'updated' as TopicListSortKey, descending: true },
    filterChanging: false,
    filterFavorites: false,
    filterRetained: false,
    historyMode: null as HistoryMode | null,
    hideNoChange: false,
    keyFiltersByTopic: {} as Record<string, string[]>,
    tabByTopic: {} as Record<string, InspectorTab>,
    publishDrafts: {} as Record<string, string>,
    publishFormat: localStorage.getItem('publishFormat') as PublishFormat | null
  }),
  getters: {
    getTopicTab: (state) => (clientKey: string, topic: string) =>
      state.tabByTopic[`${clientKey}:${topic}`],
    getKeyFilters: (state) => (clientKey: string, topic: string) =>
      state.keyFiltersByTopic[`${clientKey}:${topic}`] ?? []
  },
  actions: {
    openNewMessage(topic = '') {
      this.newMessageTopic = topic
      this.newMessageOpened = true
      this.layout = 'split'
    },
    closeNewMessage() {
      this.newMessageOpened = false
    },
    setTopicTab(clientKey: string, topic: string, tab: InspectorTab) {
      this.tabByTopic[`${clientKey}:${topic}`] = tab
    },
    setKeyFilters(clientKey: string, topic: string, filters: string[]) {
      this.keyFiltersByTopic[`${clientKey}:${topic}`] = filters
    },
    setPublishFormat(format: PublishFormat) {
      this.publishFormat = format
      localStorage.setItem('publishFormat', format)
    }
  }
})
