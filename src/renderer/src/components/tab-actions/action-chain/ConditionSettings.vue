<script setup lang="ts">
import SegmentedControl from '@renderer/components/ui/SegmentedControl.vue'
import { ConditionNodeData, ConditionOperator } from '../../../../../types/actions'
import { CONDITION_OPERATORS } from '../chain-message'
import { computed } from 'vue'

const props = defineProps<{ data: Partial<ConditionNodeData>; variableNames: string[] }>()

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
</script>

<template>
  <div class="flex flex-col gap-3.5">
    <SegmentedControl
      v-model="source"
      :items="[
        { label: 'Variable', value: 'variable' },
        { label: 'Last message', value: 'message' }
      ]"
    />

    <UFormField
      v-if="source === 'variable'"
      label="Variable name"
      help="A run value or a value captured by an earlier step"
    >
      <UInput
        :model-value="data.name ?? ''"
        placeholder="status"
        class="w-full font-mono"
        @update:model-value="emit('update', { name: String($event).trim() })"
      />
      <div v-if="variableNames.length" class="mt-1.5 flex flex-wrap gap-1">
        <button
          v-for="variableName in variableNames"
          :key="variableName"
          type="button"
          class="border-default hover:bg-muted rounded-full border px-2 py-0.5 font-mono text-xs"
          :class="{ 'border-primary text-primary': variableName === data.name }"
          @click="emit('update', { name: variableName })"
        >
          {{ variableName }}
        </button>
      </div>
    </UFormField>

    <UFormField
      v-else
      label="Path"
      help="Read from the message received by the latest wait-for-message step"
    >
      <UInput
        :model-value="data.path ?? ''"
        placeholder="$.status"
        class="w-full font-mono"
        @update:model-value="emit('update', { path: String($event) })"
      />
    </UFormField>

    <UFormField label="Operator">
      <USelect v-model="operator" :items="operatorItems" class="w-full" />
    </UFormField>

    <UFormField v-if="operator !== 'exists'" label="Value">
      <UInput
        :model-value="data.value ?? ''"
        class="w-full font-mono"
        @update:model-value="emit('update', { value: String($event) })"
      />
    </UFormField>

    <p class="text-muted text-xs leading-[1.45]">
      Connect the <b class="text-success">true</b> and <b class="text-error">false</b> handles to
      the steps that should run for each outcome.
    </p>
  </div>
</template>
