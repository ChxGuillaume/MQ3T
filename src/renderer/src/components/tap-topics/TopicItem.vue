<script setup lang="ts">
import { MqttTopicStructure, useMqttTopicsStore } from '../../store/mqtt-topics'
import CodeHighlight from '@renderer/components/tap-topics/CodeHighlight.vue'
import { useFavoriteTopicsStore } from '@renderer/store/favorite-topics'
import { exportMessages } from '@renderer/assets/js/export-messages'
import { useActionsCacheStore } from '../../store/actions-cache'
import { useSettingsStore } from '../../store/settings-store'
import TopicCard, { ITopicCard } from './TopicCard.vue'
import TopicItemMenu from './TopicItemMenu.vue'
import { computed, ref, watch } from 'vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()

const favoriteTopicsStore = useFavoriteTopicsStore()
const actionsCacheStore = useActionsCacheStore()
const mqttTopicsStore = useMqttTopicsStore()
const settingsStore = useSettingsStore()

const topicGroupTopicCardRef = ref<ITopicCard | null>(null)
const topicCardRef = ref<ITopicCard | null>(null)

const props = defineProps<{
  clientKey: string
  topicKey: string
  topicStructure: MqttTopicStructure | null
  topicPath: string
  topicIndex: number
}>()

const expandedTopicsSection = computed({
  get: () => mqttTopicsStore.getTopicGroupOpened(props.clientKey, props.topicPath),
  set: (value) => mqttTopicsStore.setTopicGroupOpened(props.clientKey, props.topicPath, value)
})

const hasActions = computed(() => {
  return actionsCacheStore.hasAction(props.clientKey, props.topicPath)
})

const favoritedTopics = computed(() => {
  return favoriteTopicsStore.isFavoriteTopic(props.clientKey, props.topicPath)
})

const emits = defineEmits(['topic:click'])

const handleTopicClick = () => {
  if (settingsStore.smartTopicGroupClose) {
    if (!isLastTopicPart.value) {
      if (isSelectedTopic.value && expandedTopicsSection.value) {
        expandedTopicsSection.value = !expandedTopicsSection.value
      } else if (!expandedTopicsSection.value) {
        expandedTopicsSection.value = !expandedTopicsSection.value
      }
    }
  } else {
    expandedTopicsSection.value = !expandedTopicsSection.value
  }

  emits('topic:click', props.topicPath)
}

const handleCopyTopic = () => {
  navigator.clipboard.writeText(props.topicPath)

  $q.notify({
    message: 'Topic copied to clipboard',
    icon: 'fa-solid fa-clipboard',
    color: 'positive',
    timeout: 1000
  })
}

const handleCopyTopicKey = () => {
  navigator.clipboard.writeText(props.topicKey)

  $q.notify({
    message: 'Topic key copied to clipboard',
    icon: 'fa-solid fa-clipboard',
    color: 'positive',
    timeout: 1000
  })
}

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
  mqttTopicsStore.clearTopicsAndSubTopicsMessages(props.clientKey, props.topicPath)
}

const handleFavorite = () => {
  favoriteTopicsStore.addFavoriteTopic(props.clientKey, props.topicPath)
}

const handleUnfavorite = () => {
  favoriteTopicsStore.removeFavoriteTopic(props.clientKey, props.topicPath)
}

const isLastTopicPart = computed(() => {
  return Object.keys(props.topicStructure || {}).length === 0
})

const isSelectedConnection = computed(() => {
  return mqttTopicsStore.selectedConnection === props.clientKey
})

const isSelectedTopic = computed(() => {
  return isSelectedConnection.value && mqttTopicsStore.selectedTopic === props.topicPath
})

const sortedTopicStructure = computed(() => {
  return Object.entries(props.topicStructure || {}).sort((a, b) => {
    const parsedA = Number(a[0])
    const parsedB = Number(b[0])

    if (isNaN(parsedA) && isNaN(parsedB)) return a[0].localeCompare(b[0])
    else if (isNaN(parsedA)) return 1
    else if (isNaN(parsedB)) return -1
    else return parsedA - parsedB
  })
})

const topicLastMessage = computed(() => {
  return mqttTopicsStore.getTopicLastMessage(props.clientKey, props.topicPath)
})

const subTopicsTopicsCount = computed(() => {
  return mqttTopicsStore.getSubTopicsTopicsCount(props.clientKey, props.topicPath)
})

