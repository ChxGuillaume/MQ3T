<script setup lang="ts">
import { highlightFilledTopic, validateTopic, wildcardTargets } from '../action-utils'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import { Action } from '../../../../../types/actions'
import { computed, ref } from 'vue'

const props = defineProps<{ action: Action; connectionId: string }>()

const emit = defineEmits<{ close: [topic?: string] }>()

const mqttTopicsStore = useMqttTopicsStore()

const targets = computed(() =>
  wildcardTargets(props.action.topic, mqttTopicsStore.getConnectionTopics(props.connectionId))
)

const topic = ref(targets.value[0] ?? props.action.topic)
const submitted = ref(false)

const error = computed(() =>
  submitted.value ? validateTopic(topic.value, { noWildcard: true }) : undefined
)

const handleSubmit = () => {
  submitted.value = true
  if (validateTopic(topic.value, { noWildcard: true })) return

  emit('close', topic.value)
}
</script>

<template>
  <UModal
    :title="`Add “${action.name}”`"
    description="This action uses a wildcard topic. Pick which topic this step sends to."
    :close="{ onClick: () => emit('close') }"
    :ui="{ content: 'sm:max-w-md', footer: 'justify-end' }"
  >
    <template #body>
      <div class="flex flex-col gap-3">
        <div v-if="targets.length" class="flex flex-col gap-0.5">
          <span class="text-muted pb-1 text-[11px] font-semibold tracking-[0.1em] uppercase">
            Matching topics
          </span>
          <button
            v-for="target in targets"
            :key="target"
            type="button"
            class="flex h-[34px] items-center rounded-md px-2.5 text-left font-mono text-xs"
            :class="target === topic ? 'bg-primary/10' : 'hover:bg-muted'"
            @click="topic = target"
            @dblclick="handleSubmit"
          >
            <template
              v-for="(part, index) in highlightFilledTopic(action.topic, target)"
              :key="index"
            >
              <template v-if="part.separator">/</template>
              <b v-if="part.filled" class="text-primary">{{ part.text }}</b>
              <template v-else>{{ part.text }}</template>
            </template>
          </button>
        </div>
        <UFormField label="Topic" :error="error">
          <UInput
            v-model="topic"
            class="w-full"
            :ui="{ base: 'font-mono' }"
            @keydown.enter.prevent="handleSubmit"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <UButton color="neutral" variant="outline" label="Cancel" @click="emit('close')" />
      <UButton label="Add step" class="font-semibold" @click="handleSubmit" />
    </template>
  </UModal>
</template>
