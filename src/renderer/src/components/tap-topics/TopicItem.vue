<script setup lang="ts">
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
  }
})

const emits = defineEmits(['topic:click'])

const handleTopicClick = () => {
  emits('topic:click', props.topicPath)
}

// const isLastTopicPart = computed(() => {
//   return Object.keys(props.topicStructure).length === 0
// })
</script>

<template>
  <q-expansion-item
    class=""
    header-class="tw-px-0"
    expand-icon-class="expand-icon-style"
    :content-inset-level="0.3"
    switch-toggle-side
    expand-separator
    :duration="0"
    dense
    expand-icon="fa-solid fa-caret-down"
    :label="topicKey"
    @click="handleTopicClick"
  >
    <template v-slot:header>
      <div class="tw-flex tw-items-center">
        <span class="tw-overflow-ellipsis tw-line-clamp-1">{{ topicKey }}</span>
      </div>
    </template>
    <!--    <div @click="$emit('topic:click', topicKey)">{{ topicKey }} {{ topicStructure }}</div>-->
    <TopicItem
      v-for="[key, value] in Object.entries(topicStructure)"
      :key="key"
      :topic-key="key"
      :topic-path="`${topicPath}/${key}`"
      :topic-structure="value"
      @topic:click="$emit('topic:click', $event)"
    />
  </q-expansion-item>
</template>

<style lang="less">
.expand-icon-style {
  width: 40px;
  min-width: 40px;
}
</style>
