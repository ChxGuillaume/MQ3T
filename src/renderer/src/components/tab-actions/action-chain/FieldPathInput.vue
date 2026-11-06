<script setup lang="ts">
import { friendlyPath, listMessagePaths, readMessagePath, toCanonicalPath } from '../chain-message'
import { compactValue } from '@renderer/assets/js/payload-insight'
import { computed, ref, watch } from 'vue'

const MAX_SUGGESTIONS = 8

const props = withDefaults(
  defineProps<{
    sample?: string
    placeholder?: string
    size?: 'sm' | 'md'
    allowWhole?: boolean
  }>(),
  { placeholder: 'status', size: 'md' }
)

const path = defineModel<string>({ required: true })

const draft = ref(friendlyPath(path.value))
const focused = ref(false)

watch(path, (value) => {
  if (!focused.value) draft.value = friendlyPath(value)
})

const commit = (text = draft.value) => {
  draft.value = friendlyPath(toCanonicalPath(text))
  path.value = toCanonicalPath(text)
}

const options = computed(() => (props.sample ? listMessagePaths(props.sample) : []))

const suggestions = computed(() => {
  if (!focused.value) return []

  const term = draft.value.trim().toLowerCase()

  return options.value
    .filter((option) => option.label !== draft.value.trim())
    .filter((option) => !term || option.label.toLowerCase().includes(term))
    .slice(0, MAX_SUGGESTIONS)
})

const pick = (optionPath: string) => {
  commit(friendlyPath(optionPath))
  focused.value = false
}

const handleBlur = () => {
  focused.value = false
  commit()
}

const preview = computed(() => {
  if (!props.sample) return undefined
  if (!draft.value.trim()) {
    return props.allowWhole ? { found: true, text: 'the whole payload' } : undefined
  }

  const value = readMessagePath(props.sample, toCanonicalPath(draft.value))

  return value === undefined
    ? { found: false, text: 'not found in the last message' }
    : { found: true, text: compactValue(value, 48) }
})
</script>

<template>
  <div class="flex min-w-0 flex-1 flex-col gap-1">
    <div class="flex items-center gap-1">
      <UInput
        v-model="draft"
        :placeholder="placeholder"
        :size="size"
        class="min-w-0 flex-1 font-mono"
        @focus="focused = true"
        @blur="handleBlur"
        @keydown.enter.prevent="commit()"
      />
      <UPopover :content="{ side: 'left', align: 'start' }">
        <UButton
          :size="size === 'sm' ? 'xs' : 'sm'"
          color="neutral"
          variant="ghost"
          icon="i-lucide-circle-help"
          aria-label="How to write a field"
        />
        <template #content>
          <div class="flex w-64 flex-col gap-2 p-3 text-xs leading-[1.45]">
            <span class="font-semibold">Pointing at a field</span>
            <span class="text-muted">
              Write the field names from the top of the message down, separated by dots. Use a
              number for a position in a list.
            </span>
            <table class="font-mono">
              <tbody>
                <tr>
                  <td class="text-primary pr-3">status</td>
                  <td class="text-muted font-sans">a top-level field</td>
                </tr>
                <tr>
                  <td class="text-primary pr-3">device.name</td>
                  <td class="text-muted font-sans">a field inside another</td>
                </tr>
                <tr>
                  <td class="text-primary pr-3">items[0].id</td>
                  <td class="text-muted font-sans">first item of a list</td>
                </tr>
                <tr>
                  <td class="text-primary pr-3">items.0.id</td>
                  <td class="text-muted font-sans">same, with a dot</td>
                </tr>
              </tbody>
            </table>
            <span v-if="options.length" class="text-muted">
              Start typing to see the fields of the last message.
            </span>
          </div>
        </template>
      </UPopover>
    </div>

    <div
      v-if="suggestions.length"
      class="border-default bg-default flex max-h-56 flex-col overflow-auto rounded-md border p-1"
    >
      <button
        v-for="option in suggestions"
        :key="option.path"
        type="button"
        class="hover:bg-muted flex items-center gap-2 rounded-sm px-2 py-1 text-left font-mono text-xs"
        @mousedown.prevent="pick(option.path)"
      >
        <span class="text-primary shrink-0">{{ option.label }}</span>
        <span class="text-muted ml-auto truncate">{{ compactValue(option.value, 32) }}</span>
      </button>
    </div>

    <span
      v-if="preview"
      class="truncate text-xs"
      :class="preview.found ? 'text-muted' : 'text-warning'"
    >
      <template v-if="preview.found"
        >= <span class="font-mono">{{ preview.text }}</span></template
      >
      <template v-else>{{ preview.text }}</template>
    </span>
  </div>
</template>
