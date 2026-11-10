<script setup lang="ts">
import { IS_VALUES, QUALIFIERS, payloadPaths, tokenAt } from '@renderer/assets/js/topic-query'
import { useTopicQuery } from '@renderer/composables/useTopicQuery'
import { parseMessage } from '@renderer/assets/js/payload-insight'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import { computed, nextTick, ref, toRaw, useTemplateRef, watch } from 'vue'
import { sortTopicKeys } from './topic-tree-context'
import { useStorage } from '@vueuse/core'

type Suggestion = {
  label: string
  insert: string
  hint?: string
  icon: string
  replaceAll?: boolean
}

const MAX_SUGGESTIONS = 10
const MAX_RECENT = 10
const PATH_SAMPLE_SIZE = 20

const props = defineProps<{ clientKey: string; placeholder: string }>()

const model = defineModel<string>({ required: true })

const mqttTopicsStore = useMqttTopicsStore()
const { typedQuery } = useTopicQuery()

const inputComponent = useTemplateRef('inputComponent')
const caret = ref(0)
const focused = ref(false)
const dismissed = ref(false)
const highlighted = ref(-1)
const recentSearches = useStorage<string[]>('explore-recent-searches', [])

const inputElement = () =>
  (inputComponent.value as unknown as { inputRef?: HTMLInputElement } | null)?.inputRef ?? null

const syncCaret = () => {
  caret.value = inputElement()?.selectionStart ?? model.value.length
}

const topicCompletions = (text: string, prefix: string): Suggestion[] => {
  const parts = text.split('/')
  const partial = (parts.pop() ?? '').toLowerCase()
  let node = mqttTopicsStore.getConnectionTopicsStructure(props.clientKey)

  for (const part of parts) {
    const child = node[part]

    if (!child) return []
    node = child
  }

  const base = parts.length ? `${parts.join('/')}/` : ''

  const completions: Suggestion[] = Object.keys(node)
    .filter((key) => key.toLowerCase().startsWith(partial))
    .sort(sortTopicKeys)
    .slice(0, 8)
    .map((key) => {
      const child = node[key]
      const isGroup = !!child && Object.keys(child).length > 0
      const insert = `${prefix}${base}${key}${isGroup ? '/' : ''}`

      return { label: insert, insert, icon: isGroup ? 'i-lucide-folder' : 'i-lucide-hash' }
    })

  if (parts.length && !partial) {
    completions.push(
      {
        label: `${prefix}${base}+/`,
        insert: `${prefix}${base}+/`,
        hint: 'one level',
        icon: 'i-lucide-asterisk'
      },
      {
        label: `${prefix}${base}#`,
        insert: `${prefix}${base}#`,
        hint: 'all below',
        icon: 'i-lucide-asterisk'
      }
    )
  }

  return completions.filter((completion) => completion.insert !== `${prefix}${text}`)
}

const samplePayloadPaths = () => {
  const lastMessages = toRaw(mqttTopicsStore.topicsLastMessage)[props.clientKey] ?? {}
  const selected =
    mqttTopicsStore.selectedConnection === props.clientKey ? mqttTopicsStore.selectedTopic : ''
  const messages = [
    ...(selected && lastMessages[selected] ? [lastMessages[selected]] : []),
    ...Object.values(lastMessages).slice(0, PATH_SAMPLE_SIZE)
  ]
  const paths = new Set<string>()

  for (const message of messages) {
    const { kind, value } = parseMessage(message)

    if (kind === 'json') payloadPaths(value).forEach((path) => paths.add(path))
  }

  return Array.from(paths)
}

const pathCompletions = (partial: string, prefix: string): Suggestion[] =>
  samplePayloadPaths()
    .filter((path) => path.toLowerCase().startsWith(partial.toLowerCase()) && path !== partial)
    .slice(0, 8)
    .map((path) => ({
      label: `${prefix}${path}`,
      insert: `${prefix}${path}`,
      icon: 'i-lucide-braces'
    }))

const valueCompletions = (prefix: string, rest: string, values: string[], hint?: string) =>
  values
    .filter((value) => value.startsWith(rest.toLowerCase()) && value !== rest)
    .map((value) => ({
      label: `${prefix}${value}`,
      insert: `${prefix}${value}`,
      hint,
      icon: 'i-lucide-tag'
    }))

