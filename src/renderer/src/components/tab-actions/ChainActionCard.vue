<script setup lang="ts">
import { useRunActionChain } from '@renderer/composables/useRunActionChain'
import { chainStepLabel, chainSteps } from './action-utils'
import type { ContextMenuItem } from '@nuxt/ui'
import { ChainAction } from '../../../../types/actions'
import ProgressRing from './action-chain/ProgressRing.vue'
import { computed } from 'vue'

const props = defineProps<{
  chainAction: ChainAction
  connectionId: string
  noContextMenu?: boolean
  noGrab?: boolean
  disable?: boolean
}>()

const emit = defineEmits(['send', 'edit', 'copy', 'move', 'delete'])

const { running, run } = useRunActionChain()

const steps = computed(() =>
  chainSteps(props.chainAction).map((node) => ({
    id: node.id,
    type: node.type,
    label: chainStepLabel(node)
  }))
)

const handleRun = () => {
  run(props.connectionId, props.chainAction.nodes, props.chainAction.edges)
  emit('send')
}

const menuItems = computed<ContextMenuItem[][]>(() => [
  [{ label: 'Edit', icon: 'i-lucide-pencil', onSelect: () => emit('edit') }],
  [
    { label: 'Copy to…', icon: 'i-lucide-copy', onSelect: () => emit('copy') },
    { label: 'Move to…', icon: 'i-lucide-arrow-right-left', onSelect: () => emit('move') }
  ],
  [{ label: 'Delete', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => emit('delete') }]
])
</script>

<template>
  <UContextMenu :items="menuItems" :disabled="noContextMenu">
    <div class="bg-muted flex min-w-0 items-center gap-3.5 rounded-lg px-4 py-3.5">
      <div class="flex min-w-0 flex-1 flex-col gap-2.5">
        <span
          class="drag-handle truncate font-bold"
          :class="{ 'cursor-grab': !noGrab }"
          :title="chainAction.name"
        >
          {{ chainAction.name }}
        </span>
        <div class="flex items-center gap-1.5 overflow-hidden">
          <template v-for="(step, index) in steps" :key="step.id">
            <span
              class="rounded-full px-2.5 py-1 text-xs whitespace-nowrap"
              :class="{
                'bg-primary text-inverted font-bold': step.type === 'start',
                'border-default text-muted border border-dashed': step.type === 'wait',
                'border-default bg-default border': step.type === 'action'
              }"
            >
              {{ step.label }}
            </span>
            <span v-if="index < steps.length - 1" aria-hidden="true" class="text-muted">→</span>
          </template>
          <span v-if="steps.length <= 1" class="text-muted text-xs">No steps connected yet</span>
        </div>
      </div>
      <UButton
        v-if="!noContextMenu"
        color="neutral"
        variant="ghost"
        icon="i-lucide-pencil"
        aria-label="Edit chain"
        @click="emit('edit')"
      />
      <UDropdownMenu v-if="!noContextMenu" :items="menuItems" :content="{ align: 'end' }">
        <UButton color="neutral" variant="ghost" icon="i-lucide-ellipsis" aria-label="More" />
      </UDropdownMenu>
      <UTooltip :text="disable ? 'Connection is not active' : undefined" :disabled="!disable">
        <UButton
          size="sm"
          label="Run"
          class="font-semibold"
          :icon="running ? undefined : 'i-lucide-play'"
          :disabled="running || disable"
          @click="handleRun"
        >
          <template v-if="running" #leading>
            <ProgressRing :size="14" />
          </template>
        </UButton>
      </UTooltip>
    </div>
  </UContextMenu>
</template>
