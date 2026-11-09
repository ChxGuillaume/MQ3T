<script setup lang="ts">
import SegmentedControl from '@renderer/components/ui/SegmentedControl.vue'
import { MessageCapture, MessageMatch, WaitMessageNodeData } from '../../../../../types/actions'
import { computed } from 'vue'

const props = defineProps<{ data: Partial<WaitMessageNodeData> }>()

const emit = defineEmits<{ update: [patch: Partial<WaitMessageNodeData>] }>()

const matchKinds: { label: string; value: MessageMatch['kind'] }[] = [
  { label: 'Any message', value: 'any' },
  { label: 'Payload equals', value: 'equals' },
  { label: 'Payload contains', value: 'contains' },
  { label: 'JSON path', value: 'path' }
]

const match = computed<MessageMatch>(() => props.data.match ?? { kind: 'any' })

const captures = computed<MessageCapture[]>(() => props.data.captures ?? [])

const topic = computed({
  get: () => props.data.topic ?? '',
  set: (value: string) => emit('update', { topic: value.trim() })
})

const timeout = computed({
  get: () => Number(props.data.timeout ?? 5),
  set: (value: number) => emit('update', { timeout: Math.max(0, value) })
})

const timeoutUnit = computed<'ms' | 's'>({
  get: () => props.data.timeoutUnit ?? 's',
  set: (value) => emit('update', { timeoutUnit: value })
})

const topicError = computed(() => {
  if (!topic.value) return 'Topic is required'
  if (/#./.test(topic.value)) return '# must be the last level'

  return undefined
})

const updateMatch = (patch: Partial<MessageMatch>) =>
  emit('update', { match: { ...match.value, ...patch } })

const updateCapture = (index: number, patch: Partial<MessageCapture>) =>
  emit('update', {
    captures: captures.value.map((capture, i) => (i === index ? { ...capture, ...patch } : capture))
  })

const addCapture = () => emit('update', { captures: [...captures.value, { name: '', path: '$.' }] })

const removeCapture = (index: number) =>
  emit('update', { captures: captures.value.filter((_, i) => i !== index) })
</script>

<template>
  <div class="flex flex-col gap-3.5">
    <UFormField label="Topic" :error="topicError" help="Wildcards + and # are allowed">
      <UInput v-model.lazy="topic" placeholder="devices/+/reply" class="w-full font-mono" />
    </UFormField>

    <div class="flex items-end gap-2">
      <UFormField label="Timeout" class="flex-1">
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

    <UFormField label="Match">
      <USelect
        :model-value="match.kind"
        :items="matchKinds"
        class="w-full"
        @update:model-value="updateMatch({ kind: $event as MessageMatch['kind'] })"
      />
    </UFormField>

    <UFormField v-if="match.kind === 'path'" label="Path">
      <UInput
        :model-value="match.path ?? ''"
        placeholder="$.status"
        class="w-full font-mono"
        @update:model-value="updateMatch({ path: String($event) })"
      />
    </UFormField>

    <UFormField
      v-if="match.kind !== 'any'"
      :label="match.kind === 'path' ? 'Equals (empty means it exists)' : 'Value'"
    >
      <UInput
        :model-value="match.value ?? ''"
        class="w-full font-mono"
        @update:model-value="updateMatch({ value: String($event) })"
      />
    </UFormField>

    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium">Capture values</span>
        <UButton
          size="xs"
          color="neutral"
          variant="ghost"
          icon="i-lucide-plus"
          label="Add"
          @click="addCapture"
        />
      </div>
      <div v-for="(capture, index) in captures" :key="index" class="flex items-center gap-1.5">
        <UInput
          :model-value="capture.name"
          placeholder="name"
          size="sm"
          class="w-24 font-mono"
          @update:model-value="updateCapture(index, { name: String($event).trim() })"
        />
        <UInput
          :model-value="capture.path"
          placeholder="$.id"
          size="sm"
          class="min-w-0 flex-1 font-mono"
          @update:model-value="updateCapture(index, { path: String($event) })"
        />
        <UButton
          size="xs"
          color="neutral"
          variant="ghost"
          icon="i-lucide-x"
          aria-label="Remove capture"
          @click="removeCapture(index)"
        />
      </div>
      <p class="text-muted text-xs leading-[1.45]">
        Later steps can use a captured value with
        <span class="font-mono">$s$name$</span>, <span class="font-mono">$n$name$</span> or
        <span class="font-mono">$b$name$</span>. It won't be asked for when the chain runs.
      </p>
    </div>

    <p class="text-muted bg-muted rounded-md p-2.5 text-xs leading-[1.45]">
      Only messages on topics this connection is subscribed to can be received. Messages that arrive
      after the previous step finishes count.
    </p>
  </div>
</template>
