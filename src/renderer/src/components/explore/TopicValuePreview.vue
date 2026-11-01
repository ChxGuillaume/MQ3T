<script setup lang="ts">
import {
  byteSize,
  compactValue,
  formatBytes,
  parseMessage,
  previewPairs,
  PreviewPair
} from '@renderer/assets/js/payload-insight'
import type { MqttMessage } from '@renderer/store/mqtt-topics'
import { computed } from 'vue'

const props = defineProps<{ message: MqttMessage | null }>()

const parsed = computed(() => (props.message ? parseMessage(props.message) : null))

const json = computed(() => {
  if (parsed.value?.kind !== 'json') return null
  if (parsed.value.value === null) return { pairs: [], more: 0 }

  return previewPairs(parsed.value.value)
})

const pairClass = (kind: PreviewPair['kind']) => {
  switch (kind) {
    case 'number':
      return 'font-bold text-code-num'
    case 'text':
      return 'font-bold text-code-str'
    case 'boolean':
    case 'null':
      return 'font-bold text-code-sym'
  }

  return 'text-muted'
}

const text = computed(() => {
  if (!parsed.value || !props.message) return ''

  const value = parsed.value.value

  if (parsed.value.kind === 'text') {
    const str = String(value)

    return str.length > 80 ? `${str.slice(0, 79)}…` : str
  }

  return compactValue(value, 80)
})

const isShortText = computed(() => text.value.length <= 16 && !/\s/.test(text.value))
</script>

<template>
  <span v-if="message && parsed" class="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden">
    <template v-if="parsed.kind === 'json' && json">
      <span
        v-for="pair in json.pairs"
        :key="pair.key"
        class="bg-default flex shrink-0 gap-1.5 rounded-sm px-2 py-0.5 font-mono text-xs whitespace-nowrap"
      >
        <span class="text-muted">{{ pair.key }}</span>
        <span :class="pairClass(pair.kind)">{{ pair.value }}</span>
      </span>
      <span v-if="!json.pairs.length" class="text-muted text-xs whitespace-nowrap">
        JSON · {{ formatBytes(byteSize(message.message)) }}
      </span>
      <span v-if="json.more > 0" class="text-muted text-xs whitespace-nowrap">
        +{{ json.more }} {{ json.more > 1 ? 'keys' : 'key' }}
      </span>
    </template>
    <span
      v-else-if="parsed.kind === 'number'"
      class="text-code-num truncate font-mono text-[15px] font-bold"
    >
      {{ text }}
    </span>
    <span
      v-else-if="parsed.kind === 'boolean'"
      class="text-code-sym flex items-center gap-1.5 font-mono text-[13px] font-bold"
    >
      <span
        aria-hidden="true"
        class="border-code-sym flex h-3 w-[22px] items-center rounded-full border-[1.5px] px-0.5"
        :class="parsed.value ? 'justify-end' : 'justify-start'"
      >
        <span class="bg-code-sym size-1.5 rounded-full" />
      </span>
      {{ text }}
    </span>
    <span v-else-if="parsed.kind === 'binary'" class="text-muted truncate text-xs">
      binary · {{ formatBytes(byteSize(message.message)) }}
    </span>
    <span v-else-if="parsed.kind === 'empty'" class="text-dimmed text-xs italic">empty</span>
    <span
      v-else-if="isShortText"
      class="border-default flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold"
    >
      <span class="size-1.5 rounded-full bg-(--ui-text-dimmed)" />
      {{ text }}
    </span>
    <span v-else class="text-code-str truncate font-mono text-xs">{{ text }}</span>
  </span>
</template>
