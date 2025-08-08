<script setup lang="ts">
import TopicTreeItem from '@renderer/components/tap-topics/TopicTreeItem.vue'
import TopicLineItem from '@renderer/components/tap-topics/TopicLineItem.vue'
import { useActionsCacheStore } from '@renderer/store/actions-cache'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import { sortTopics } from '@renderer/assets/js/sort-topics'
import { watchDebounced } from '@vueuse/core'
import { computed, ref } from 'vue'
import _ from 'lodash'

const actionsCacheStore = useActionsCacheStore()
const mqttTopicsStore = useMqttTopicsStore()

type Props = {
  clientKey: string
  displayMode: 'line' | 'tree'
}

const props = defineProps<Props>()

const emit = defineEmits<{ 'topic:click': [clientKey: string, event: string] }>()

const debouncedLineTopics = ref<string[]>([])

const getTopicsForLineMode = () => {
  return _([
    ..._.keys(mqttTopicsStore.topicsMessages[props.clientKey] || {}),
    ..._.keys(actionsCacheStore.normalTopics[props.clientKey] || {})
  ])
    .uniq()
    .sort(sortTopics)
    .value()
}

type TreeEntry = [string, any]
const debouncedTreeTopics = ref<TreeEntry[]>([])

const getTopicsForTreeMode = () => {
  return Object.entries(mqttTopicsStore.getFilteredTopicsStructure(props.clientKey)).sort((a, b) =>
    a[0].localeCompare(b[0])
  )
}

debouncedLineTopics.value = getTopicsForLineMode()
debouncedTreeTopics.value = getTopicsForTreeMode()

const sourceTreeTopics = computed(() => {
  return getTopicsForTreeMode()
})

watchDebounced(
  () => {
    return {
      messages: _.keys(mqttTopicsStore.topicsMessages[props.clientKey]) || {},
      normalTopics: _.keys(actionsCacheStore.normalTopics[props.clientKey]) || {}
    }
  },
  () => {
    debouncedLineTopics.value = getTopicsForLineMode()
  },
  { debounce: 100, maxWait: 500, deep: true }
)

watchDebounced(
  sourceTreeTopics,
  (newTopics) => {
    debouncedTreeTopics.value = newTopics
  },
  { debounce: 0, deep: true }
)
</script>

<template>
  <template v-if="displayMode === 'line'">
    <div class="tw-flex tw-flex-col tw-gap-1">
      <topic-line-item
        v-for="topic in debouncedLineTopics"
        :key="topic"
        :topic="topic"
        :client-key="clientKey"
        @topic:click="emit('topic:click', clientKey, $event)"
      />
    </div>
  </template>
  <template v-else>
    <topic-tree-item
      v-for="[pathKey, structure] in debouncedTreeTopics"
      :key="pathKey"
      :client-key="clientKey"
      :topic-key="pathKey"
      :path="pathKey"
      :structure="structure"
      @topic:click="emit('topic:click', clientKey, $event)"
    />
  </template>
</template>

<style scoped lang="less"></style>
