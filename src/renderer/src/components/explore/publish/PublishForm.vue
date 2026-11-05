<script setup lang="ts">
import ConvertToActionDialog from '@renderer/components/tap-topics/dialogs/ConvertToActionDialog.vue'
import { MqttMessage, useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import SegmentedControl from '@renderer/components/ui/SegmentedControl.vue'
import { useMqttConnectionsStore } from '@renderer/store/mqtt-connections'
import CodeEditor from '@renderer/components/tap-topics/CodeEditor.vue'
import { useSettingsStore } from '@renderer/store/settings-store'
import { PublishFormat, useExploreUiStore } from '@renderer/store/explore-ui'
import { ElectronApi } from '@renderer/assets/js/electron-api'
import { findCodeError } from '@renderer/assets/js/format-code'
import { computed, nextTick, reactive, ref, useTemplateRef, watch } from 'vue'
import { useActionsStore } from '@renderer/store/actions'
import { defineShortcuts } from '@nuxt/ui/composables'
import TopicCombobox from './TopicCombobox.vue'
import type { IClientPublishOptions } from 'mqtt'

const props = defineProps<{ clientKey: string; mode: 'topic' | 'new' }>()

const topic = defineModel<string>('topic', { required: true })

const emit = defineEmits<{ published: [topic: string] }>()

const mqttConnectionsStore = useMqttConnectionsStore()
const mqttTopicsStore = useMqttTopicsStore()
const exploreUiStore = useExploreUiStore()
const settingsStore = useSettingsStore()
const actionsStore = useActionsStore()

const editorRef = useTemplateRef('editorRef')

const formats = [
  { label: 'Raw', value: 'raw' as PublishFormat },
  { label: 'JSON', value: 'json' as PublishFormat },
  { label: 'XML', value: 'xml' as PublishFormat },
  { label: 'YAML', value: 'yaml' as PublishFormat }
]

const qosItems = [
  { label: '0', value: 0 as const },
  { label: '1', value: 1 as const },
  { label: '2', value: 2 as const }
]

const language = computed({
  get: (): PublishFormat => exploreUiStore.publishFormat ?? settingsStore.defaultDataFormat,
  set: (format: PublishFormat) => exploreUiStore.setPublishFormat(format)
})
const qos = ref<0 | 1 | 2>(0)
const retain = ref(false)
const responseTopic = ref('')
const correlationData = ref('')
const propertiesOpen = ref(false)

let lastSentAt = 0

const draftKey = computed(() =>
  props.mode === 'new' ? `${props.clientKey}:__new__` : `${props.clientKey}:${topic.value}`
)

const payload = computed({
  get: () => exploreUiStore.publishDrafts[draftKey.value] ?? '',
  set: (value: string) => {
    if (value) exploreUiStore.publishDrafts[draftKey.value] = value
    else delete exploreUiStore.publishDrafts[draftKey.value]
  }
})

const isMqtt5 = computed(
  () => mqttConnectionsStore.getConnection(props.clientKey)?.protocolVersion === 5
)

const propertiesSet = computed(
  () => [responseTopic.value, correlationData.value].filter(Boolean).length
)

const canPublish = computed(() => !!topic.value && !/[+#]/.test(topic.value))

const payloadError = computed(() =>
  language.value === 'raw' ? null : findCodeError(payload.value, language.value)
)

const send = () => {
  if (!canPublish.value) return
  if (Date.now() - lastSentAt < 250) return

  lastSentAt = Date.now()

  const options: IClientPublishOptions = { retain: retain.value, qos: qos.value }

  if (isMqtt5.value && (responseTopic.value || correlationData.value)) {
    options.properties = {}

    if (responseTopic.value) options.properties.responseTopic = responseTopic.value
    if (correlationData.value) {
      options.properties.correlationData = correlationData.value as unknown as Buffer
    }
  }

  ElectronApi.sendMqttMessage(props.clientKey, topic.value, payload.value, options)

  mqttTopicsStore.addPublishMessage(props.clientKey, topic.value, payload.value, {
    retained: retain.value,
    qos: qos.value,
    dataType: language.value
  })

  emit('published', topic.value)
}

const sendFromShortcut = () => {
  if (payloadError.value) {
    editorRef.value?.revealError()
    return
  }

  send()
}

defineShortcuts({
  meta_enter: { usingInput: true, handler: sendFromShortcut }
})

const load = (message: MqttMessage, messageTopic?: string) => {
  if (messageTopic && props.mode === 'new') topic.value = messageTopic

  nextTick(() => {
    editorRef.value?.updateCodeEditorValue(message.message)
    if (message.dataType) language.value = message.dataType
    retain.value = message.retained
    qos.value = message.qos
  })
}

watch(draftKey, () => {
  if (props.mode === 'new') return

  editorRef.value?.updateCodeEditorValue(payload.value)
})

const convertDialogOpened = ref(false)
const convertForm = reactive({
  connectionId: '',
  groupId: 'default',
  title: '',
  description: '',
  message: {} as Pick<MqttMessage, 'message' | 'dataType' | 'qos' | 'retained'>,
  topic: ''
})

const openConvert = (message?: MqttMessage, messageTopic?: string) => {
  convertForm.connectionId = props.clientKey
  convertForm.groupId = 'default'
  convertForm.title = ''
  convertForm.description = ''
  convertForm.topic = messageTopic ?? topic.value
  convertForm.message = message ?? {
    message: payload.value,
    dataType: language.value,
    qos: qos.value,
    retained: retain.value
  }

  convertDialogOpened.value = true
}

const handleConvert = () => {
  actionsStore.addActionToConnectionGroup(
    {
      id: 'none',
      topic: convertForm.topic,
      name: convertForm.title,
      description: convertForm.description,
      groupId: convertForm.groupId,
      payload: convertForm.message.message,
      payloadFormat: convertForm.message.dataType,
      qos: convertForm.message.qos,
      retained: convertForm.message.retained
    },
    convertForm.connectionId,
    convertForm.groupId
  )
}

defineExpose({ load, openConvert })
</script>

<template>
  <div class="flex flex-col gap-3.5">
    <UFormField label="Topic" :ui="{ label: 'text-xs font-semibold text-muted' }">
      <TopicCombobox v-if="mode === 'new'" v-model="topic" :client-key="clientKey" autofocus />
      <UInput v-else v-model="topic" class="w-full" :ui="{ base: 'font-mono' }" />
    </UFormField>

    <div class="flex flex-col gap-1.5">
      <div class="flex items-center justify-between gap-2">
        <span class="text-muted text-xs font-semibold">Payload</span>
        <div class="flex items-center gap-1.5">
          <SegmentedControl v-model="language" :items="formats" size="sm" />
          <UTooltip text="Format">
            <UButton
              icon="i-lucide-align-left"
              size="xs"
              color="neutral"
              variant="ghost"
              aria-label="Format payload"
              class="text-muted"
              :disabled="language === 'raw'"
              @click="editorRef?.formatCode()"
            />
          </UTooltip>
        </div>
      </div>
      <div class="h-44 min-h-28 resize-y overflow-hidden">
        <CodeEditor
          ref="editorRef"
          v-model="payload"
          v-model:language="language"
          hide-options
          hide-warning
          @submit="sendFromShortcut"
        />
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-4">
      <div class="flex items-center gap-2">
        <span class="text-muted text-xs font-semibold">QoS</span>
        <SegmentedControl v-model="qos" :items="qosItems" size="sm" />
      </div>
      <USwitch v-model="retain" label="Retain" />
    </div>

    <UCollapsible
      v-if="isMqtt5"
      v-model:open="propertiesOpen"
      class="border-default rounded-lg border px-3.5"
    >
      <button type="button" class="flex h-10 w-full items-center gap-2 text-[13px] font-semibold">
        MQTT 5 properties
        <span
          v-if="propertiesSet"
          class="bg-muted text-muted rounded-full px-2.5 py-0.5 text-xs font-normal"
        >
          {{ propertiesSet }} set
        </span>
        <UIcon
          name="i-lucide-chevron-down"
          class="text-muted ml-auto size-4 transition-transform"
          :class="{ 'rotate-180': propertiesOpen }"
        />
      </button>
      <template #content>
        <div class="flex flex-col gap-2.5 pb-3.5">
          <UFormField label="Response topic" :ui="{ label: 'text-xs font-semibold text-muted' }">
            <UInput v-model="responseTopic" class="w-full" :ui="{ base: 'font-mono' }" />
          </UFormField>
          <UFormField label="Correlation data" :ui="{ label: 'text-xs font-semibold text-muted' }">
            <UInput v-model="correlationData" class="w-full" :ui="{ base: 'font-mono' }" />
          </UFormField>
        </div>
      </template>
    </UCollapsible>

    <div
      class="flex justify-between gap-2"
      :class="
        mode === 'new'
          ? 'border-default bg-default sticky bottom-0 -mx-[18px] border-t px-[18px] py-3'
          : ''
      "
    >
      <UButton
        label="Save as action"
        color="neutral"
        variant="outline"
        :disabled="!topic"
        @click="openConvert()"
      />
      <UTooltip
        :text="payloadError ? `Payload is not valid ${language.toUpperCase()}` : undefined"
        :disabled="!payloadError"
      >
        <UButton
          :icon="payloadError ? 'i-lucide-triangle-alert' : 'i-lucide-send'"
          :color="payloadError ? 'warning' : 'primary'"
          :disabled="!canPublish"
          class="font-semibold"
          @click="send"
        >
          {{ payloadError ? 'Send anyway' : 'Send' }}
          <span v-if="!payloadError" class="text-xs font-medium opacity-80">Ctrl+Enter</span>
        </UButton>
      </UTooltip>
    </div>

    <ConvertToActionDialog
      v-model:opened="convertDialogOpened"
      v-model:connection-id="convertForm.connectionId"
      v-model:group-id="convertForm.groupId"
      v-model:form-title="convertForm.title"
      v-model:form-description="convertForm.description"
      title="Save as action"
      action-icon="i-lucide-plus"
      action-title="Save"
      @input="handleConvert"
    />
  </div>
</template>
