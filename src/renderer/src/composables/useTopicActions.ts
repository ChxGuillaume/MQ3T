import { useMqttTopicsStore } from '../store/mqtt-topics'
import { useFavoriteTopicsStore } from '../store/favorite-topics'
import { useActionsCacheStore } from '../store/actions-cache'
import { useQuasar } from 'quasar'
import { computed } from 'vue'

interface UseTopicActionsProps {
  clientKey: string
  topic: string
}

export function useTopicActions({ clientKey, topic }: UseTopicActionsProps) {
  const $q = useQuasar()
  const favoriteTopicsStore = useFavoriteTopicsStore()
  const actionsCacheStore = useActionsCacheStore()
  const mqttTopicsStore = useMqttTopicsStore()

  const hasActions = computed(() => {
    return actionsCacheStore.hasAction(clientKey, topic)
  })

  const favoritedTopics = computed(() => {
    return favoriteTopicsStore.isFavoriteTopic(clientKey, topic)
  })

  const isSelectedConnection = computed(() => {
    return mqttTopicsStore.selectedConnection === clientKey
  })

  const isSelectedTopic = computed(() => {
    return isSelectedConnection.value && mqttTopicsStore.selectedTopic === topic
  })

  const topicLastMessage = computed(() => {
    return mqttTopicsStore.getTopicLastMessage(clientKey, topic)
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
    mqttTopicsStore.clearTopicsAndSubTopicsMessages(clientKey, topic)
  }

  const handleFavorite = () => {
    favoriteTopicsStore.addFavoriteTopic(clientKey, topic)
  }

  const handleUnfavorite = () => {
    favoriteTopicsStore.removeFavoriteTopic(clientKey, topic)
  }

  const handleCopyTopic = () => {
    navigator.clipboard.writeText(topic)

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
