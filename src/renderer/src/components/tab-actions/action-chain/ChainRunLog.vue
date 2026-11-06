<script setup lang="ts">
import { ChainRunLogEntry, formatRunLogTime } from '@renderer/composables/useRunActionChain'

defineProps<{ entries: ChainRunLogEntry[] }>()

const dotClass = (state: ChainRunLogEntry['state']) => {
  switch (state) {
    case 'done':
      return 'bg-success'
    case 'active':
      return 'bg-primary'
    case 'stopped':
      return 'bg-warning'
    case 'failed':
      return 'bg-error'
    case 'skipped':
      return 'border-2 border-dashed border-muted'
    default:
      return 'border-2 border-muted'
  }
}
</script>

<template>
  <ol class="flex flex-col gap-0.5 text-[13px]">
    <li
      v-for="entry in entries"
      :key="entry.id"
      class="border-default flex items-center gap-2.5 border-b px-1 py-2"
      :class="{ 'text-muted': entry.state === 'skipped' }"
    >
      <span class="size-2.5 shrink-0 rounded-full" :class="dotClass(entry.state)" />
      <span class="min-w-0 flex-1 truncate" :title="entry.reason">
        {{ entry.text }}
        <span v-if="entry.reason" class="text-error block truncate text-xs">
          {{ entry.reason }}
        </span>
      </span>
      <span class="text-muted text-xs">{{ formatRunLogTime(entry) }}</span>
    </li>
  </ol>
</template>
