<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import type { ContextMenuItem } from '@nuxt/ui'
import ProgressRing from './ProgressRing.vue'

const props = defineProps<{
  id: string
  data: {
    duration?: number
    durationType?: 'ms' | 's'
    isRunning?: boolean
    isFinished?: boolean
    waitStartedAt?: number
    waitEndsAt?: number
  }
  selected?: boolean
}>()

const emit = defineEmits<{ copy: []; remove: [] }>()

const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | undefined

watch(
  () => props.data?.isRunning,
  (isRunning) => {
    clearInterval(timer)
    if (isRunning) timer = setInterval(() => (now.value = Date.now()), 100)
  },
  { immediate: true }
)

onBeforeUnmount(() => clearInterval(timer))

const label = computed(
  () => `Wait ${props.data?.duration || 0} ${props.data?.durationType || 'ms'}`
)

const remaining = computed(() => {
  if (!props.data?.isRunning || !props.data.waitEndsAt) return undefined

  return Math.max(0, props.data.waitEndsAt - now.value)
})

const fraction = computed(() => {
  const { waitStartedAt, waitEndsAt } = props.data ?? {}

  if (!waitStartedAt || !waitEndsAt || remaining.value === undefined) return undefined

  return 1 - remaining.value / Math.max(1, waitEndsAt - waitStartedAt)
})

const remainingLabel = computed(() => {
  if (remaining.value === undefined) return ''

  return remaining.value >= 1000
    ? `${(remaining.value / 1000).toFixed(1)} s left`
    : `${Math.round(remaining.value)} ms left`
})

const menuItems: ContextMenuItem[][] = [
  [{ label: 'Duplicate', icon: 'i-lucide-copy', onSelect: () => emit('copy') }],
  [{ label: 'Delete', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => emit('remove') }]
]
</script>

<template>
  <UContextMenu :items="menuItems">
    <div class="relative">
      <div
        class="flex h-12 min-w-[130px] items-center gap-2 rounded-xl px-3 text-[13px] font-bold whitespace-nowrap"
        :class="
          data?.isRunning || selected
            ? 'bg-primary/10 text-primary ring-primary ring-2 ring-inset'
            : 'border-default bg-default text-muted border border-dashed'
        "
      >
        <ProgressRing v-if="data?.isRunning" :value="fraction" :size="16" class="shrink-0" />
        <UIcon
          v-else-if="data?.isFinished"
          name="i-lucide-check"
          class="text-success size-4 shrink-0"
        />
        <UIcon v-else name="i-lucide-timer" class="size-4 shrink-0" />
        {{ label }}
      </div>
      <div
        v-if="remainingLabel"
        class="text-muted absolute top-full mt-1.5 w-full text-center text-[11px]"
      >
        {{ remainingLabel }}
      </div>
    </div>
  </UContextMenu>

  <Handle type="target" :position="Position.Left" />
  <Handle type="source" :position="Position.Right" />
</template>
