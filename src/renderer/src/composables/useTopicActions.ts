import { useMqttTopicsStore } from '../store/mqtt-topics'
import { useFavoriteTopicsStore } from '../store/favorite-topics'
import { useActionsCacheStore } from '../store/actions-cache'
import { useQuasar } from 'quasar'
import { Ref, computed, isRef } from 'vue'

type MaybeRef<T> = T | Ref<T>

interface UseTopicActionsProps {
  clientKey: MaybeRef<string>
  topic: MaybeRef<string>
}

export function useTopicActions({ clientKey, topic }: UseTopicActionsProps) {
  const $q = useQuasar()
  const favoriteTopicsStore = useFavoriteTopicsStore()
  const actionsCacheStore = useActionsCacheStore()
  const mqttTopicsStore = useMqttTopicsStore()

  // Normalize inputs to computed refs so they stay in sync when changing
  const clientKeyRef = computed(() => (isRef(clientKey) ? clientKey.value : clientKey))
  const topicRef = computed(() => (isRef(topic) ? topic.value : topic))

  const hasActions = computed(() => {
    return actionsCacheStore.hasAction(clientKeyRef.value, topicRef.value)
  })

  const favoritedTopics = computed(() => {
    return favoriteTopicsStore.isFavoriteTopic(clientKeyRef.value, topicRef.value)
  })

  const isSelectedConnection = computed(() => {
    return mqttTopicsStore.selectedConnection === clientKeyRef.value
  })

  const isSelectedTopic = computed(() => {
    return isSelectedConnection.value && mqttTopicsStore.selectedTopic === topicRef.value
  })

  const topicLastMessage = computed(() => {
    return mqttTopicsStore.getTopicLastMessage(clientKeyRef.value, topicRef.value)
  })

  const handleCopyLastMessage = () => {
    if (topicLastMessage.value?.message) {
      navigator.clipboard.writeText(topicLastMessage.value.message)

      $q.notify({
        message: 'Last message copied to clipboard',
        icon: 'fa-solid fa-clipboard',
        color: 'positive',
        timeout: 1000
      })
    }
  }

  const handleEraseTopic = () => {
    mqttTopicsStore.clearTopicsAndSubTopicsMessages(clientKeyRef.value, topicRef.value)
  }

  const handleFavorite = () => {
    favoriteTopicsStore.addFavoriteTopic(clientKeyRef.value, topicRef.value)
  }

  const handleUnfavorite = () => {
    favoriteTopicsStore.removeFavoriteTopic(clientKeyRef.value, topicRef.value)
  }

  const handleCopyTopic = () => {
    navigator.clipboard.writeText(topicRef.value)

    $q.notify({
      message: 'Topic copied to clipboard',
      icon: 'fa-solid fa-clipboard',
      color: 'positive',
      timeout: 1000
    })
  }

  return {
    hasActions,
    favoritedTopics,
    isSelectedConnection,
    isSelectedTopic,
    topicLastMessage,
    handleCopyLastMessage,
    handleEraseTopic,
    handleFavorite,
    handleUnfavorite,
    handleCopyTopic
  }
}
