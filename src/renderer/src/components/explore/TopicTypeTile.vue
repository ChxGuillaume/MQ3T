<script setup lang="ts">
import type { PayloadKind } from '@renderer/assets/js/payload-insight'
import { computed } from 'vue'

const props = withDefaults(defineProps<{ kind: PayloadKind; size?: 'sm' | 'md' }>(), {
  size: 'md'
})

const tile = computed(() => {
  switch (props.kind) {
    case 'json':
      return { glyph: '{}', color: 'text-primary' }
    case 'number':
      return { glyph: '#', color: 'text-code-num' }
    case 'boolean':
      return { glyph: 'T/F', color: 'text-code-sym' }
    case 'binary':
      return { glyph: '01', color: 'text-code-bin' }
    case 'empty':
      return { glyph: '∅', color: 'text-dimmed' }
  }

  return { glyph: '""', color: 'text-code-str' }
})
</script>

<template>
  <span
    aria-hidden="true"
    class="border-default flex shrink-0 items-center justify-center border font-mono text-[11px] font-bold"
    :class="[tile.color, size === 'sm' ? 'size-[26px] rounded-[7px]' : 'size-7 rounded-[7px]']"
  >
    {{ tile.glyph }}
  </span>
</template>
