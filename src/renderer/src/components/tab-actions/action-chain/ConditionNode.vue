<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import type { ContextMenuItem } from '@nuxt/ui'
import { ConditionNodeData } from '../../../../../types/actions'
import { describeCondition } from '../chain-message'
import StepIssueBadge from './StepIssueBadge.vue'
import { computed } from 'vue'

const props = defineProps<{
  id: string
  data: Partial<ConditionNodeData> & {
    isRunning?: boolean
    isFinished?: boolean
    isFailed?: boolean
  }
  selected?: boolean
  issues?: string[]
  dimmed?: boolean
}>()

const emit = defineEmits<{ copy: []; remove: [] }>()

const summary = computed(() => describeCondition(props.data ?? {}))

const sourceLabel = computed(() => (props.data?.source === 'message' ? 'Last message' : 'Variable'))

const menuItems: ContextMenuItem[][] = [
  [{ label: 'Duplicate', icon: 'i-lucide-copy', onSelect: () => emit('copy') }],
  [{ label: 'Delete', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => emit('remove') }]
]
</script>

<template>
  <UContextMenu :items="menuItems">
    <div
      class="bg-default relative flex h-[72px] w-[220px] items-center gap-2.5 rounded-lg border px-3 transition-[opacity,box-shadow]"
      :class="[
        data?.isFailed
          ? 'border-error ring-error ring-1'
          : selected || data?.isRunning
            ? 'border-primary ring-primary ring-1'
            : 'border-default',
        { 'opacity-75': dimmed && !data?.isRunning && !data?.isFinished && !data?.isFailed }
      ]"
    >
      <StepIssueBadge :issues="issues ?? []" />
      <span
        class="border-default text-muted flex size-7 shrink-0 items-center justify-center rounded-sm border"
      >
        <UIcon name="i-lucide-git-branch" class="size-3.5" />
      </span>
      <div class="min-w-0 flex-1 text-left">
        <div class="text-muted text-[11px]">If {{ sourceLabel.toLowerCase() }}</div>
        <div class="truncate font-mono text-[12px] font-bold" :title="summary">{{ summary }}</div>
      </div>
      <div class="text-muted flex flex-col gap-3 text-right text-[10px] font-bold uppercase">
        <span class="text-success">true</span>
        <span class="text-error">false</span>
      </div>
      <UIcon
        v-if="data?.isFailed"
        name="i-lucide-circle-x"
        class="text-error absolute -top-2 -right-2 size-4 rounded-full bg-[var(--ui-bg)]"
        aria-label="Failed"
      />
    </div>
  </UContextMenu>

  <Handle type="target" :position="Position.Left" />
  <Handle id="true" type="source" :position="Position.Right" class="condition-handle-true" />
  <Handle id="false" type="source" :position="Position.Right" class="condition-handle-false" />
</template>

<style>
.chain-canvas .vue-flow__handle.condition-handle-true {
  top: 33%;
}

.chain-canvas .vue-flow__handle.condition-handle-false {
  top: 67%;
}
.chain-canvas .vue-flow__handle.condition-handle-true::before,
.chain-canvas .vue-flow__handle.condition-handle-false::before {
  inset: -6px;
}
</style>
