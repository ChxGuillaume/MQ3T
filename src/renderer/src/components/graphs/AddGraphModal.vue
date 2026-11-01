<script setup lang="ts">
import { dataPathLabel, findNumericPaths } from '@renderer/assets/js/data-graph'
import { useDataGraphsStore } from '@renderer/store/data-graphs'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  clientKey: string
}>()

const open = defineModel<boolean>('open', { default: false })

const mqttTopicsStore = useMqttTopicsStore()
const dataGraphsStore = useDataGraphsStore()

const topic = ref<string>()
const dataPath = ref<string>()

const lastJsonMessage = (topicName: string) => {
  const message = mqttTopicsStore.topicsLastMessage[props.clientKey]?.[topicName]
  return message?.dataType === 'json' ? message : undefined
}

const topics = computed(() =>
  mqttTopicsStore
    .getConnectionTopics(props.clientKey)
    .filter((name) => lastJsonMessage(name))
    .sort((a, b) => a.localeCompare(b))
)

const paths = computed(() => {
  if (!topic.value) return []

  const message = lastJsonMessage(topic.value)
  if (!message) return []

  try {
    return findNumericPaths(JSON.parse(message.message))
  } catch {
    return []
  }
})

const pathItems = computed(() =>
  paths.value.map((path) => ({
    label: dataPathLabel(path),
    value: path,
    disabled: isGraphed(path)
  }))
)

const isGraphed = (path: string) =>
  dataGraphsStore.dataGraph.some(
    (graph) =>
      graph.clientKey === props.clientKey && graph.topic === topic.value && graph.dataPath === path
  )

const canAdd = computed(
  () => !!topic.value && dataPath.value !== undefined && !isGraphed(dataPath.value)
)

watch(topic, () => {
  dataPath.value = paths.value.find((path) => !isGraphed(path))
})

watch(open, (value) => {
  if (!value) return

  topic.value = mqttTopicsStore.selectedTopic || undefined
  if (topic.value && !topics.value.includes(topic.value)) topic.value = undefined
})

const submit = () => {
  if (!canAdd.value || !topic.value || dataPath.value === undefined) return

  dataGraphsStore.addDataGraph({
    clientKey: props.clientKey,
    topic: topic.value,
    dataPath: dataPath.value
  })

  open.value = false
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Add graph"
    description="Pick a topic, then a numeric field from its latest JSON payload."
  >
    <template #body>
      <form id="add-graph-form" class="flex flex-col gap-4" @submit.prevent="submit">
        <UFormField label="Topic">
          <USelectMenu
            v-model="topic"
            :items="topics"
            placeholder="Select a topic"
            class="w-full"
            :ui="{ base: 'font-mono', item: 'font-mono' }"
          >
            <template #empty>No topic with a JSON payload yet</template>
          </USelectMenu>
        </UFormField>

        <UFormField label="Field" help="Fields already graphed are disabled.">
          <USelectMenu
            v-model="dataPath"
            :items="pathItems"
            value-key="value"
            :disabled="!topic"
            placeholder="Select a field"
            class="w-full"
            :ui="{ base: 'font-mono', item: 'font-mono' }"
          >
            <template #empty>No numeric field in this payload</template>
          </USelectMenu>
        </UFormField>
      </form>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton color="neutral" variant="outline" label="Cancel" @click="open = false" />
        <UButton type="submit" form="add-graph-form" label="Add graph" :disabled="!canAdd" />
      </div>
    </template>
  </UModal>
</template>
