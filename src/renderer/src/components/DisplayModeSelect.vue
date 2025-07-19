<script setup lang="ts">
import { computed } from 'vue'

interface SelectOption {
  label: string
  value: string | number
  icon: string
  [key: string]: any
}

interface Props {
  dense?: boolean
  square?: boolean
  filled?: boolean
  optionLabel?: string
  optionValue?: string
  emitValue?: boolean
}

const model = defineModel<string | number>()

withDefaults(defineProps<Props>(), {
  dense: true,
  square: true,
  filled: true,
  optionLabel: 'label',
  optionValue: 'value',
  emitValue: true
})

const options: SelectOption[] = [
  { label: 'Tree', value: 'tree', icon: 'fa-solid fa-bars-staggered' },
  { label: 'Line', value: 'line', icon: 'fa-solid fa-bars' }
]

const selectedOption = computed(() => {
  return options.find((opt) => opt.value === model.value)
})
</script>

<template>
  <q-select
    v-model="model"
    hide-dropdown-icon
    :options="options"
    :dense="dense"
    :square="square"
    :filled="filled"
    :option-label="optionLabel"
    :option-value="optionValue"
    :emit-value="emitValue"
  >
    <template #selected>
      <div class="tw-flex tw-items-center" v-if="selectedOption">
        <q-icon :name="selectedOption.icon" size="xs" />
      </div>
    </template>
    <template #option="{ itemProps, opt }">
      <q-item v-bind="itemProps" dense>
        <q-item-section>
          <q-icon :name="opt.icon" size="xs" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ opt.label }}</q-item-label>
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>
