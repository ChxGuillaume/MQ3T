<script setup lang="ts">
import SegmentedControl from '@renderer/components/ui/SegmentedControl.vue'
import { MessageCapture, MessageMatch, WaitMessageNodeData } from '../../../../../types/actions'
import { matchesTopicFilter, messageMatches } from '../chain-message'
import { SampleMessage, waitMessageSentence } from '../chain-step-help'
import MessageFieldPicker from './MessageFieldPicker.vue'
import FieldPathInput from './FieldPathInput.vue'
import { useToast } from '@nuxt/ui/composables'
import StepSentence from './StepSentence.vue'
import { computed, ref } from 'vue'

const MAX_TOPIC_SUGGESTIONS = 6

const props = defineProps<{
  data: Partial<WaitMessageNodeData>
  sample?: SampleMessage
  knownTopics: string[]
  subscribed: boolean
}>()

const emit = defineEmits<{ update: [patch: Partial<WaitMessageNodeData>] }>()

const toast = useToast()

const matchKinds: { label: string; value: MessageMatch['kind'] }[] = [
  { label: 'Any message on the topic', value: 'any' },
  { label: 'A field has a value', value: 'path' },
  { label: 'The payload is exactly', value: 'equals' },
  { label: 'The payload contains', value: 'contains' }
]

const match = computed<MessageMatch>(() => props.data.match ?? { kind: 'any' })

const captures = computed<MessageCapture[]>(() => props.data.captures ?? [])

const sentence = computed(() => waitMessageSentence(props.data))

const topicDraft = ref(props.data.topic ?? '')
const topicFocused = ref(false)

const commitTopic = (value = topicDraft.value) => {
  topicDraft.value = value.trim()
  emit('update', { topic: topicDraft.value })
}

