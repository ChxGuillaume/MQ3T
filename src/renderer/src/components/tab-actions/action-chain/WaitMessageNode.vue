<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import type { ContextMenuItem } from '@nuxt/ui'
import { WaitMessageNodeData } from '../../../../../types/actions'
import ProgressRing from './ProgressRing.vue'
import StepIssueBadge from './StepIssueBadge.vue'

const props = defineProps<{
  id: string
  data: Partial<WaitMessageNodeData> & {
    isRunning?: boolean
    isFinished?: boolean
    isFailed?: boolean
    waitStartedAt?: number
    waitEndsAt?: number
  }
  selected?: boolean
  issues?: string[]
  dimmed?: boolean
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

  return `times out in ${(remaining.value / 1000).toFixed(1)} s`
})

const captureCount = computed(() => props.data?.captures?.filter((c) => c.name).length ?? 0)

const menuItems: ContextMenuItem[][] = [
  [{ label: 'Duplicate', icon: 'i-lucide-copy', onSelect: () => emit('copy') }],
  [{ label: 'Delete', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => emit('remove') }]
]
</script>

<template>
  <UContextMenu :items="menuItems">
    <div class="relative">
      <div
        class="bg-default relative flex h-[60px] w-[220px] items-center gap-2.5 rounded-lg border border-dashed px-3 transition-[opacity,box-shadow]"
        :class="[
          data?.isFailed
            ? 'border-error ring-error ring-1'
            : selected || data?.isRunning
              ? 'border-primary ring-primary ring-1'
              : 'border-accented',
          { 'opacity-75': dimmed && !data?.isRunning && !data?.isFinished && !data?.isFailed }
        ]"
      >
        <StepIssueBadge :issues="issues ?? []" />
        <span
          class="border-default text-muted flex size-7 shrink-0 items-center justify-center rounded-sm border"
        >
          <UIcon name="i-lucide-radio" class="size-3.5" />
        </span>
        <div class="min-w-0 flex-1 text-left">
          <div class="truncate text-[13px] font-bold">Wait for message</div>
          <div class="text-muted truncate font-mono text-[11px]" :title="data?.topic">
            {{ data?.topic || 'No topic yet' }}
          </div>
        </div>
        <span
          v-if="captureCount"
          class="bg-muted text-muted rounded-full px-1.5 text-[11px] font-bold"
          :title="`Captures ${captureCount} value${captureCount === 1 ? '' : 's'}`"
        >
          {{ captureCount }}
        </span>
        <ProgressRing v-if="data?.isRunning" :value="fraction" class="text-primary shrink-0" />
        <UIcon
          v-else-if="data?.isFinished"
          name="i-lucide-check"
          class="text-success size-[18px] shrink-0"
          aria-label="Received"
        />
        <UIcon
          v-else-if="data?.isFailed"
          name="i-lucide-circle-x"
          class="text-error size-[18px] shrink-0"
          aria-label="Timed out"
        />
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
