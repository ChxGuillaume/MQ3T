<script setup lang="ts">
import { useRunActionChain } from '@renderer/composables/useRunActionChain'
import { chainSummary, formatChainDuration } from './action-utils'
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

const summary = computed(() => chainSummary(props.chainAction))

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

const stats = computed(() => {
  const { actionCount, waitCount, topicCount, durationMs, hasBranches } = summary.value

  return [
    { icon: 'i-lucide-send', label: plural(actionCount, 'action'), show: true },
    { icon: 'i-lucide-hash', label: plural(topicCount, 'topic'), show: topicCount > 0 },
    { icon: 'i-lucide-hourglass', label: plural(waitCount, 'wait'), show: waitCount > 0 },
    { icon: 'i-lucide-timer', label: `~${formatChainDuration(durationMs)}`, show: durationMs > 0 },
    { icon: 'i-lucide-git-fork', label: 'Parallel', show: hasBranches }
  ].filter((stat) => stat.show)
})

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
        <div class="text-muted flex items-center gap-x-3 overflow-hidden text-xs whitespace-nowrap">
          <span v-if="summary.actionCount === 0">No steps connected yet</span>
          <template v-else>
            <span v-for="stat in stats" :key="stat.icon" class="flex items-center gap-1">
              <UIcon :name="stat.icon" class="size-3.5 shrink-0" />
              {{ stat.label }}
            </span>
          </template>
          <span v-if="summary.unlinkedCount" class="text-warning flex items-center gap-1">
            <UIcon name="i-lucide-unlink" class="size-3.5 shrink-0" />
            {{ summary.unlinkedCount }} unlinked
          </span>
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