const topicError = computed(() => {
  if (!props.data.topic) return 'Choose the topic to listen on'
  if (/#./.test(props.data.topic)) return '# must be the last level'

  return undefined
})

const topicSuggestions = computed(() => {
  const draft = topicDraft.value.trim().toLowerCase()

  if (!topicFocused.value) return []

  return props.knownTopics
    .filter((topic) => topic !== topicDraft.value && topic.toLowerCase().includes(draft))
    .slice(0, MAX_TOPIC_SUGGESTIONS)
})

const pickTopic = (topic: string) => commitTopic(topic)

const handleTopicBlur = () => {
  topicFocused.value = false
  commitTopic()
}

const timeout = computed({
  get: () => Number(props.data.timeout ?? 5),
  set: (value: number) => emit('update', { timeout: Math.max(0, value) })
})

const timeoutUnit = computed<'ms' | 's'>({
  get: () => props.data.timeoutUnit ?? 's',
  set: (value) => emit('update', { timeoutUnit: value })
})

const updateMatch = (patch: Partial<MessageMatch>) =>
  emit('update', { match: { ...match.value, ...patch } })

const updateCapture = (index: number, patch: Partial<MessageCapture>) =>
  emit('update', {
    captures: captures.value.map((capture, i) => (i === index ? { ...capture, ...patch } : capture))
  })

const lastSegment = (path: string) => {
  const segments = path.match(/[A-Za-z_$][\w$]*|\d+/g) ?? []
  const last = [...segments].reverse().find((segment) => !/^\d+$/.test(segment) && segment !== '$')

  return last ?? 'value'
}

const setCapturePath = (index: number, path: string) => {
  const capture = captures.value[index]

  updateCapture(
    index,
    capture.name || !path ? { path } : { path, name: uniqueName(lastSegment(path)) }
  )
}

const addCapture = (capture: MessageCapture = { name: '', path: '' }) =>
  emit('update', { captures: [...captures.value, capture] })

const removeCapture = (index: number) =>
  emit('update', { captures: captures.value.filter((_, i) => i !== index) })

const uniqueName = (base: string) => {
  const taken = new Set(captures.value.map((capture) => capture.name))
  const clean = base.replace(/[^a-zA-Z0-9_ -]/g, '') || 'value'

  if (!taken.has(clean)) return clean

  let index = 2

  while (taken.has(`${clean}${index}`)) index++

  return `${clean}${index}`
}

const handlePickMatch = (path: string, value: unknown) =>
  updateMatch({
    kind: 'path',
    path,
    value: typeof value === 'string' ? value : JSON.stringify(value)
  })

const handlePickCapture = (path: string, key: string) => addCapture({ name: uniqueName(key), path })

const variableToken = (name: string) => `$s$${name}$`

const copyToken = async (name: string) => {
  await navigator.clipboard.writeText(variableToken(name))
  toast.add({
    title: `Copied ${variableToken(name)}`,
    description: 'Paste it into a later step’s payload or topic',
    icon: 'i-lucide-clipboard-check',
    duration: 2000
  })
}

const parsedSample = computed(() => {
  if (!props.sample) return undefined

  try {
    return JSON.parse(props.sample.message) as unknown
  } catch {
    return undefined
  }
})

const sampleIsJson = computed(
  () => parsedSample.value !== null && typeof parsedSample.value === 'object'
)

const sampleMatches = computed(() => {
  if (!props.sample || !props.data.topic) return false

  return (
    matchesTopicFilter(props.data.topic, props.sample.topic) &&
    messageMatches(match.value, props.sample.message)
  )
})

const sampleTime = computed(() =>
  props.sample
    ? props.sample.receivedAt.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    : ''
)
</script>

<template>
  <div class="flex flex-col gap-3.5">
    <StepSentence :parts="sentence" />

    <UFormField label="Listen on topic" :error="topicError">
      <UInput
        v-model="topicDraft"
        placeholder="devices/+/reply"
        class="w-full font-mono"
        @focus="topicFocused = true"
        @blur="handleTopicBlur"
        @keydown.enter.prevent="commitTopic()"
      />
      <div v-if="topicSuggestions.length" class="mt-1 flex flex-col gap-0.5">
        <button
          v-for="suggestion in topicSuggestions"
          :key="suggestion"
          type="button"
          class="hover:bg-muted truncate rounded-sm px-2 py-1 text-left font-mono text-xs"
          @mousedown.prevent="pickTopic(suggestion)"
        >
          {{ suggestion }}
        </button>
      </div>
      <template #help>
        <span>Use <b>+</b> for one level and <b>#</b> for everything below.</span>
      </template>
    </UFormField>

    <UAlert
      v-if="data.topic && !subscribed"
      color="warning"
      variant="soft"
      icon="i-lucide-triangle-alert"
      title="This connection isn't subscribed to this topic"
      description="Messages only reach the chain for topics the connection subscribes to. Add a matching subscription in the connection settings."
    />

    <div class="flex items-end gap-2">
      <UFormField label="Give up after" class="flex-1">
        <UInput v-model.number="timeout" type="number" min="0" class="w-full" />
      </UFormField>
      <SegmentedControl
        v-model="timeoutUnit"
        :items="[
          { label: 'ms', value: 'ms' },
          { label: 's', value: 's' }
        ]"
      />
    </div>

    <UFormField label="Which messages count?">
      <USelect
        :model-value="match.kind"
        :items="matchKinds"
        class="w-full"
        @update:model-value="updateMatch({ kind: $event as MessageMatch['kind'] })"
      />
    </UFormField>

    <UFormField
      v-if="match.kind === 'path'"
      label="Field"
      help="Type to pick from the last message, or use the field tree below"
    >
      <FieldPathInput
        :model-value="match.path ?? ''"
        :sample="sample?.message"
        @update:model-value="updateMatch({ path: $event })"
      />
    </UFormField>

    <UFormField
      v-if="match.kind !== 'any'"
      :label="match.kind === 'path' ? 'Value' : 'Text'"
      :help="
        match.kind === 'path'
          ? 'Leave empty to accept any value as long as the field exists'
          : undefined
      "
    >
      <UInput
        :model-value="match.value ?? ''"
        class="w-full font-mono"
        @update:model-value="updateMatch({ value: String($event) })"
      />
    </UFormField>

    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium">Save values for later steps</span>
        <UButton
          size="xs"
          color="neutral"
          variant="ghost"
          icon="i-lucide-plus"
          label="Add"
          @click="addCapture()"
        />
      </div>
      <p v-if="!captures.length" class="text-muted text-xs leading-[1.45]">
        Save a field from the received message, like an id, to reuse it in later steps or check it
        in a condition.
      </p>
      <div
        v-for="(capture, index) in captures"
        :key="index"
        class="border-default flex flex-col gap-1.5 rounded-md border p-2"
      >
        <div class="flex items-start gap-1.5">
          <span class="text-muted w-9 shrink-0 self-start pt-1.5 text-xs">Field</span>
          <FieldPathInput
            :model-value="capture.path"
            :sample="sample?.message"
            placeholder="id"
            size="sm"
            @update:model-value="setCapturePath(index, $event)"
          />
          <UButton
            size="xs"
            color="neutral"
            variant="ghost"
            icon="i-lucide-x"
            aria-label="Remove saved value"
            @click="removeCapture(index)"
          />
        </div>
        <div class="flex items-center gap-1.5">
          <span class="text-muted w-9 shrink-0 text-xs">As</span>
          <UInput
            :model-value="capture.name"
            placeholder="requestId"
            size="sm"
            class="min-w-0 flex-1 font-mono"
            @update:model-value="updateCapture(index, { name: String($event).trim() })"
          />
        </div>
        <div v-if="capture.name" class="flex items-center gap-1.5 text-xs">
          <span class="text-muted">Use it with</span>
          <UTooltip text="Copy. Use $n$ instead of $s$ for numbers and $b$ for booleans">
            <button
              type="button"
              class="bg-primary/10 text-primary hover:bg-primary/20 flex items-center gap-1 rounded-xs px-1.5 py-0.5 font-mono"
              @click="copyToken(capture.name)"
            >
              {{ variableToken(capture.name) }}
              <UIcon name="i-lucide-copy" class="size-3" />
            </button>
          </UTooltip>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium">Last message on this topic</span>
        <span v-if="sample" class="text-muted ml-auto text-xs">{{ sampleTime }}</span>
      </div>
      <template v-if="sample">
        <div class="flex flex-wrap items-center gap-1.5 text-xs">
          <span class="text-muted truncate font-mono" :title="sample.topic">{{
            sample.topic
          }}</span>
          <span
            class="ml-auto flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold"
            :class="sampleMatches ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'"
          >
            <UIcon :name="sampleMatches ? 'i-lucide-check' : 'i-lucide-x'" class="size-3" />
            {{ sampleMatches ? 'Would be accepted' : 'Would be ignored' }}
          </span>
        </div>
        <div class="border-default bg-default max-h-64 overflow-auto rounded-md border p-1">
          <MessageFieldPicker
            v-if="sampleIsJson"
            :value="parsedSample"
            @match="handlePickMatch"
            @capture="handlePickCapture"
          />
          <pre v-else class="p-1.5 font-mono text-xs break-all whitespace-pre-wrap">{{
            sample.message
          }}</pre>
        </div>
        <p v-if="sampleIsJson" class="text-muted text-xs leading-[1.45]">
          Hover a field and use
          <UIcon name="i-lucide-filter" class="inline size-3 align-[-2px]" /> to only accept
          messages with that value, or
          <UIcon name="i-lucide-bookmark-plus" class="inline size-3 align-[-2px]" /> to save it for
          later steps.
        </p>
      </template>
      <p v-else class="text-muted bg-muted rounded-md p-2.5 text-xs leading-[1.45]">
        No message has been received on this topic yet. When one arrives, it shows up here and you
        can pick fields from it.
      </p>
    </div>
  </div>
</template>
