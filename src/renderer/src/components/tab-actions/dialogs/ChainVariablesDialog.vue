<script setup lang="ts">
import {
  defaultVariableValues,
  NamedVariableValues,
  namedVariableValues,
  VariableValue
} from '../action-utils'
import ActionVariableInputs from '../ActionVariableInputs.vue'
import { Action } from '../../../../../types/actions'
import { ref } from 'vue'

const props = defineProps<{
  chainName: string
  source: Pick<Action, 'payload' | 'payloadFormat' | 'enumOptions'>
  hasUuid?: boolean
}>()

const emit = defineEmits<{ close: [values: NamedVariableValues | null] }>()

const values = ref<Record<string, VariableValue>>(defaultVariableValues(props.source))

const handleRun = () => emit('close', namedVariableValues(props.source, values.value))
</script>

<template>
  <UModal
    :title="`Run “${chainName}”`"
    description="These values are used by every step that references them"
    :close="{ onClick: () => emit('close', null) }"
    :ui="{ content: 'sm:max-w-[560px]', footer: 'justify-end' }"
  >
    <template #body>
      <div class="flex flex-col gap-4">
        <ActionVariableInputs v-model="values" :action="source" @submit="handleRun" />
        <p v-if="hasUuid" class="text-muted text-xs">
          Steps using <span class="font-mono">uuid</span> get a new UUID each time they send.
        </p>
      </div>
    </template>

    <template #footer>
      <UButton color="neutral" variant="outline" label="Cancel" @click="emit('close', null)" />
      <UButton icon="i-lucide-play" label="Run" class="font-semibold" @click="handleRun" />
    </template>
  </UModal>
</template>
