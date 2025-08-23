<script setup lang="ts">
import { MqttTopicStructure, useMqttTopicsStore } from '../../store/mqtt-topics'
import CodeHighlight from '@renderer/components/tap-topics/CodeHighlight.vue'
import { ITopicCard } from '@renderer/components/tap-topics/TopicCard.vue'
import { useTopicActions } from '@renderer/composables/useTopicActions'
import { exportMessages } from '@renderer/assets/js/export-messages'
import { useSettingsStore } from '../../store/settings-store'
import { computed, ref, watch, toRef } from 'vue'
import TopicItemMenu from './TopicItemMenu.vue'
import TopicCard from './TopicCard.vue'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const mqttTopicsStore = useMqttTopicsStore()
const settingsStore = useSettingsStore()

type Props = {
  clientKey: string
  topicKey: string
  structure: MqttTopicStructure | null
  path: string
  index?: number
}

const props = withDefaults(defineProps<Props>(), { index: 0 })

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
  clientKey: toRef(props, 'clientKey'),
  topic: toRef(props, 'path')
})

const topicGroupTopicCardRef = ref<ITopicCard | null>(null)
const topicCardRef = ref<ITopicCard | null>(null)

const itemVisible = ref(false)

const expandedTopicsSection = computed({
  get: () => mqttTopicsStore.getTopicGroupOpened(props.clientKey, props.path),
  set: (value) => mqttTopicsStore.setTopicGroupOpened(props.clientKey, props.path, value)
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

  emits('topic:click', props.path)
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

const isLastTopicPart = computed(() => {
  return Object.keys(props.structure || {}).length === 0
})

const sortedTopicStructure = computed(() => {
  return Object.entries(props.structure || {}).sort((a, b) => {
    const parsedA = Number(a[0])
    const parsedB = Number(b[0])

    if (isNaN(parsedA) && isNaN(parsedB)) return a[0].localeCompare(b[0])
    else if (isNaN(parsedA)) return 1
    else if (isNaN(parsedB)) return -1
    else return parsedA - parsedB
  })
})

const subTopicsTopicsCount = computed(() => {
  return mqttTopicsStore.getSubTopicsTopicsCount(props.clientKey, props.path).toLocaleString()
})

const subTopicsMessagesCount = computed(() => {
  return mqttTopicsStore.getSubTopicsMessagesCount(props.clientKey, props.path).toLocaleString()
})

watch(
  () => topicLastMessage.value,
  () => {
    if (!itemVisible.value) return
    if (!settingsStore.showActivity) return

    topicCardRef.value?.animate()
    topicGroupTopicCardRef.value?.animate()
  }
)

watch(
  () => subTopicsMessagesCount.value,
  () => {
    if (!itemVisible.value) return
    if (!settingsStore.showActivity) return
    if (expandedTopicsSection.value) return

    topicGroupTopicCardRef.value?.animate()
  }
)
</script>

<template>
  <div v-if="!isLastTopicPart" :id="`topic-item-${clientKey}:${path}`">
    <div class="tw-flex">
      <q-intersection
        :id="`topic-item-${clientKey}:${path}-intersection`"
        class="tw-h-[29px] tw-max-w-full"
        @visibility="itemVisible = $event"
      >
        <topic-card
          ref="topicGroupTopicCardRef"
          expandable
          :has-actions="hasActions"
          :favorite="favoritedTopics"
          :active="isSelectedTopic"
          :opened="expandedTopicsSection"
          class="topic-card-indent"
          :style="{ '--indent-level': index }"
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
          <span v-if="topicLastMessage?.message" class="tw-ml-1">=</span>
          <code-highlight
            v-if="topicLastMessage?.message && topicLastMessage.dataType"
            :code="topicLastMessage?.message"
            :language="topicLastMessage.dataType"
          />
          <topic-item-menu
            has-topic-keys
            :has-last-message="!!topicLastMessage?.message"
            :favorite="favoritedTopics"
            @copy-last-message="handleCopyLastMessage"
            @copy-topic-key="handleCopyTopicKey"
            @copy-topic="handleCopyTopic"
            @unfavorite="handleUnfavorite"
            @favorite="handleFavorite"
            @erase="handleEraseTopic"
            @export:raw="
              () => exportMessages('raw', mqttTopicsStore.getTopicMessages(clientKey, path))
            "
            @export:json="
              () => exportMessages('json', mqttTopicsStore.getTopicMessages(clientKey, path))
            "
            @export:csv="
              () => exportMessages('csv', mqttTopicsStore.getTopicMessages(clientKey, path))
            "
          />
        </topic-card>
      </q-intersection>
    </div>
    <template v-if="expandedTopicsSection">
      <topic-tree-item
        v-for="[key, value] in sortedTopicStructure"
        :key="key"
        class="tw-mt-1"
        :client-key="clientKey"
        :topic-key="key"
        :path="`${path}/${key}`"
        :index="index + 1"
        :structure="value"
        @topic:click="$emit('topic:click', $event)"
      />
    </template>
  </div>
  <div v-else :id="`topic-item-${path}`" class="tw-flex">
    <q-intersection
      :id="`topic-item-${clientKey}:${path}-intersection`"
      class="tw-h-[29px] tw-max-w-full"
      @visibility="itemVisible = $event"
    >
      <topic-card
        ref="topicCardRef"
        :has-actions="hasActions"
        :favorite="favoritedTopics"
        :active="isSelectedTopic"
        class="topic-card-indent"
        :style="{ '--indent-level': index }"
        @open:toggle="handleTopicClick"
      >
        <span class="topic-item-key" :class="{ empty: !topicKey }">
          {{ topicKey ? topicKey : '<\empty>' }}
        </span>
        <span v-if="topicLastMessage?.message" class="tw-ml-1">=</span>
        <code-highlight
          v-if="topicLastMessage?.message"
          :code="topicLastMessage?.message"
          :language="topicLastMessage.dataType"
        />
        <topic-item-menu
          has-topic-keys
          :has-last-message="!!topicLastMessage?.message"
          :favorite="favoritedTopics"
          @copy-last-message="handleCopyLastMessage"
          @copy-topic-key="handleCopyTopicKey"
          @copy-topic="handleCopyTopic"
          @unfavorite="handleUnfavorite"
          @favorite="handleFavorite"
          @erase="handleEraseTopic"
          @export:raw="
            () => exportMessages('raw', mqttTopicsStore.getTopicMessages(clientKey, path))
          "
          @export:json="
            () => exportMessages('json', mqttTopicsStore.getTopicMessages(clientKey, path))
          "
          @export:csv="
            () => exportMessages('csv', mqttTopicsStore.getTopicMessages(clientKey, path))
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

.topic-card-indent {
  margin-left: calc(var(--indent-level, 0) * 20px);
}
</style>
