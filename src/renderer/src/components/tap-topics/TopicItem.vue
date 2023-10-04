<script setup lang="ts">
import { useMqttTopicsStore } from '../../store/mqtt-topics'
import { computed, ref } from 'vue'

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

const expandedTopicsSection = ref(props.topicIndex === 0)

const emits = defineEmits(['topic:click'])

const handleTopicClick = () => {
  if (!isLastTopicPart.value) {
    if (isSelectedTopic.value && expandedTopicsSection.value) {
      expandedTopicsSection.value = !expandedTopicsSection.value
    } else if (!expandedTopicsSection.value) {
      expandedTopicsSection.value = !expandedTopicsSection.value
    }
  }

  emits('topic:click', props.topicPath)
}

const isLastTopicPart = computed(() => {
  return Object.keys(props.topicStructure).length === 0
})

const isSelectedTopic = computed(() => {
  const [_, ...topic] = props.topicPath.split('/')

  return mqttTopicsStore.selectedTopic === topic.join('/')
})

const sortedTopicStructure = computed(() => {
  return Object.entries(props.topicStructure).sort((a, b) => a[0].localeCompare(b[0]))
})
</script>

<template>
  <div v-if="!isLastTopicPart" @click="handleTopicClick">
    <div class="tw-flex">
      <q-card
        flat
        class="topic-item-card card-secondary-background tw-pr-3 tw-select-none"
        :class="{ active: isSelectedTopic, opened: expandedTopicsSection }"
        :style="{ 'margin-left': `${topicIndex * 20}px` }"
        @click.stop="handleTopicClick"
      >
        <q-icon name="fa-solid fa-caret-right" size="xs" class="expand-icon" />
        {{ topicKey }}
      </q-card>
    </div>
    <template v-if="expandedTopicsSection">
      <TopicItem
        v-for="[key, value] in sortedTopicStructure"
        :key="key"
        class="tw-mt-1"
        :topic-key="key"
        :topic-path="`${topicPath}/${key}`"
        :topic-index="topicIndex + 1"
        :topic-structure="value"
        @topic:click="$emit('topic:click', $event)"
      />
    </template>
  </div>
  <div v-else class="tw-flex">
    <q-card
      flat
      class="topic-item-card card-secondary-background tw-px-3 tw-select-none"
      :class="{ active: isSelectedTopic }"
      :style="{ 'margin-left': `${topicIndex * 20}px` }"
      @click.stop="handleTopicClick"
    >
      {{ topicKey }}
    </q-card>
  </div>
</template>

<style lang="less">
.opened {
  .expand-icon {
    transform: rotate(90deg);
  }
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
