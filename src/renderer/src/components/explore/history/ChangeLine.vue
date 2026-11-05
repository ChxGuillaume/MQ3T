<script setup lang="ts">
import { compactValue } from '@renderer/assets/js/payload-insight'
import type { JsonChange } from '@renderer/assets/js/json-diff'

defineProps<{ change: JsonChange }>()
</script>

<template>
  <div class="flex items-center gap-2 overflow-hidden font-mono text-xs whitespace-nowrap">
    <span class="text-primary truncate">{{ change.path || 'value' }}</span>
    <template v-if="change.type === 'added'">
      <span class="text-muted">new</span>
      <b class="truncate">{{ compactValue(change.after) }}</b>
    </template>
    <template v-else-if="change.type === 'removed'">
      <span class="text-muted truncate line-through">{{ compactValue(change.before) }}</span>
      <span class="text-muted">removed</span>
    </template>
    <template v-else>
      <span class="text-muted truncate line-through">{{ compactValue(change.before) }}</span>
      <UIcon name="i-lucide-arrow-right" class="text-muted size-3.5 shrink-0" />
      <b class="truncate">{{ compactValue(change.after) }}</b>
    </template>
  </div>
</template>
