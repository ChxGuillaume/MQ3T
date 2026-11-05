<script setup lang="ts">
import {
  applyVariables,
  defaultVariableValues,
  validateTopic,
  VariableValue,
  variableFields
} from '../action-utils'
import ActionVariableInputs from '../ActionVariableInputs.vue'
import { useActionsStore } from '@renderer/store/actions'
import { useToast } from '@nuxt/ui/composables'
import PayloadPreview from '../PayloadPreview.vue'
import { Action } from '../../../../../types/actions'
import { computed, ref } from 'vue'

const props = defineProps<{
  action: Action
  connectionId: string
  topics?: string[]
  editableTopic?: boolean
}>()

const emit = defineEmits<{ close: [sent: boolean] }>()

const actionsStore = useActionsStore()
const toast = useToast()

const values = ref<Record<string, VariableValue>>(defaultVariableValues(props.action))
const customTopic = ref(props.topics?.[0] ?? props.action.topic)

const targets = computed(() =>
  props.editableTopic
    ? [customTopic.value]
    : props.topics?.length
      ? props.topics
      : [props.action.topic]
)

const topicError = computed(() => {
  if (!props.editableTopic) return undefined

  return validateTopic(customTopic.value, { noWildcard: true })
})

const preview = computed(() => applyVariables(props.action, values.value, '…generated'))

const hasVariables = computed(() => variableFields(props.action).length > 0)

const summary = computed(() =>
  [`QoS ${props.action.qos}`, props.action.retained ? 'Retain' : ''].filter(Boolean).join(' · ')
)

const handleSend = () => {
  if (topicError.value) return

  for (const topic of targets.value) {
    const payload = applyVariables(props.action, values.value)

    actionsStore.sendAction(props.connectionId, { ...props.action, payload }, topic)
  }

  toast.add({
    title: targets.value.length > 1 ? `Sent to ${targets.value.length} topics` : 'Message sent',
    description: targets.value.length > 1 ? undefined : targets.value[0],
    icon: 'i-lucide-send',
    color: 'success',
    duration: 1500
  })

  emit('close', true)
}
</script>

<template>
  <UModal
    :title="`Send “${action.name || action.topic}”`"
    :close="{ onClick: () => emit('close', false) }"
    :ui="{ content: 'sm:max-w-[560px]', footer: 'justify-end' }"
  >
    <template #description>
      <span v-if="!editableTopic" class="text-primary font-mono text-xs">
        {{ targets.length > 1 ? `${targets.length} topics` : targets[0] }}
      </span>
      <span v-else class="text-muted text-xs">Pick the topic this message is sent to</span>
    </template>

    <template #body>
      <div class="flex flex-col gap-4">
        <UFormField v-if="editableTopic" label="Topic" :error="topicError">
          <UInput
            v-model="customTopic"
            class="w-full font-mono"
            autofocus
            @keydown.enter.prevent="handleSend"
          />
        </UFormField>

        <div v-if="!editableTopic && targets.length > 1" class="flex flex-wrap gap-1.5">
          <span
            v-for="topic in targets"
            :key="topic"
            class="border-default bg-default rounded-full border px-2 py-0.5 font-mono text-xs"
          >
            {{ topic }}
          </span>
        </div>

        <ActionVariableInputs
          v-if="hasVariables"
          v-model="values"
          :action="action"
          @submit="handleSend"
        />

        <div class="flex flex-col gap-1.5">
          <span class="text-muted text-[11px] font-semibold tracking-[0.1em] uppercase">
            Will send
          </span>
          <PayloadPreview :payload="preview" :format="action.payloadFormat" />
        </div>
      </div>
    </template>

    <template #footer>
      <span class="text-muted mr-auto text-xs">{{ summary }}</span>
      <UButton color="neutral" variant="outline" label="Cancel" @click="emit('close', false)" />
      <UButton icon="i-lucide-send" label="Send" class="font-semibold" @click="handleSend" />
    </template>
  </UModal>
</template>