const qualifierCompletions = (negation: string, name: string, rest: string): Suggestion[] => {
  const prefix = `${negation}${name}:`

  if (name === 'is') return valueCompletions(prefix, rest, IS_VALUES)
  if (name === 'qos') return valueCompletions(prefix, rest, ['0', '1', '2'])
  if (name === 'age') return valueCompletions(prefix, rest, ['<10s', '<1m', '>5m', '>1h'])
  if (name === 'msgs') return valueCompletions(prefix, rest, ['>10', '>100', '<5'])
  if (name === 'has') return pathCompletions(rest, prefix)
  if (name === 'topic') return topicCompletions(rest, prefix)

  return []
}

const tokenSuggestions = (): Suggestion[] => {
  const token = tokenAt(model.value, caret.value)
  const negation = token.text.startsWith('-') ? '-' : ''
  const text = token.text.slice(negation.length)
  const qualifier = text.match(/^([a-z]+):(.*)$/i)

  if (qualifier) return qualifierCompletions(negation, qualifier[1].toLowerCase(), qualifier[2])
  if (/(>=|<=|!=|=|>|<)/.test(text)) return []

  const suggestions: Suggestion[] = []

  if (!text.includes('/')) {
    suggestions.push(
      ...QUALIFIERS.filter((q) => q.name.startsWith(text.toLowerCase())).map((q) => ({
        label: `${negation}${q.name}`,
        insert: `${negation}${q.name}`,
        hint: q.hint,
        icon: 'i-lucide-filter'
      }))
    )
  }

  if (text.includes('.') && !text.includes('/'))
    suggestions.push(...pathCompletions(text, negation))

  suggestions.push(...topicCompletions(text, negation))

  return suggestions
}

const suggestions = computed<Suggestion[]>(() => {
  if (!focused.value || dismissed.value) return []

  const recent: Suggestion[] = model.value.trim()
    ? []
    : recentSearches.value.map((search) => ({
        label: search,
        insert: search,
        icon: 'i-lucide-history',
        replaceAll: true
      }))

  return [...recent, ...tokenSuggestions()].slice(0, MAX_SUGGESTIONS)
})

const open = computed(() => suggestions.value.length > 0)

watch(suggestions, () => {
  highlighted.value = -1
})

const setCaret = (position: number) => {
  caret.value = position
  nextTick(() => inputElement()?.setSelectionRange(position, position))
}

const accept = (suggestion: Suggestion) => {
  if (suggestion.replaceAll) {
    model.value = suggestion.insert
    setCaret(suggestion.insert.length)
    return
  }

  const value = model.value
  const token = tokenAt(value, caret.value)
  const after = value.slice(token.end)
  const continues = /[:/.]$/.test(suggestion.insert)
  const separator = continues || after.startsWith(' ') ? '' : ' '
  const skip = !continues && after.startsWith(' ') ? 1 : 0

  model.value = value.slice(0, token.start) + suggestion.insert + separator + after
  setCaret(token.start + suggestion.insert.length + separator.length + skip)
}

const rememberSearch = () => {
  const search = model.value.trim()

  if (!search) return

  recentSearches.value = [search, ...recentSearches.value.filter((s) => s !== search)].slice(
    0,
    MAX_RECENT
  )
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'ArrowDown' && open.value) {
    event.preventDefault()
    highlighted.value = (highlighted.value + 1) % suggestions.value.length
  } else if (event.key === 'ArrowUp' && open.value) {
    event.preventDefault()
    highlighted.value =
      highlighted.value <= 0 ? suggestions.value.length - 1 : highlighted.value - 1
  } else if (event.key === 'Tab' && open.value) {
    event.preventDefault()
    accept(suggestions.value[Math.max(highlighted.value, 0)])
  } else if (event.key === 'Enter') {
    if (open.value && highlighted.value >= 0) {
      event.preventDefault()
      accept(suggestions.value[highlighted.value])
      return
    }

    rememberSearch()
    dismissed.value = true
  } else if (event.key === 'Escape' && open.value) {
    event.preventDefault()
    event.stopPropagation()
    dismissed.value = true
  }
}

const handleInput = () => {
  dismissed.value = false
  syncCaret()
}

const handleFocus = () => {
  focused.value = true
  dismissed.value = false
  syncCaret()
}

const handleBlur = () => {
  focused.value = false
  rememberSearch()
}

const clear = () => {
  model.value = ''
  setCaret(0)
}

