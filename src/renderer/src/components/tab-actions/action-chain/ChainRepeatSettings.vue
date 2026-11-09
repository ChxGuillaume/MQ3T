<script setup lang="ts">
import SegmentedControl from '@renderer/components/ui/SegmentedControl.vue'
import { ChainRepeat } from '../../../../../types/actions'
import { computed } from 'vue'

type RepeatMode = 'once' | 'times' | 'forever'

const repeat = defineModel<ChainRepeat | undefined>({ required: true })

const DEFAULT_REPEAT: ChainRepeat = { count: 3, interval: 1, intervalUnit: 's' }

const mode = computed<RepeatMode>({
  get: () => {
    if (!repeat.value || repeat.value.count === 1) return 'once'

    return repeat.value.count === 0 ? 'forever' : 'times'
  },
  set: (value) => {
    const current = repeat.value ?? DEFAULT_REPEAT

    if (value === 'once') repeat.value = undefined
    if (value === 'times') {
      repeat.value = { ...current, count: current.count > 1 ? current.count : DEFAULT_REPEAT.count }
    }
    if (value === 'forever') repeat.value = { ...current, count: 0 }
  }
})

const update = (patch: Partial<ChainRepeat>) => {
  repeat.value = { ...(repeat.value ?? DEFAULT_REPEAT), ...patch }
}

const count = computed({
  get: () => repeat.value?.count ?? DEFAULT_REPEAT.count,
  set: (value: number) => update({ count: Math.max(2, Math.floor(value) || 2) })
})

const interval = computed({
  get: () => repeat.value?.interval ?? DEFAULT_REPEAT.interval,
  set: (value: number) => update({ interval: Math.max(0, value || 0) })
})

const intervalUnit = computed<'ms' | 's'>({
  get: () => repeat.value?.intervalUnit ?? DEFAULT_REPEAT.intervalUnit,
  set: (value) => update({ intervalUnit: value })
})
</script>

<template>
  <div class="flex flex-col gap-3">
    <UFormField label="Repeat">
      <SegmentedControl
        v-model="mode"
        :items="[
          { label: 'Once', value: 'once' },
          { label: 'Times', value: 'times' },
          { label: 'Until stopped', value: 'forever' }
        ]"
      />
    </UFormField>

    <UFormField v-if="mode === 'times'" label="Runs">
      <UInput v-model.number="count" type="number" min="2" class="w-full" />
    </UFormField>

    <div v-if="mode !== 'once'" class="flex items-end gap-2">
      <UFormField label="Pause between runs" class="flex-1">
        <UInput v-model.number="interval" type="number" min="0" class="w-full" />
      </UFormField>
      <SegmentedControl
        v-model="intervalUnit"
        :items="[
          { label: 'ms', value: 'ms' },
          { label: 's', value: 's' }
        ]"
      />
    </div>

    <p v-if="mode !== 'once'" class="text-muted text-xs leading-[1.45]">
      Captured values carry over to the next run. Repeating stops when a step fails.
    </p>
  </div>
</template>
