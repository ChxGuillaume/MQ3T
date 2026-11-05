<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import type { ContextMenuItem } from '@nuxt/ui'
import { formatTile } from '../action-utils'
import { Action } from '../../../../../types/actions'
import ProgressRing from './ProgressRing.vue'
import { computed } from 'vue'

const props = defineProps<{
  id: string
  data: { action?: Action; isRunning?: boolean; isFinished?: boolean }
  selected?: boolean
  dimmed?: boolean
}>()

const emit = defineEmits<{ edit: []; copy: []; remove: [] }>()

const action = computed(() => props.data?.action)

const tile = computed(() => formatTile(action.value?.payloadFormat))

const menuItems = computed<ContextMenuItem[][]>(() => [
  [
    {
      label: action.value ? 'Edit' : 'Set up',
      icon: 'i-lucide-pencil',
      onSelect: () => emit('edit')
    },
    {
      label: 'Duplicate',
      icon: 'i-lucide-copy',
      disabled: !action.value,
      onSelect: () => emit('copy')
    }
  ],
  [{ label: 'Delete', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => emit('remove') }]
])
</script>

<template>
  <UContextMenu :items="menuItems">
    <div
      class="bg-default flex h-[60px] w-[220px] items-center gap-2.5 rounded-lg border px-3 transition-[opacity,box-shadow]"
      :class="[
        selected || data?.isRunning ? 'border-primary ring-primary ring-1' : 'border-default',
        { 'opacity-75': dimmed && !data?.isRunning && !data?.isFinished }
      ]"
    >
      <span
        class="border-default flex size-7 shrink-0 items-center justify-center rounded-sm border font-mono text-[11px] font-bold"
        :class="tile.class"
      >
        {{ tile.glyph }}
      </span>
      <div v-if="action" class="min-w-0 flex-1 text-left">
        <div class="truncate text-[13px] font-bold">{{ action.name || 'Action' }}</div>
        <div class="text-muted truncate font-mono text-[11px]" :title="action.topic">
          {{ action.topic }}
        </div>
      </div>
      <div v-else class="flex min-w-0 flex-1 items-center">
        <UButton
          size="xs"
          color="primary"
          variant="soft"
          icon="i-lucide-wrench"
          label="Set up"
          class="nodrag"
          @click.stop="emit('edit')"
        />
      </div>
      <ProgressRing v-if="data?.isRunning" class="text-primary shrink-0" />
      <UIcon
        v-else-if="data?.isFinished"
        name="i-lucide-check"
        class="text-success size-[18px] shrink-0"
        aria-label="Sent"
      />
    </div>
  </UContextMenu>

  <Handle type="target" :position="Position.Left" />
  <Handle type="source" :position="Position.Right" />
</template>
