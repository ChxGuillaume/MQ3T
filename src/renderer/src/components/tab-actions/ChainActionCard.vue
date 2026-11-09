<script setup lang="ts">
import { useRunActionChain } from '@renderer/composables/useRunActionChain'
import { useChainVariablesPrompt } from '@renderer/composables/useChainVariablesPrompt'
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
const { promptVariables } = useChainVariablesPrompt()

const summary = computed(() => chainSummary(props.chainAction))

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

const stats = computed(() => {
  const { actionCount, waitCount, topicCount, durationMs, hasBranches, unlinkedCount } =
    summary.value
  const duration = `~${formatChainDuration(durationMs)}`
  const repeatCount = props.chainAction.repeat?.count ?? 1

  return [
    {
      icon: 'i-lucide-send',
      short: String(actionCount),
      label: plural(actionCount, 'action'),
      show: true
    },
    {
      icon: 'i-lucide-hash',
      short: String(topicCount),
      label: plural(topicCount, 'topic'),
      show: topicCount > 0
    },
    {
      icon: 'i-lucide-hourglass',
      short: String(waitCount),
      label: plural(waitCount, 'wait'),
      show: waitCount > 0
    },
    {
      icon: 'i-lucide-timer',
      short: duration,
      label: duration,
      tooltip: 'Estimated duration',
      show: durationMs > 0
    },
    {
      icon: 'i-lucide-repeat',
      short: repeatCount === 0 ? '∞' : `×${repeatCount}`,
      label: repeatCount === 0 ? 'Until stopped' : `${repeatCount} runs`,
      tooltip: repeatCount === 0 ? 'Repeats until stopped' : `Repeats ${repeatCount} times`,
      show: repeatCount !== 1
    },
    {
      icon: 'i-lucide-git-fork',
      short: '',
      label: 'Parallel',
      tooltip: 'Runs branches in parallel',
      show: hasBranches
    },
    {
      icon: 'i-lucide-unlink',
      short: String(unlinkedCount),
      label: `${unlinkedCount} unlinked`,
      tooltip: plural(unlinkedCount, 'step') + ' not connected to start',
      warning: true,
      show: unlinkedCount > 0
    }
  ].filter((stat) => stat.show)
})

const handleRun = async () => {
  const variables = await promptVariables(
    props.chainAction.name,
    props.chainAction,
    props.connectionId
  )

  if (!variables) return

  run(props.connectionId, props.chainAction, { variables, chainId: props.chainAction.id })
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
        <div class="@container min-w-0">
          <div class="text-muted flex items-center gap-x-2.5 text-xs whitespace-nowrap @sm:gap-x-3">
            <span v-if="summary.actionCount === 0 && !summary.unlinkedCount">
              No steps connected yet
            </span>
            <template v-else>
              <UTooltip v-for="stat in stats" :key="stat.icon" :text="stat.tooltip ?? stat.label">
                <span class="flex items-center gap-1" :class="{ 'text-warning': stat.warning }">
                  <UIcon :name="stat.icon" class="size-3.5 shrink-0" />
                  <span v-if="stat.short" class="@sm:hidden">{{ stat.short }}</span>
                  <span class="hidden @sm:inline">{{ stat.label }}</span>
                </span>
              </UTooltip>
            </template>
          </div>
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
