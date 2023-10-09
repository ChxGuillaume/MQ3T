<script setup lang="ts">
import { MqttTopicStructure, useMqttTopicsStore } from '../../store/mqtt-topics'
import { useSettingsStore } from '../../store/settings-store'
import TopicCard, { ITopicCard } from './TopicCard.vue'
import { computed, ref, watch } from 'vue'

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

const expandedTopicsSection = ref(props.topicIndex === 0)

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
  return Object.entries(props.topicStructure || {}).sort((a, b) => a[0].localeCompare(b[0]))
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
  <div v-if="!isLastTopicPart">
    <div class="tw-flex">
      <q-intersection class="tw-h-[29px]">
        <topic-card
          ref="topicGroupTopicCardRef"
          expandable
          :active="isSelectedTopic"
          :opened="expandedTopicsSection"
          :style="{ 'margin-left': `${topicIndex * 20}px` }"
          @open:toggle="handleTopicClick"
        >
          <span class="topic-item-key">{{ topicKey }}</span>
          <span
            v-if="!expandedTopicsSection"
            class="tw-ml-1 tw-text-xs"
            v-text="`(${subTopicsTopicsCount} topics ${subTopicsMessagesCount} messages)`"
          />
          <span
            v-if="topicLastMessage?.message"
            class="tw-ml-1 tw-text-xs"
            v-text="`= ${topicLastMessage?.message}`"
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
  <div v-else class="tw-flex">
    <q-intersection class="tw-h-[29px]">
      <topic-card
        ref="topicCardRef"
        :active="isSelectedTopic"
        :style="{ 'margin-left': `${topicIndex * 20}px` }"
        @open:toggle="handleTopicClick"
      >
        <span class="topic-item-key">{{ topicKey }}</span>
        <span class="tw-ml-1 tw-text-xs" v-text="`= ${topicLastMessage?.message}`" />
      </topic-card>
    </q-intersection>
  </div>
</template>

<style scoped lang="less">
.body--light {
  .topic-item-key {
    @apply tw-text-black;
  }
}

.body--dark {
  .topic-item-key {
    @apply tw-text-white;
  }
}
</style>
