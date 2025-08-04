<script setup lang="ts">
import { exportMessages } from '@renderer/assets/js/export-messages'
import TopicCard, { ITopicCard } from '@renderer/components/tap-topics/TopicCard.vue'
import TopicItemMenu from '@renderer/components/tap-topics/TopicItemMenu.vue'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import { ref, watch } from 'vue'
import { useSettingsStore } from '@renderer/store/settings-store'
import { useTopicActions } from '@renderer/composables/useTopicActions'
import CodeHighlight from '@renderer/components/tap-topics/CodeHighlight.vue'

type Props = {
  clientKey: string
  topic: string
}

const props = defineProps<Props>()
const emits = defineEmits(['topic:click'])

const mqttTopicsStore = useMqttTopicsStore()
const settingsStore = useSettingsStore()

const topicCardRef = ref<ITopicCard | null>(null)

const {
  hasActions,
  favoritedTopics,
  isSelectedTopic,
  topicLastMessage,
  handleCopyLastMessage,
  handleEraseTopic,
  handleFavorite,
  handleUnfavorite,
  handleCopyTopic
} = useTopicActions({
  clientKey: props.clientKey,
  topic: props.topic
})

const handleTopicClick = () => {
  emits('topic:click', props.topic)
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
      <span class="tw-ml-1" v-if="topicLastMessage?.message">=</span>
      <code-highlight
        v-if="topicLastMessage?.message && topicLastMessage.dataType"
        :code="topicLastMessage?.message"
        :language="topicLastMessage.dataType"
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
