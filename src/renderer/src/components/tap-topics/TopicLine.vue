<script setup lang="ts">
import { exportMessages } from '@renderer/assets/js/export-messages'
import TopicCard, { ITopicCard } from '@renderer/components/tap-topics/TopicCard.vue'
import TopicItemMenu from '@renderer/components/tap-topics/TopicItemMenu.vue'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import { computed, ref, watch } from 'vue'
import { useFavoriteTopicsStore } from '@renderer/store/favorite-topics'
import { useActionsCacheStore } from '@renderer/store/actions-cache'
import { useSettingsStore } from '@renderer/store/settings-store'
import { useQuasar } from 'quasar'

const $q = useQuasar()

type Props = {
  clientKey: string
  topic: string
}

const props = defineProps<Props>()
const emits = defineEmits(['topic:click'])

const favoriteTopicsStore = useFavoriteTopicsStore()
const actionsCacheStore = useActionsCacheStore()
const mqttTopicsStore = useMqttTopicsStore()
const settingsStore = useSettingsStore()

const topicCardRef = ref<ITopicCard | null>(null)

const hasActions = computed(() => {
  return actionsCacheStore.hasAction(props.clientKey, props.topic)
})

const favoritedTopics = computed(() => {
  return favoriteTopicsStore.isFavoriteTopic(props.clientKey, props.topic)
})

const isSelectedConnection = computed(() => {
  return mqttTopicsStore.selectedConnection === props.clientKey
})

const isSelectedTopic = computed(() => {
  return isSelectedConnection.value && mqttTopicsStore.selectedTopic === props.topic
})

const handleTopicClick = () => {
  emits('topic:click', props.topic)
}

const clientKey = 'test'

const topicLastMessage = computed(() => {
  return mqttTopicsStore.getTopicLastMessage(props.clientKey, props.topic)
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
  mqttTopicsStore.clearTopicsAndSubTopicsMessages(props.clientKey, props.topic)
}

const handleFavorite = () => {
  favoriteTopicsStore.addFavoriteTopic(props.clientKey, props.topic)
}

const handleUnfavorite = () => {
  favoriteTopicsStore.removeFavoriteTopic(props.clientKey, props.topic)
}

const handleCopyTopic = () => {
  navigator.clipboard.writeText(props.topic)

  $q.notify({
    message: 'Topic copied to clipboard',
    icon: 'fa-solid fa-clipboard',
    color: 'positive',
    timeout: 1000
  })
}

watch(
  () => topicLastMessage.value,
  () => {
    if (!settingsStore.showActivity) return
    topicCardRef.value?.animate()
  }
)
</script>

<template>
  <q-intersection
    :id="`topic-item-${clientKey}:${topic}-intersection`"
    class="tw-h-[29px] tw-w-auto tw-self-start"
  >
    <topic-card
      ref="topicCardRef"
      :has-actions="hasActions"
      :favorite="favoritedTopics"
      :active="isSelectedTopic"
      class="tw-ml-4"
      @open:toggle="handleTopicClick"
    >
      <span class="topic-item-key" :class="{ empty: !topic }">
        {{ topic ? topic : '<\empty>' }}
      </span>
      <span
        v-if="topicLastMessage?.message"
        class="tw-ml-1 tw-text-xs"
        v-text="`= ${topicLastMessage?.message}`"
      />
      <topic-item-menu
        :has-last-message="!topicLastMessage?.message"
        :favorite="favoritedTopics"
        @copy-last-message="handleCopyLastMessage"
        @copy-topic="handleCopyTopic"
        @unfavorite="handleUnfavorite"
        @favorite="handleFavorite"
        @erase="handleEraseTopic"
        @export:raw="
          () => exportMessages('raw', mqttTopicsStore.getTopicMessages(clientKey, topic))
        "
        @export:json="
          () => exportMessages('json', mqttTopicsStore.getTopicMessages(clientKey, topic))
        "
        @export:csv="
          () => exportMessages('csv', mqttTopicsStore.getTopicMessages(clientKey, topic))
        "
      />
    </topic-card>
  </q-intersection>
</template>

<style scoped lang="less">
.body--light {
  .topic-item-key {
    @apply tw-text-black;
  }

  .topic-item-key.empty {
    @apply tw-text-neutral-300;
  }
}

.body--dark {
  .topic-item-key {
    @apply tw-text-white;
  }

  .topic-item-key.empty {
    @apply tw-text-neutral-500;
  }
}
</style>
