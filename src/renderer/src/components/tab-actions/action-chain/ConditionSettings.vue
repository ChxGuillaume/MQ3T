<script setup lang="ts">
import SegmentedControl from '@renderer/components/ui/SegmentedControl.vue'
import { ConditionNodeData, ConditionOperator } from '../../../../../types/actions'
import { ConditionPreview, conditionSentence, SampleMessage } from '../chain-step-help'
import { compactValue } from '@renderer/assets/js/payload-insight'
import MessageFieldPicker from './MessageFieldPicker.vue'
import FieldPathInput from './FieldPathInput.vue'
import { CONDITION_OPERATORS } from '../chain-message'
import StepSentence from './StepSentence.vue'
import { computed } from 'vue'

export type ConditionVariableOption = { name: string; description: string }

const props = defineProps<{
  data: Partial<ConditionNodeData>
  variables: ConditionVariableOption[]
  preview: ConditionPreview
  sample?: SampleMessage
  hasMessageStep: boolean
}>()

const emit = defineEmits<{ update: [patch: Partial<ConditionNodeData>] }>()

const source = computed({
  get: () => props.data.source ?? 'variable',
  set: (value: ConditionNodeData['source']) => emit('update', { source: value })
})

const operator = computed({
  get: () => props.data.operator ?? 'equals',
  set: (value: ConditionOperator) => emit('update', { operator: value })
})

const operatorItems = CONDITION_OPERATORS.map(({ label, value }) => ({ label, value }))

const sentence = computed(() => conditionSentence(props.data))

const parsedSample = computed(() => {
  if (!props.sample) return undefined

  try {
    return JSON.parse(props.sample.message) as unknown
  } catch {
    return undefined
  }
})

const sampleIsJson = computed(
  () => parsedSample.value !== null && typeof parsedSample.value === 'object'
)

const handlePickField = (path: string, value: unknown) =>
  emit('update', {
    path,
    value: typeof value === 'string' ? value : JSON.stringify(value)
  })

const MAX_LISTED_VARIABLES = 5

const variableItems = computed(() =>
  props.variables.map((variable) => ({
    label: variable.name,
    value: variable.name,
    description: variable.description
  }))
)

const unknownName = computed(
  () =>
    source.value === 'variable' &&
    !!props.data.name &&
    !props.variables.some((variable) => variable.name === props.data.name)
)
</script>

<template>
  <div class="flex flex-col gap-3.5">
    <StepSentence :parts="sentence" />

    <UFormField label="What should be checked?">
      <SegmentedControl
        v-model="source"
        :items="[
          { label: 'A saved value', value: 'variable' },
          { label: 'The last message', value: 'message' }
        ]"
      />
    </UFormField>

    <template v-if="source === 'variable'">
      <UFormField v-if="variables.length > MAX_LISTED_VARIABLES" label="Saved value">
        <USelect
          :model-value="data.name || undefined"
          :items="variableItems"
          placeholder="Choose a saved value"
          class="w-full"
          @update:model-value="emit('update', { name: String($event) })"
        />
      </UFormField>
      <div v-else-if="variables.length" class="flex flex-col gap-1">
        <span class="text-sm font-medium">Saved values in this chain</span>
        <button
          v-for="variable in variables"
          :key="variable.name"
          type="button"
          class="hover:bg-muted flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-left"
          :class="variable.name === data.name ? 'border-primary bg-primary/5' : 'border-default'"
          @click="emit('update', { name: variable.name })"
        >
          <span class="font-mono text-xs font-bold">{{ variable.name }}</span>
          <span class="text-muted ml-auto truncate text-xs">{{ variable.description }}</span>
        </button>
      </div>
      <p v-else class="text-muted bg-muted rounded-md p-2.5 text-xs leading-[1.45]">
        This chain has no saved values yet. Add a Wait for message step that saves a field, or use a
        variable like <span class="font-mono">$s$status$</span> in an action so it's asked when the
        chain runs.
      </p>
      <UAlert
        v-if="unknownName"
        color="warning"
        variant="soft"
        icon="i-lucide-triangle-alert"
        :title="`No step saves “${data.name}” anymore`"
        description="Pick one of the saved values above."
      />
    </template>

    <template v-else>
      <UAlert
        v-if="!hasMessageStep"
        color="warning"
        variant="soft"
        icon="i-lucide-triangle-alert"
        title="No message to check yet"
        description="Put a Wait for message step before this condition. The condition checks the message it received."
      />
      <UFormField label="Field" help="Leave empty to check the whole payload">
        <FieldPathInput
          :model-value="data.path ?? ''"
          :sample="sample?.message"
          allow-whole
          @update:model-value="emit('update', { path: $event })"
        />
      </UFormField>
      <div v-if="sample && sampleIsJson" class="flex flex-col gap-1.5">
        <span class="text-muted text-xs">
          Pick a field from the last message on
          <span class="font-mono">{{ sample.topic }}</span>
        </span>
        <div class="border-default bg-default max-h-56 overflow-auto rounded-md border p-1">
          <MessageFieldPicker
            :value="parsedSample"
            :actions="['match']"
            match-label="Check this field"
            @match="handlePickField"
          />
        </div>
      </div>
    </template>

    <UFormField label="Condition">
      <USelect v-model="operator" :items="operatorItems" class="w-full" />
    </UFormField>

    <UFormField v-if="operator !== 'exists'" label="Value">
      <UInput
        :model-value="data.value ?? ''"
        class="w-full font-mono"
        @update:model-value="emit('update', { value: String($event) })"
      />
    </UFormField>

    <div class="bg-muted flex flex-col gap-1 rounded-md p-2.5 text-xs leading-[1.45]">
      <span class="font-semibold">Preview</span>
      <template v-if="preview.kind === 'result'">
        <span>
          With the last message received, the value is
          <code class="font-mono">{{
            preview.subject === undefined ? 'missing' : compactValue(preview.subject, 40)
          }}</code
          >, so the chain would take the
          <b :class="preview.result ? 'text-success' : 'text-error'">
            {{ preview.result ? 'true' : 'false' }}
          </b>
          output.
        </span>
      </template>
      <span v-else-if="preview.kind === 'asked'" class="text-muted">
        <span class="font-mono">{{ preview.name }}</span> is asked when the chain runs, so it can't
        be previewed.
      </span>
      <span v-else class="text-muted">
        Nothing to preview yet. Once the topic of an earlier Wait for message step has received a
        message, the expected outcome shows here.
      </span>
    </div>

    <p class="text-muted text-xs leading-[1.45]">
      On the canvas, drag from the <b class="text-success">true</b> and
      <b class="text-error">false</b> handles to the steps that should run for each outcome. An
      output with nothing connected ends that branch.
    </p>
  </div>
</template>
