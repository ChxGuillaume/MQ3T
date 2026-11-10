import { compileQuery, type TopicFacts } from '@renderer/assets/js/topic-query'
import { useFavoriteTopicsStore } from '@renderer/store/favorite-topics'
import { createSharedComposable, refDebounced } from '@vueuse/core'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import { useExploreUiStore } from '@renderer/store/explore-ui'
import { useSharedNow } from './useSharedNow'
import { computed, toRaw } from 'vue'

export const useTopicQuery = createSharedComposable(() => {
  const mqttTopicsStore = useMqttTopicsStore()
  const exploreUiStore = useExploreUiStore()

  const search = computed(() => mqttTopicsStore.topicSearch.trim())
  const debouncedSearch = refDebounced(search, 150)

  const typedQuery = computed(() => compileQuery(debouncedSearch.value))

  const query = computed(() => {
    const chipTerms = [
      exploreUiStore.filterChanging ? 'is:changing' : '',
      exploreUiStore.filterRetained ? 'is:retained' : ''
    ].filter(Boolean)

    if (!chipTerms.length) return typedQuery.value

    return compileQuery([debouncedSearch.value, ...chipTerms].join(' '))
  })

  const filterActive = computed(() => !!query.value.topicTest || !!query.value.factsTest)

  return { debouncedSearch, typedQuery, query, filterActive }
})

export const useTopicFilter = (clientKey: () => string) => {
  const favoriteTopicsStore = useFavoriteTopicsStore()
  const mqttTopicsStore = useMqttTopicsStore()
  const { query, filterActive, typedQuery } = useTopicQuery()
  const now = useSharedNow()

  const snapshotFacts = (): TopicFacts => {
    const key = clientKey()
    const lastMessages = toRaw(mqttTopicsStore.topicsLastMessage)[key] ?? {}
    const counts = toRaw(mqttTopicsStore.subTopicsMessagesCount)[key] ?? {}
    let favorites: Set<string> | null = null

    return {
      now: now.value.getTime(),
      lastMessage: (topic) => lastMessages[topic] ?? null,
      messagesCount: (topic) => counts[topic] ?? 0,
      isFavorite: (topic) => {
        favorites ??= new Set(favoriteTopicsStore.getClientFavoriteTopics(key))

        return favorites.has(topic)
      }
    }
  }

  const topicStage = (topics: string[]) => {
    const { topicTest } = query.value

    return topicTest ? topics.filter(topicTest) : topics
  }

  const factsStage = (topics: string[]) => {
    const { factsTest } = query.value

    if (!factsTest) return topics

    const facts = snapshotFacts()

    return topics.filter((topic) => factsTest(topic, facts))
  }

  return { query, typedQuery, filterActive, topicStage, factsStage }
}
