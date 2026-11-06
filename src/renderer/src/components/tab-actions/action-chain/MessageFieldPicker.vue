<script setup lang="ts">
import { compactValue } from '@renderer/assets/js/payload-insight'
import { computed, ref } from 'vue'

defineOptions({ name: 'MessageFieldPicker' })

const props = withDefaults(
  defineProps<{
    value: unknown
    path?: string
    name?: string
    depth?: number
    actions?: ('match' | 'capture')[]
    matchLabel?: string
  }>(),
  {
    path: '$',
    name: '',
    depth: 0,
    actions: () => ['match', 'capture'],
    matchLabel: 'Only accept messages with this value'
  }
)

const emit = defineEmits<{
  match: [path: string, value: unknown]
  capture: [path: string, key: string]
}>()

const isContainer = computed(() => props.value !== null && typeof props.value === 'object')

const expanded = ref(props.depth < 2)

const entries = computed(() => {
  if (!isContainer.value) return []

  if (Array.isArray(props.value)) {
    return props.value.map((item, index) => ({
      key: String(index),
      value: item,
      path: `${props.path}[${index}]`
    }))
  }

  return Object.entries(props.value as Record<string, unknown>).map(([key, item]) => ({
    key,
    value: item,
    path: /^[A-Za-z_$][\w$]*$/.test(key) ? `${props.path}.${key}` : `${props.path}["${key}"]`
  }))
})

const summary = computed(() => {
  if (!isContainer.value) return ''

  const count = entries.value.length

  return Array.isArray(props.value) ? `[${count}]` : `{${count}}`
})

const valueClass = computed(() => {
  if (typeof props.value === 'number') return 'text-code-num'
  if (typeof props.value === 'string') return 'text-code-str'

  return 'text-code-sym'
})

const captureKey = computed(() => (/^\d+$/.test(props.name) ? 'item' : props.name || 'value'))
</script>

<template>
  <div class="font-mono text-xs">
    <div
      v-if="depth > 0"
      class="group hover:bg-muted flex min-h-[26px] items-center gap-1.5 rounded-sm px-1.5"
    >
      <button
        v-if="isContainer"
        type="button"
        class="text-muted w-3 shrink-0"
        :aria-label="expanded ? 'Collapse' : 'Expand'"
        :aria-expanded="expanded"
        @click="expanded = !expanded"
      >
        {{ expanded ? '▾' : '▸' }}
      </button>
      <span v-else class="w-3 shrink-0" />
      <span class="text-primary shrink-0">{{ name }}</span>
      <span v-if="isContainer" class="text-muted">{{ summary }}</span>
      <span v-else class="min-w-0 truncate" :class="valueClass" :title="String(value)">
        {{ compactValue(value, 60) }}
      </span>
      <span
        class="ml-auto flex shrink-0 gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100"
      >
        <UTooltip v-if="actions.includes('match') && !isContainer" :text="matchLabel">
          <UButton
            size="xs"
            color="neutral"
            variant="ghost"
            icon="i-lucide-filter"
            aria-label="Match on this field"
            @click="emit('match', path, value)"
          />
        </UTooltip>
        <UTooltip v-if="actions.includes('capture')" text="Save this value for later steps">
          <UButton
            size="xs"
            color="neutral"
            variant="ghost"
            icon="i-lucide-bookmark-plus"
            aria-label="Save this value"
            @click="emit('capture', path, captureKey)"
          />
        </UTooltip>
      </span>
    </div>

    <div
      v-if="isContainer && (expanded || depth === 0)"
      :class="{ 'border-default ml-3 border-l pl-1': depth > 0 }"
    >
      <MessageFieldPicker
        v-for="entry in entries"
        :key="entry.key"
        :value="entry.value"
        :path="entry.path"
        :name="entry.key"
        :depth="depth + 1"
        :actions="actions"
        :match-label="matchLabel"
        @match="(p, v) => emit('match', p, v)"
        @capture="(p, k) => emit('capture', p, k)"
      />
    </div>
  </div>
</template>
