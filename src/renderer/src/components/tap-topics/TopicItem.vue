<script setup lang="ts">
import { MqttTopicStructure, useMqttTopicsStore } from '../../store/mqtt-topics'
import { useSettingsStore } from '../../store/settings-store'
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
        <q-card
          flat
          class="topic-item-card card-secondary-background tw-pr-3 tw-select-none"
          :class="{ active: isSelectedTopic, opened: expandedTopicsSection }"
          :style="{ 'margin-left': `${topicIndex * 20}px` }"
          @click.stop="handleTopicClick"
        >
          <q-icon name="fa-solid fa-caret-right" size="xs" class="expand-icon" />
          {{ topicKey }}
          <span v-if="!expandedTopicsSection" class="tw-text-xs topic-item-details">
            ({{ mqttTopicsStore.getSubTopicsTopicsCount(clientKey, topicPath) }} topics
            {{ mqttTopicsStore.getSubTopicsMessagesCount(clientKey, topicPath) }} messages)
          </span>
        </q-card>
      </q-intersection>
    </div>
    <template v-if="expandedTopicsSection">
      <TopicItem
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
      <q-card
        flat
        class="topic-item-card card-secondary-background tw-px-3 tw-select-none"
        :class="{ active: isSelectedTopic }"
        :style="{ 'margin-left': `${topicIndex * 20}px` }"
        @click.stop="handleTopicClick"
      >
        {{ topicKey }}
        <span class="tw-text-xs topic-item-details">
          = {{ mqttTopicsStore.getTopicLastMessage(props.clientKey, topicPath)?.message }}
        </span>
      </q-card>
    </q-intersection>
  </div>
</template>

<style scoped lang="less">
.opened {
  .expand-icon {
    transform: rotate(90deg);
  }
}

.topic-item-card {
  @apply tw-py-1 tw-line-clamp-1 tw-cursor-pointer tw-transition-colors;
}

.body--light {
  .topic-item-card:hover {
    background: #65016433 !important;
  }

  .topic-item-card.active {
    background: #65016455 !important;
  }

  .topic-item-details {
    @apply tw-text-neutral-500;
  }
}

.body--dark {
  .topic-item-card:hover {
    background: #65016488 !important;
  }

  .topic-item-card.active {
    background: #650164ee !important;
  }

  .topic-item-details {
    @apply tw-text-neutral-400;
  }
}
</style>
