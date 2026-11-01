<script setup lang="ts">
import { compactValue, formatAge, parseMessage } from '@renderer/assets/js/payload-insight'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import { useSharedNow } from '@renderer/composables/useSharedNow'
import { computed, ref, watch } from 'vue'

const MAX_SUGGESTIONS = 6

const props = defineProps<{ clientKey: string; autofocus?: boolean }>()

const topic = defineModel<string>({ required: true })

const mqttTopicsStore = useMqttTopicsStore()
const now = useSharedNow()

const focused = ref(false)
const highlighted = ref(0)

const suggestions = computed(() => {
  const query = topic.value.trim().toLowerCase()

  if (!query) return []

  const topics = Object.keys(mqttTopicsStore.topicsMessages[props.clientKey] || {})
  const starts = topics.filter((t) => t.toLowerCase().startsWith(query) && t !== topic.value)
  const contains = topics.filter(
    (t) => !t.toLowerCase().startsWith(query) && t.toLowerCase().includes(query)
  )

  return [...starts.sort(), ...contains.sort()].slice(0, MAX_SUGGESTIONS).map((path) => {
    const last = mqttTopicsStore.getTopicLastMessage(props.clientKey, path)
    let hint = ''

    if (last?.retained) hint = `retained · ${compactValue(parseMessage(last).value, 16)}`
    else if (last) hint = `${formatAge(now.value.getTime() - last.createdAt.getTime())} ago`

    return { path, hint: hint === 'now ago' ? 'now' : hint }
  })
})

const open = computed(() => focused.value && suggestions.value.length > 0)

watch(suggestions, () => (highlighted.value = 0))

const pick = (path: string) => {
  topic.value = path
  focused.value = false
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!open.value) return

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    highlighted.value = (highlighted.value + 1) % suggestions.value.length
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    highlighted.value =
      (highlighted.value - 1 + suggestions.value.length) % suggestions.value.length
  } else if (event.key === 'Enter' || event.key === 'Tab') {
    event.preventDefault()
    pick(suggestions.value[highlighted.value].path)
  } else if (event.key === 'Escape') {
    focused.value = false
  }
}
</script>

<template>
  <div class="relative">
    <UInput
      v-model="topic"
      role="combobox"
      :aria-expanded="open"
      aria-controls="new-message-topic-suggestions"
      aria-label="Topic"
      placeholder="line-2/press-04/setpoint"
      :autofocus="autofocus"
      class="w-full"
      :ui="{ base: 'font-mono' }"
      @focus="focused = true"
      @blur="focused = false"
      @keydown="handleKeydown"
    />
    <div
      v-if="open"
      id="new-message-topic-suggestions"
      role="listbox"
      class="border-default bg-default absolute inset-x-0 top-full z-20 mt-1 rounded-md border p-1 shadow-lg"
    >
      <div
        v-for="(suggestion, index) in suggestions"
        :key="suggestion.path"
        role="option"
        :aria-selected="index === highlighted"
        class="flex h-8 cursor-pointer items-center gap-2 rounded-sm px-2.5 font-mono text-xs"
        :class="{ 'bg-primary/10': index === highlighted }"
        @mousedown.prevent="pick(suggestion.path)"
        @mouseenter="highlighted = index"
      >
        <span class="flex-1 truncate">{{ suggestion.path }}</span>
        <span class="text-muted shrink-0 font-sans text-[11px]">{{ suggestion.hint }}</span>
      </div>
      <div class="text-muted px-2.5 pt-1.5 pb-1 text-[11px]">
        Keep typing to send to a new topic
      </div>
    </div>
  </div>
</template>