const subTopicsMessagesCount = computed(() => {
  return mqttTopicsStore.getSubTopicsMessagesCount(props.clientKey, props.topicPath)
})

watch(
  () => topicLastMessage.value,
  () => {
    if (!settingsStore.showActivity) return
    topicCardRef.value?.animate()
    topicGroupTopicCardRef.value?.animate()
  }
)

watch(
  () => subTopicsMessagesCount.value,
  () => {
    if (!settingsStore.showActivity) return
    if (expandedTopicsSection.value) return
    topicGroupTopicCardRef.value?.animate()
  }
)
</script>

<template>
  <div v-if="!isLastTopicPart" :id="`topic-item-${topicPath}`">
    <div class="tw-flex">
      <q-intersection
        :id="`topic-item-${clientKey}:${topicPath}-intersection`"
        class="tw-h-[29px] tw-max-w-full"
      >
        <topic-card
          ref="topicGroupTopicCardRef"
          expandable
          :has-actions="hasActions"
          :favorite="favoritedTopics"
          :active="isSelectedTopic"
          :opened="expandedTopicsSection"
          :style="{ 'margin-left': `${topicIndex * 20}px` }"
          @open:toggle="handleTopicClick"
        >
          <span class="topic-item-key" :class="{ empty: !topicKey }">
            {{ topicKey ? topicKey : '<\empty>' }}
          </span>
          <span
            v-if="!expandedTopicsSection"
            class="tw-ml-1 tw-text-xs"
            v-text="`(${subTopicsTopicsCount} topics ${subTopicsMessagesCount} messages)`"
          />
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
            @copy-topic-key="handleCopyTopicKey"
            @copy-topic="handleCopyTopic"
            @unfavorite="handleUnfavorite"
            @favorite="handleFavorite"
            @erase="handleEraseTopic"
            @export:raw="
              () => exportMessages('raw', mqttTopicsStore.getTopicMessages(clientKey, topicPath))
            "
            @export:json="
              () => exportMessages('json', mqttTopicsStore.getTopicMessages(clientKey, topicPath))
            "
            @export:csv="
              () => exportMessages('csv', mqttTopicsStore.getTopicMessages(clientKey, topicPath))
            "
          />
        </topic-card>
      </q-intersection>
    </div>
    <template v-if="expandedTopicsSection">
      <topic-item
        v-for="[key, value] in sortedTopicStructure"
        :key="key"
        class="tw-mt-1"
        :client-key="clientKey"
        :topic-key="key"
        :topic-path="`${topicPath}/${key}`"
        :topic-index="topicIndex + 1"
        :topic-structure="value"
        @topic:click="$emit('topic:click', $event)"
      />
    </template>
  </div>
  <div v-else class="tw-flex" :id="`topic-item-${topicPath}`">
    <q-intersection
      :id="`topic-item-${clientKey}:${topicPath}-intersection`"
      class="tw-h-[29px] tw-max-w-full"
    >
      <topic-card
        ref="topicCardRef"
        :has-actions="hasActions"
        :favorite="favoritedTopics"
        :active="isSelectedTopic"
        :style="{ 'margin-left': `${topicIndex * 20}px` }"
        @open:toggle="handleTopicClick"
      >
        <span class="topic-item-key" :class="{ empty: !topicKey }">
          {{ topicKey ? topicKey : '<\empty>' }}
        </span>
        <span class="tw-ml-1" v-if="topicLastMessage?.message">=</span>
        <code-highlight
          v-if="topicLastMessage?.message"
          :code="topicLastMessage?.message"
          :language="topicLastMessage.dataType"
        />
        <topic-item-menu
          :has-last-message="!topicLastMessage?.message"
          :favorite="favoritedTopics"
          @copy-last-message="handleCopyLastMessage"
          @copy-topic-key="handleCopyTopicKey"
          @copy-topic="handleCopyTopic"
          @unfavorite="handleUnfavorite"
          @favorite="handleFavorite"
          @erase="handleEraseTopic"
          @export:raw="
            () => exportMessages('raw', mqttTopicsStore.getTopicMessages(clientKey, topicPath))
          "
          @export:json="
            () => exportMessages('json', mqttTopicsStore.getTopicMessages(clientKey, topicPath))
          "
          @export:csv="
            () => exportMessages('csv', mqttTopicsStore.getTopicMessages(clientKey, topicPath))
          "
        />
      </topic-card>
    </q-intersection>
  </div>
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
