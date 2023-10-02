<script setup lang="ts">
import { useMqttTopicsStore } from '../../store/mqtt-topics'
import { computed } from 'vue'

const mqttTopicsStore = useMqttTopicsStore()

const props = defineProps({
  topicKey: {
    type: String,
    required: true
  },
  topicStructure: {
    type: Object,
    required: true
  },
  topicPath: {
    type: String,
    required: true
  },
  topicIndex: {
    type: Number,
    required: true
  }
})

const emits = defineEmits(['topic:click'])

const handleTopicClick = () => {
  emits('topic:click', props.topicPath)
}

const isLastTopicPart = computed(() => {
  return Object.keys(props.topicStructure).length === 0
})

const isSelectedTopic = computed(() => {
  const [_, ...topic] = props.topicPath.split('/')

  return mqttTopicsStore.selectedTopic === topic.join('/')
})
</script>

<template>
  <div v-if="!isLastTopicPart" @click="handleTopicClick">
    <div class="tw-flex">
      <q-card
        @click.stop="handleTopicClick"
        flat
        class="topic-item-card card-secondary-background tw-pr-3"
        :class="{ active: isSelectedTopic }"
        :style="{ 'margin-left': `${topicIndex * 20}px` }"
      >
        <q-icon name="fa-solid fa-caret-right" size="xs" class="tw-mr-1" />
        {{ topicKey }}
      </q-card>
    </div>
    <TopicItem
      v-for="[key, value] in Object.entries(topicStructure)"
      class="tw-mt-1"
      :key="key"
      :topic-key="key"
      :topic-path="`${topicPath}/${key}`"
      :topic-index="topicIndex + 1"
      :topic-structure="value"
      @topic:click="$emit('topic:click', $event)"
    />
  </div>
  <div v-else class="tw-flex">
    <q-card
      @click.stop="handleTopicClick"
      flat
      class="topic-item-card card-secondary-background tw-px-3"
      :class="{ active: isSelectedTopic }"
      :style="{ 'margin-left': `${topicIndex * 20}px` }"
    >
      {{ topicKey }}
    </q-card>
  </div>
</template>

<style lang="less">
.expand-icon-style {
  width: 40px;
  min-width: 40px;
}

.topic-item-card {
  @apply tw-py-1 tw-line-clamp-1 tw-cursor-pointer tw-rounded-xl tw-transition-colors;
}

.body--light {
  .topic-item-card:hover {
    background: #65016433 !important;
  }

  .topic-item-card.active {
    background: #65016455 !important;
  }
}

.body--dark {
  .topic-item-card:hover {
    background: #65016488 !important;
  }

  .topic-item-card.active {
    background: #650164ee !important;
  }
}
</style>
