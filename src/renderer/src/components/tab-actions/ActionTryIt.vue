<script setup lang="ts">
import {
  applyVariables,
  defaultVariableValues,
  isWildcardTopic,
  validateTopic,
  VariableValue,
  wildcardTargets
} from './action-utils'
import { useMqttConnectionsStore } from '@renderer/store/mqtt-connections'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import ActionVariableInputs from './ActionVariableInputs.vue'
import { useActionsStore } from '@renderer/store/actions'
import { useToast } from '@nuxt/ui/composables'
import PayloadPreview from './PayloadPreview.vue'
import { ActionForm, formToAction } from './action-form'
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  form: ActionForm
  connectionId: string
}>()

const mqttConnectionsStore = useMqttConnectionsStore()
const mqttTopicsStore = useMqttTopicsStore()
const actionsStore = useActionsStore()
const toast = useToast()

const action = computed(() => formToAction(props.form, { id: 'test', groupId: 'test' }))

const values = ref<Record<string, VariableValue>>({})

watch(
  () => [props.form.payload, props.form.enumOptions],
  () => {
    const defaults = defaultVariableValues(action.value)

    for (const key of Object.keys(defaults)) {
      if (key in values.value) defaults[key] = values.value[key]
    }

    values.value = defaults
  },
  { immediate: true, deep: true }
)

const isWildcard = computed(() => isWildcardTopic(props.form.topic))

const targets = computed(() => {
  if (!isWildcard.value) return [props.form.topic]

  return wildcardTargets(props.form.topic, mqttTopicsStore.getConnectionTopics(props.connectionId))
})

const target = ref('')

watch(
  targets,
  (list) => {
    if (!list.includes(target.value)) target.value = list[0] ?? ''
  },
  { immediate: true }
)

const isConnected = computed(
  () => mqttConnectionsStore.getConnectionStatus(props.connectionId) === 'connected'
)

const topicError = computed(() => validateTopic(target.value, { noWildcard: true }))

const preview = computed(() => applyVariables(action.value, values.value, '…generated'))

const handleSend = () => {
  if (!isConnected.value || topicError.value) return

  actionsStore.sendAction(
    props.connectionId,
    { ...action.value, payload: applyVariables(action.value, values.value) },
    target.value
  )

  toast.add({
    title: 'Test message sent',
    description: target.value,
    icon: 'i-lucide-send',
    color: 'success',
    duration: 1500
  })
}
</script>

<template>
  <section class="flex flex-col gap-2.5">
    <h2 class="text-muted text-[11px] font-semibold tracking-[0.1em] uppercase">Try it</h2>

    <div class="flex flex-col gap-2 text-[13px]">
      <div class="flex items-center gap-2">
        <span class="w-[70px] shrink-0 font-semibold">Topic</span>
        <USelect
          v-if="isWildcard && targets.length"
          v-model="target"
          :items="targets"
          size="sm"
          class="min-w-0 flex-1"
          :ui="{ base: 'font-mono' }"
        />
        <UInput
          v-else-if="isWildcard"
          v-model="target"
          size="sm"
          placeholder="Type a full topic"
          class="min-w-0 flex-1"
          :ui="{ base: 'font-mono' }"
        />
        <span v-else class="truncate font-mono text-xs" :title="form.topic">
          {{ form.topic || '—' }}
        </span>
      </div>
      <ActionVariableInputs v-model="values" :action="action" size="sm" @submit="handleSend" />
    </div>

    <PayloadPreview :payload="preview" :format="form.payloadFormat" dense />

    <UTooltip :text="isConnected ? undefined : 'Connection is not active'" :disabled="isConnected">
      <UButton
        color="primary"
        variant="outline"
        icon="i-lucide-send"
        label="Send test"
        block
        class="font-semibold"
        :disabled="!isConnected || !!topicError"
        @click="handleSend"
      />
    </UTooltip>
    <span class="text-muted text-xs">Sends to the live broker with these values.</span>
  </section>
</template>
