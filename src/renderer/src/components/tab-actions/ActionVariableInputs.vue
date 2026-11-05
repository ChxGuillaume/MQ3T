<script setup lang="ts">
import SegmentedControl from '@renderer/components/ui/SegmentedControl.vue'
import { hasGeneratedUuid, VariableValue, variableFields } from './action-utils'
import { Action } from '../../../../types/actions'
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    action: Pick<Action, 'payload' | 'payloadFormat' | 'enumOptions'>
    size?: 'sm' | 'md'
  }>(),
  { size: 'md' }
)

const emit = defineEmits<{ submit: [] }>()

const values = defineModel<Record<string, VariableValue>>({ required: true })

const fields = computed(() => variableFields(props.action))

const hasUuid = computed(() => hasGeneratedUuid(props.action.payload))

const labelClass = computed(() =>
  props.size === 'sm' ? 'w-[70px] text-[13px]' : 'w-[110px] text-sm font-semibold'
)

const setValue = (key: string, value: VariableValue) => {
  values.value = { ...values.value, [key]: value }
}

const toggleNull = (key: string, isNull: boolean, fallback: VariableValue) => {
  setValue(key, isNull ? null : fallback)
}

const enumValue = (key: string) => values.value[key] as string | number

const segmentedLabelBudget = computed(() => (props.size === 'sm' ? 18 : 32))

const fitsSegmented = (options: (string | number)[]) =>
  options.length <= 4 &&
  options.reduce<number>((total, option) => total + String(option).length, 0) <=
    segmentedLabelBudget.value

const enumItems = (options: (string | number)[]) =>
  options.map((option) => ({ label: String(option), value: option }))
</script>

<template>
  <div class="flex flex-col" :class="size === 'sm' ? 'gap-2' : 'gap-4'">
    <div v-for="field in fields" :key="field.key" class="flex items-center gap-3">
      <span class="shrink-0 truncate font-mono" :class="labelClass" :title="field.name">
        {{ field.name }}
      </span>

      <template v-if="field.type === 'string'">
        <UInput
          :model-value="(values[field.key] as string) ?? ''"
          :disabled="values[field.key] === null"
          :size="size === 'sm' ? 'sm' : 'md'"
          class="min-w-0 flex-1"
          @update:model-value="setValue(field.key, $event)"
          @keydown.enter.prevent="emit('submit')"
        />
        <UCheckbox
          label="null"
          :model-value="values[field.key] === null"
          :ui="{ root: 'items-center', label: 'text-xs text-muted font-normal' }"
          @update:model-value="toggleNull(field.key, !!$event, '')"
        />
      </template>

      <template v-else-if="field.type === 'number'">
        <UInput
          type="number"
          :model-value="values[field.key] === null ? '' : String(values[field.key] ?? 0)"
          :disabled="values[field.key] === null"
          :size="size === 'sm' ? 'sm' : 'md'"
          class="min-w-0 flex-1"
          @update:model-value="setValue(field.key, Number($event) || 0)"
          @keydown.enter.prevent="emit('submit')"
        />
        <UCheckbox
          label="null"
          :model-value="values[field.key] === null"
          :ui="{ root: 'items-center', label: 'text-xs text-muted font-normal' }"
          @update:model-value="toggleNull(field.key, !!$event, 0)"
        />
      </template>

      <template v-else-if="field.type === 'boolean'">
        <SegmentedControl
          :model-value="values[field.key] === true ? 'true' : 'false'"
          :items="[
            { label: 'false', value: 'false' },
            { label: 'true', value: 'true' }
          ]"
          :size="size"
          :class="{ 'pointer-events-none opacity-50': values[field.key] === null }"
          @update:model-value="setValue(field.key, $event === 'true')"
        />
        <UCheckbox
          label="null"
          class="ml-auto"
          :model-value="values[field.key] === null"
          :ui="{ root: 'items-center', label: 'text-xs text-muted font-normal' }"
          @update:model-value="toggleNull(field.key, !!$event, false)"
        />
      </template>

      <template v-else-if="field.type === 'enum'">
        <span v-if="!field.options.length" class="text-warning text-xs">
          No options defined for this list
        </span>
        <SegmentedControl
          v-else-if="fitsSegmented(field.options)"
          :model-value="enumValue(field.key)"
          :items="enumItems(field.options)"
          :size="size"
          @update:model-value="setValue(field.key, $event)"
        />
        <USelect
          v-else
          :model-value="enumValue(field.key)"
          :items="enumItems(field.options)"
          :size="size === 'sm' ? 'sm' : 'md'"
          class="min-w-40 flex-1"
          @update:model-value="setValue(field.key, $event)"
        />
      </template>
    </div>

    <div v-if="hasUuid" class="flex items-center gap-3">
      <span class="shrink-0 font-mono" :class="labelClass">uuid</span>
      <span class="text-muted text-xs">A new UUID is made on send</span>
    </div>
  </div>
</template>
