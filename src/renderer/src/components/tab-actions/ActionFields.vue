<script setup lang="ts">
import { highlightFilledTopic, isWildcardTopic, wildcardTargets } from './action-utils'
import SegmentedControl from '@renderer/components/ui/SegmentedControl.vue'
import { useMqttConnectionsStore } from '@renderer/store/mqtt-connections'
import CodeEditor from '@renderer/components/tap-topics/CodeEditor.vue'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import { ActionForm, ActionFormErrors } from './action-form'
import { refDebounced } from '@vueuse/core'
import { computed } from 'vue'

const MAX_TOPIC_CHIPS = 8

const props = withDefaults(
  defineProps<{
    connectionId?: string
    errors?: ActionFormErrors
    noTitle?: boolean
    noWildcard?: boolean
    variableCompletion?: boolean
    showEditor?: boolean
    editorClass?: string
  }>(),
  { showEditor: true, editorClass: 'min-h-[280px] flex-1' }
)

const form = defineModel<ActionForm>({ required: true })

const mqttConnectionsStore = useMqttConnectionsStore()
const mqttTopicsStore = useMqttTopicsStore()

const isMqtt5 = computed(
  () =>
    !props.connectionId ||
    mqttConnectionsStore.getConnection(props.connectionId)?.protocolVersion === 5
)

const debouncedTopic = refDebounced(
  computed(() => form.value.topic),
  150
)

const isWildcard = computed(() => isWildcardTopic(debouncedTopic.value))

const matches = computed(() => {
  if (!isWildcard.value || !props.connectionId || props.errors?.topic) return []

  return wildcardTargets(
    debouncedTopic.value,
    mqttTopicsStore.getConnectionTopics(props.connectionId)
  )
})

const qosItems = [
  { label: '0', value: 0 as const },
  { label: '1', value: 1 as const },
  { label: '2', value: 2 as const }
]

const hasMqtt5Values = computed(() => !!(form.value.responseTopic || form.value.correlationData))
</script>

<template>
  <div class="flex min-h-0 flex-col gap-4">
    <div class="flex flex-wrap gap-3">
      <UFormField
        v-if="!noTitle"
        label="Title"
        :error="errors?.name"
        class="min-w-0 flex-[1_1_200px]"
      >
        <UInput v-model="form.name" class="w-full" placeholder="Start cycle" />
      </UFormField>
      <UFormField label="Description" class="min-w-0 flex-[2_1_300px]">
        <UInput v-model="form.description" class="w-full" placeholder="What does it do?" />
      </UFormField>
    </div>

    <div class="flex flex-wrap items-start gap-4">
      <UFormField label="Topic" :error="errors?.topic" class="min-w-0 flex-[1_1_320px]">
        <UInput
          v-model="form.topic"
          class="w-full"
          :ui="{ base: 'font-mono' }"
          placeholder="line-2/+/mode"
        />
      </UFormField>
      <UFormField label="QoS">
        <SegmentedControl v-model="form.qos" :items="qosItems" size="sm" />
      </UFormField>
      <UFormField label="Retain">
        <div class="flex h-8 items-center">
          <USwitch v-model="form.retained" aria-label="Retain" />
        </div>
      </UFormField>
    </div>

    <div
      v-if="!noWildcard"
      class="bg-muted -mt-1.5 flex flex-col gap-2 rounded-[10px] px-3 py-2.5 text-xs"
    >
      <div class="flex flex-wrap items-center gap-2">
        <b v-if="isWildcard && connectionId">
          {{
            matches.length
              ? `Matches ${matches.length} topic${matches.length > 1 ? 's' : ''} right now`
              : 'No matching topic seen yet'
          }}
        </b>
        <span class="text-muted">
          <span class="bg-primary/10 text-primary rounded px-1 font-bold">+</span> stands for one
          level. <span class="font-mono">#</span> and a
          <span class="bg-primary/10 text-primary rounded px-1 font-bold">+</span> at the end aren't
          allowed.
        </span>
      </div>
      <div v-if="matches.length" class="flex flex-wrap gap-1.5">
        <span
          v-for="topic in matches.slice(0, MAX_TOPIC_CHIPS)"
          :key="topic"
          class="border-default bg-default rounded-full border px-2 py-0.5 font-mono"
        >
          <template
            v-for="(part, index) in highlightFilledTopic(debouncedTopic, topic)"
            :key="index"
          >
            <template v-if="part.separator">/</template>
            <b v-if="part.filled" class="text-primary">{{ part.text }}</b>
            <template v-else>{{ part.text }}</template>
          </template>
        </span>
        <span v-if="matches.length > MAX_TOPIC_CHIPS" class="text-muted self-center">
          +{{ matches.length - MAX_TOPIC_CHIPS }} more
        </span>
      </div>
      <span v-if="isWildcard" class="text-muted">
        This action shows up in Publish for each matching topic, and asks which one to use when sent
        from Actions.
      </span>
    </div>
    <p v-else class="text-muted -mt-2 text-xs">Chain steps need a full topic: no + or #.</p>

    <div class="flex min-h-0 flex-1 flex-col gap-1.5">
      <span class="text-default text-sm font-semibold">Payload</span>
      <div class="border-default overflow-hidden rounded-[10px] border" :class="editorClass">
        <CodeEditor
          v-if="showEditor"
          v-model="form.payload"
          v-model:language="form.payloadFormat"
          :variable-completion="variableCompletion"
          class="h-full"
          font-size="13"
        />
      </div>
      <span class="text-muted text-xs">
        Type <span class="font-mono">$</span> for variables:
        <span class="font-mono">$s$name$</span> text,
        <span class="font-mono">$n$name$</span> number,
        <span class="font-mono">$b$name$</span> boolean,
        <span class="font-mono">$enum$name$</span> list,
        <span class="font-mono">$uuid$v4$</span> generated.
      </span>
    </div>

    <UCollapsible
      v-if="isMqtt5"
      :default-open="hasMqtt5Values"
      class="border-default rounded-xl border"
    >
      <button
        type="button"
        class="group flex w-full items-center gap-1.5 px-3.5 py-3 text-left text-[13px] font-semibold"
      >
        <UIcon
          name="i-lucide-chevron-right"
          class="text-muted size-4 transition-transform group-data-[state=open]:rotate-90"
        />
        MQTT 5 properties
        <span class="text-muted font-normal">· response topic, correlation data</span>
      </button>
      <template #content>
        <div class="flex flex-wrap gap-3 px-3.5 pb-3.5">
          <UFormField label="Response topic" class="min-w-0 flex-1">
            <UInput v-model="form.responseTopic" class="w-full" :ui="{ base: 'font-mono' }" />
          </UFormField>
          <UFormField label="Correlation data" class="min-w-0 flex-1">
            <UInput v-model="form.correlationData" class="w-full" :ui="{ base: 'font-mono' }" />
          </UFormField>
        </div>
      </template>
    </UCollapsible>
  </div>
</template>