const helpExamples = [
  { query: 'temp', meaning: 'Topic contains "temp"' },
  { query: 'line-2/+/temperature', meaning: 'MQTT wildcards, + one level, # all below' },
  { query: '"living room"', meaning: 'Exact phrase' },
  { query: 'temp humidity', meaning: 'Both terms must match' },
  { query: 'temp | humidity', meaning: 'Either term, OR works too' },
  { query: '-debug', meaning: 'Exclude a term, works with any qualifier' },
  { query: '/^plant\\/\\d+/', meaning: 'Topic regex' },
  { query: 'value:error', meaning: 'Last payload contains text' },
  { query: 'temp>20', meaning: 'JSON key comparison, also <, >=, <=, =, !=' },
  { query: 'data.items[0].id=3', meaning: 'Nested JSON path' },
  { query: '>20', meaning: 'Plain payload comparison' },
  { query: 'has:battery', meaning: 'JSON payload has a key' },
  { query: 'is:retained', meaning: 'Also changing, favorite, json, number, text, binary, empty' },
  { query: 'qos:1', meaning: 'Last message QoS' },
  { query: 'age:<30s', meaning: 'Last message age, units ms s m h d' },
  { query: 'msgs:>100', meaning: 'Message count' }
]

const appendExample = (example: string) => {
  const value = model.value.trim()

  model.value = value ? `${value} ${example}` : example
}
</script>

<template>
  <div>
    <UPopover
      :open="open"
      :dismissible="false"
      :content="{
        align: 'start',
        sideOffset: 4,
        onOpenAutoFocus: (event: Event) => event.preventDefault(),
        onCloseAutoFocus: (event: Event) => event.preventDefault()
      }"
      :ui="{ content: 'w-(--reka-popover-trigger-width) min-w-72 p-1' }"
    >
      <template #anchor>
        <UInput
          ref="inputComponent"
          v-model="model"
          icon="i-lucide-search"
          :placeholder="placeholder"
          class="w-full"
          :ui="{ base: 'h-8' }"
          role="combobox"
          aria-autocomplete="list"
          :aria-expanded="open"
          spellcheck="false"
          @keydown="handleKeyDown"
          @keyup="syncCaret"
          @click="syncCaret"
          @input="handleInput"
          @focus="handleFocus"
          @blur="handleBlur"
        >
          <template #trailing>
            <div class="flex items-center gap-0.5">
              <UTooltip v-if="typedQuery.warnings.length" :text="typedQuery.warnings.join(' · ')">
                <UIcon
                  name="i-lucide-triangle-alert"
                  class="text-warning size-4"
                  aria-label="Search warnings"
                />
              </UTooltip>
              <UButton
                v-if="model"
                icon="i-lucide-x"
                size="xs"
                color="neutral"
                variant="link"
                aria-label="Clear filter"
                @click="clear"
              />
              <UPopover :content="{ align: 'end' }">
                <UButton
                  icon="i-lucide-circle-help"
                  size="xs"
                  color="neutral"
                  variant="link"
                  aria-label="Search syntax"
                />
                <template #content>
                  <div class="w-96 p-3">
                    <p class="mb-2 text-sm font-semibold">Search syntax</p>
                    <div class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                      <template v-for="example in helpExamples" :key="example.query">
                        <button
                          type="button"
                          class="text-primary justify-self-start font-mono hover:underline"
                          @click="appendExample(example.query)"
                        >
                          {{ example.query }}
                        </button>
                        <span class="text-muted">{{ example.meaning }}</span>
                      </template>
                    </div>
                    <p class="text-dimmed mt-2 text-[11px]">
                      Payload filters use each topic's last message.
                    </p>
                  </div>
                </template>
              </UPopover>
            </div>
          </template>
        </UInput>
      </template>

      <template #content>
        <ul role="listbox" class="max-h-72 overflow-auto">
          <li
            v-for="(suggestion, index) in suggestions"
            :key="`${suggestion.replaceAll ? 'recent' : 'token'}:${suggestion.insert}`"
            role="option"
            :aria-selected="index === highlighted"
            class="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1 text-sm"
            :class="index === highlighted ? 'bg-elevated' : 'hover:bg-elevated/50'"
            @mousedown.prevent="accept(suggestion)"
            @mouseenter="highlighted = index"
          >
            <UIcon :name="suggestion.icon" class="text-dimmed size-3.5 shrink-0" />
            <span class="truncate font-mono text-xs">{{ suggestion.label }}</span>
            <span v-if="suggestion.hint" class="text-dimmed ml-auto shrink-0 truncate text-xs">
              {{ suggestion.hint }}
            </span>
          </li>
        </ul>
      </template>
    </UPopover>
  </div>
</template>
