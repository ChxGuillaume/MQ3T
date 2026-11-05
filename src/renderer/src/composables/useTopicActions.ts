import { useClipboardToast } from '@renderer/composables/useClipboardToast'
import { exportMessages } from '@renderer/assets/js/export-messages'
import { ElectronApi } from '@renderer/assets/js/electron-api'
import { useFavoriteTopicsStore } from '../store/favorite-topics'
import { useActionsCacheStore } from '../store/actions-cache'
import { useExploreUiStore } from '../store/explore-ui'
import { useMqttTopicsStore } from '../store/mqtt-topics'
import type { ContextMenuItem } from '@nuxt/ui'
import { MaybeRefOrGetter, computed, toValue } from 'vue'

interface UseTopicActionsProps {
  clientKey: MaybeRefOrGetter<string>
  topic: MaybeRefOrGetter<string>
}

export function useTopicActions({ clientKey, topic }: UseTopicActionsProps) {
  const favoriteTopicsStore = useFavoriteTopicsStore()
  const actionsCacheStore = useActionsCacheStore()
  const mqttTopicsStore = useMqttTopicsStore()
  const exploreUiStore = useExploreUiStore()
  const { copy } = useClipboardToast()

  const clientKeyRef = computed(() => toValue(clientKey))
  const topicRef = computed(() => toValue(topic))

  const hasActions = computed(() => actionsCacheStore.hasAction(clientKeyRef.value, topicRef.value))

  const favoritedTopics = computed(
    () => !!favoriteTopicsStore.isFavoriteTopic(clientKeyRef.value, topicRef.value)
  )

  const isSelectedConnection = computed(
    () => mqttTopicsStore.selectedConnection === clientKeyRef.value
  )

  const isSelectedTopic = computed(
    () => isSelectedConnection.value && mqttTopicsStore.selectedTopic === topicRef.value
  )

  const topicLastMessage = computed(() =>
    mqttTopicsStore.getTopicLastMessage(clientKeyRef.value, topicRef.value)
  )

  const handleCopyLastMessage = () => {
    if (topicLastMessage.value?.message) {
      copy(topicLastMessage.value.message, 'Last message copied to clipboard')
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

  const toggleFavorite = () => {
    if (favoritedTopics.value) handleUnfavorite()
    else handleFavorite()
  }

  const handleCopyTopic = () => copy(topicRef.value, 'Topic copied to clipboard')

  const handleCopyTopicKey = () => {
    copy(topicRef.value.split('/').pop() ?? '', 'Topic key copied to clipboard')
  }

  const handleClearRetained = () => {
    ElectronApi.sendMqttMessage(clientKeyRef.value, topicRef.value, '', { retain: true, qos: 0 })

    mqttTopicsStore.addPublishMessage(clientKeyRef.value, topicRef.value, '', {
      retained: true,
      qos: 0
    })
  }

  const handleExport = (type: 'raw' | 'json' | 'csv') => {
    exportMessages(type, mqttTopicsStore.getTopicMessages(clientKeyRef.value, topicRef.value))
  }

  const exportItems = (): ContextMenuItem[] => [
    { label: 'RAW', icon: 'i-lucide-file-text', onSelect: () => handleExport('raw') },
    { label: 'JSON', icon: 'i-lucide-file-json', onSelect: () => handleExport('json') },
    { label: 'CSV', icon: 'i-lucide-file-spreadsheet', onSelect: () => handleExport('csv') }
  ]

  const menuItems = computed<ContextMenuItem[][]>(() => {
    const hasMessage = !!topicLastMessage.value?.message

    return [
      [
        {
          label: favoritedTopics.value ? 'Unfavorite' : 'Favorite',
          icon: 'i-lucide-star',
          onSelect: toggleFavorite
        },
        {
          label: 'Publish to this topic',
          icon: 'i-lucide-send',
          onSelect: () => exploreUiStore.openNewMessage(topicRef.value)
        },
        {
          label: 'Export',
          icon: 'i-lucide-file-down',
          disabled: !hasMessage,
          children: exportItems()
        }
      ],
      [
        { label: 'Copy topic', icon: 'i-lucide-copy', onSelect: handleCopyTopic },
        { label: 'Copy topic key', icon: 'i-lucide-copy', onSelect: handleCopyTopicKey },
        {
          label: 'Copy last message',
          icon: 'i-lucide-clipboard',
          disabled: !hasMessage,
          onSelect: handleCopyLastMessage
        }
      ],
      [
        {
          label: 'Erase',
          icon: 'i-lucide-eraser',
          color: 'error',
          onSelect: handleEraseTopic
        }
      ]
    ]
  })

  return {
    hasActions,
    favoritedTopics,
    isSelectedConnection,
    isSelectedTopic,
    topicLastMessage,
    menuItems,
    exportItems,
    handleCopyLastMessage,
    handleEraseTopic,
    handleFavorite,
    handleUnfavorite,
    toggleFavorite,
    handleCopyTopic,
    handleCopyTopicKey,
    handleClearRetained,
    handleExport
  }
}
