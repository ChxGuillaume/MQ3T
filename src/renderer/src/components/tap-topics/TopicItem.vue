<script setup lang="ts">
import { MqttTopicStructure, useMqttTopicsStore } from '../../store/mqtt-topics'
import { useSettingsStore } from '../../store/settings-store'
import TopicCard from './TopicCard.vue'
import { computed, ref } from 'vue'

const mqttTopicsStore = useMqttTopicsStore()
const settingsStore = useSettingsStore()

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
</script>

<template>
  <div v-if="!isLastTopicPart" @click="handleTopicClick">
    <div class="tw-flex">
      <q-intersection class="tw-h-[29px]">
        <topic-card
          expandable
          :active="isSelectedTopic"
          :opened="expandedTopicsSection"
          :style="{ 'margin-left': `${topicIndex * 20}px` }"
          @open:toggle="handleTopicClick"
        >
          {{ topicKey }}
          <span v-if="!expandedTopicsSection" class="tw-text-xs topic-item-details">
            ({{ mqttTopicsStore.getSubTopicsTopicsCount(clientKey, topicPath) }} topics
            {{ mqttTopicsStore.getSubTopicsMessagesCount(clientKey, topicPath) }} messages)
          </span>
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
        :active="isSelectedTopic"
        :style="{ 'margin-left': `${topicIndex * 20}px` }"
        @open:toggle="handleTopicClick"
      >
        {{ topicKey }}
        <span class="tw-text-xs topic-item-details">
          = {{ mqttTopicsStore.getTopicLastMessage(props.clientKey, topicPath)?.message }}
        </span>
      </topic-card>
    </q-intersection>
  </div>
</template>

<style scoped lang="less">
.body--light {
  .topic-item-details {
    @apply tw-text-neutral-500;
  }
}

.body--dark {
  .topic-item-details {
    @apply tw-text-neutral-400;
  }
}
</style>
