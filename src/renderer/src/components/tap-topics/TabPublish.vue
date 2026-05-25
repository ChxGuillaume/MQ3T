<script setup lang="ts">
import ActionDialog from '@renderer/components/tab-actions/dialogs/ActionDialog.vue'
import { MqttMessage, useMqttTopicsStore } from '../../store/mqtt-topics'
import { useMqttConnectionsStore } from '../../store/mqtt-connections'
import ConvertToActionDialog from './dialogs/ConvertToActionDialog.vue'
import { ElectronIpc } from '../../../../types/electron-ipc-callbacks'
import { computed, reactive, ref, useTemplateRef, watch } from 'vue'
import { useSettingsStore } from '../../store/settings-store'
import ActionCard from '../tab-actions/ActionCard.vue'
import { useActionsStore } from '../../store/actions'
import { matchTopics } from '../../assets/js/mqtt'
import { Action } from '../../../../types/actions'
import SplitterIcon from '../SplitterIcon.vue'
import { IClientPublishOptions } from 'mqtt'
import CodeEditor from './CodeEditor.vue'

const DEFAULT_SPLITTER_HEIGHT = 250

const emit = defineEmits<{
  'click:publish': [topic: string]
}>()

const codeEditorRef = useTemplateRef('codeEditorRef')

const mqttTopicsStore = useMqttTopicsStore()
const mqttConnectionsStore = useMqttConnectionsStore()
const settingsStore = useSettingsStore()
const actionsStore = useActionsStore()

const isMqtt5 = computed(
  () =>
    mqttConnectionsStore.getConnection(mqttTopicsStore.selectedConnection)?.protocolVersion === 5
)

const publishType = ref<'manual' | 'action'>('manual')

const publishDataType = ref(settingsStore.defaultDataFormat)
const codeEditorSplitter = ref(DEFAULT_SPLITTER_HEIGHT)
const codeEditorLimits = ref([150, 800])
const codeEditorDataPerTopic = ref<Record<string, Record<string, string>>>({})
const codeEditorData = computed<string>({
  get: () => {
    const connection = mqttTopicsStore.selectedConnection
    const topic = mqttTopicsStore.selectedPublishTopic

    return codeEditorDataPerTopic.value[connection]?.[topic] ?? ''
  },
  set: (value) => {
    const connection = mqttTopicsStore.selectedConnection
    const topic = mqttTopicsStore.selectedPublishTopic

    if (value) {
      if (!codeEditorDataPerTopic.value[connection]) codeEditorDataPerTopic.value[connection] = {}
      codeEditorDataPerTopic.value[connection][topic] = value
    } else if (codeEditorDataPerTopic.value[connection]) {
      delete codeEditorDataPerTopic.value[connection][topic]
    }
  }
})
const retain = ref(false)
const qos = ref<0 | 1 | 2>(0)
const responseTopic = ref('')
const correlationData = ref('')
const current = ref(1)

const convertToActionDialogOpened = ref(false)
const convertToActionForm = reactive({
  connectionId: '',
  description: '',
  groupId: '',
  title: '',
  message: {} as MqttMessage
})

const actionDialogOpened = ref<boolean>(false)
const editAction = ref<Action | undefined>()

const publishTopic = computed({
  get: () => mqttTopicsStore.selectedPublishTopic,
  set: (value) => mqttTopicsStore.setSelectedPublishTopic(value)
})

const canPublish = computed(() => {
  return publishTopic.value !== '' && mqttTopicsStore.selectedConnection !== ''
})

const slicedMessages = computed(() => {
  if (!settingsStore.messagesPagination) return mqttTopicsStore.sortedSelectedPublishTopicMessages

  const start = (current.value - 1) * 5
  const end = start + 5

  return mqttTopicsStore.sortedSelectedPublishTopicMessages.slice(start, end)
})

const electronApi = window.api as ElectronIpc

const handlePublishMessage = () => {
  const publishOptions: IClientPublishOptions = {
    retain: retain.value,
    qos: qos.value
  }

  if (isMqtt5.value && (responseTopic.value || correlationData.value)) {
    publishOptions.properties = {}

    if (responseTopic.value) publishOptions.properties.responseTopic = responseTopic.value
    if (correlationData.value) {
      publishOptions.properties.correlationData = correlationData.value as unknown as Buffer
    }
  }
  electronApi.sendMqttMessage(
    mqttTopicsStore.selectedConnection,
    publishTopic.value,
    codeEditorData.value,
    publishOptions
  )

  mqttTopicsStore.addPublishMessage(
    mqttTopicsStore.selectedConnection,
    publishTopic.value,
    codeEditorData.value,
    { retained: retain.value, qos: qos.value, dataType: publishDataType.value }
  )

  emit('click:publish', publishTopic.value)
}

const handleSendAction = () => {
  emit('click:publish', publishTopic.value)
}

const handleMessageClick = (message: MqttMessage) => {
  codeEditorRef.value?.updateCodeEditorValue(message.message)
  retain.value = message.retained
  qos.value = message.qos
}

const handleConvertToAction = (message: MqttMessage) => {
  convertToActionForm.connectionId = mqttTopicsStore.selectedConnection
  convertToActionForm.groupId = 'default'
  convertToActionForm.title = ''
  convertToActionForm.description = ''
  convertToActionForm.message = message

  convertToActionDialogOpened.value = true
}

const handleConvertToActionDialogInput = () => {
  actionsStore.addActionToConnectionGroup(
    {
      id: 'none',
      topic: publishTopic.value,
      name: convertToActionForm.title,
      description: convertToActionForm.description,
      groupId: convertToActionForm.groupId,
      payload: convertToActionForm.message.message,
      payloadFormat: convertToActionForm.message.dataType,
      qos: convertToActionForm.message.qos,
      retained: convertToActionForm.message.retained
    },
    convertToActionForm.connectionId,
    convertToActionForm.groupId
  )
}

const togglePublishType = (type: 'manual' | 'action') => {
  publishType.value = type
}

const sortedActions = computed(() => {
  const actions = actionsStore.getConnectionActions(mqttTopicsStore.selectedConnection)

  return actions.filter((action) => matchTopics(action.topic, publishTopic.value))
})

watch(
  () => sortedActions.value.length,
  (value, oldValue) => {
    if (!settingsStore.autoOpenPublishActions) {
      if (value === 0) publishType.value = 'manual'
      return
    }

    if (oldValue === 0 && value > 0) publishType.value = 'action'
    else if (oldValue > 0 && value === 0) publishType.value = 'manual'
  }
)

watch(
  () => [mqttTopicsStore.selectedConnection, mqttTopicsStore.selectedPublishTopic],
  ([connection, topic]) => {
    if (codeEditorDataPerTopic.value[connection]?.[topic])
      codeEditorRef.value?.updateCodeEditorValue(codeEditorData.value)
    else codeEditorRef.value?.updateCodeEditorValue('')
  }
)
</script>

<template>
  <div>
    <q-input v-model="publishTopic" filled label="Topic" dense square />
    <q-separator />
  </div>
  <q-list class="tw:h-full tw:max-h-[calc(100%-41px)] tw:overflow-hidden">
    <q-expansion-item
      :model-value="publishType === 'manual'"
      group="publish_type"
      default-opened
      dense
      class="tw:max-h-[calc(100%-32px)] tw:overflow-auto"
      header-class="tw:text-secondary"
      @show="togglePublishType('manual')"
      @hide="togglePublishType('action')"
    >
      <template #header>
        <q-item-section class="tw:flex tw:flex-row tw:items-center tw:justify-start tw:gap-6">
          <q-icon name="fa-solid fa-pen" size="xs" />
          <span>Manual Publish</span>
        </q-item-section>
      </template>
      <q-card class="tw:min-h-[calc(100vh-234px)]">
        <q-splitter v-model="codeEditorSplitter" horizontal :limits="codeEditorLimits" unit="px">
          <template #before>
            <code-editor
              ref="codeEditorRef"
              v-model:language="publishDataType"
              v-model="codeEditorData"
              hide-warning
              dense
            >
              <template #header-right>
                <q-btn color="primary" :disable="!canPublish" @click="handlePublishMessage">
                  <q-icon class="tw:mr-2" size="xs" name="fa-solid fa-paper-plane" />
                  Publish
                </q-btn>
              </template>

              <template #between>
                <q-expansion-item dense dense-toggle>
                  <template #header>
                    <q-item-section
                      class="tw:flex tw:flex-row tw:items-center tw:justify-start tw:gap-6"
                    >
                      <q-icon name="fa-solid fa-sliders" size="xs" />
                      <span>Additional publish settings</span>
                    </q-item-section>
                  </template>
                  <div class="tw:flex tw:flex-col tw:gap-3 tw:p-3">
                    <div class="tw:flex tw:items-center tw:gap-4">
                      <q-select
                        v-model="qos"
                        :options="[0, 1, 2]"
                        filled
                        dense
                        label="QoS"
                        class="tw:w-[96px] text-center"
                      />
                      <q-toggle
                        v-model="retain"
                        label="Retain"
                        color="accent"
                        class="tw:select-none"
                      />
                    </div>
                    <template v-if="isMqtt5">
                      <q-input v-model="responseTopic" filled dense label="Response Topic" />
                      <q-input v-model="correlationData" filled dense label="Correlation Data" />
                    </template>
                  </div>
                </q-expansion-item>
              </template>
            </code-editor>
          </template>

          <template #separator>
            <splitter-icon @click:double="codeEditorSplitter = DEFAULT_SPLITTER_HEIGHT" />
          </template>

          <template #after>
            <div class="tw:flex tw:px-4 tw:pt-2 justify-between">
              <div class="tw:flex tw:gap-2 items-center">
                History
                <q-chip size="sm" color="primary" text-color="white">
                  {{ mqttTopicsStore.getSelectedPublishTopicMessages.length }} messages
                </q-chip>
              </div>
              <q-pagination
                v-if="settingsStore.messagesPagination"
                v-model="current"
                size="xs"
                :max="Math.ceil(mqttTopicsStore.getSelectedPublishTopicMessages.length / 5)"
                input
              />
            </div>
            <div class="tw:flex tw:flex-col tw:gap-2 tw:p-3">
              <q-card
                v-for="message in slicedMessages"
                :key="message.uid"
                flat
                class="card-secondary-background tw:cursor-pointer tw:select-none tw:p-2"
                @click="handleMessageClick(message)"
              >
                <div class="tw:mb-2 tw:flex tw:justify-between">
                  <div class="tw:flex tw:max-h-[22px] tw:items-start tw:gap-2">
                    <div>
                      QoS: <span class="tw:font-bold">{{ message.qos }}</span>
                    </div>

                    <q-chip
                      v-if="message.retained"
                      size="sm"
                      color="primary"
                      text-color="white"
                      label="Retained"
                      class="tw:m-0"
                    />
                  </div>
                  <q-btn
                    size="sm"
                    color="secondary"
                    flat
                    round
                    icon="fa-solid fa-right-left"
                    @click.stop="handleConvertToAction(message)"
                  >
                    <q-tooltip class="tw:bg-secondary tw:text-black">
                      Convert into action button
                    </q-tooltip>
                  </q-btn>
                </div>
                <div class="tw:w-full tw:max-w-full tw:overflow-hidden tw:break-all">
                  {{ message.message }}
                </div>
              </q-card>
            </div>
          </template>
        </q-splitter>
      </q-card>
    </q-expansion-item>

    <q-separator />

    <q-expansion-item
      :model-value="publishType === 'action'"
      :disable="sortedActions.length === 0"
      group="publish_type"
      dense
      class="tw:max-h-[calc(100%-32px)] tw:overflow-auto"
      header-class="tw:text-accent"
      @show="togglePublishType('action')"
      @hide="togglePublishType('manual')"
    >
      <template #header>
        <q-item-section class="tw:flex tw:flex-row tw:items-center tw:justify-start tw:gap-6">
          <q-icon name="fa-solid fa-play" size="xs" />
          <span>Actions</span>
        </q-item-section>
      </template>
      <q-separator />
      <q-card class="tw:grid tw:gap-2 tw:p-2">
        <action-card
          v-for="action in sortedActions"
          :key="action.id"
          :action="action"
          :connection-id="mqttTopicsStore.selectedConnection"
          class="tw:dark:bg-neutral-800"
          hide-topic
          edit-only
          no-grab
          @send="handleSendAction"
          @edit="
            () => {
              editAction = action
              actionDialogOpened = true
            }
          "
        />
      </q-card>
    </q-expansion-item>
  </q-list>

  <convert-to-action-dialog
    v-model:opened="convertToActionDialogOpened"
    v-model:connection-id="convertToActionForm.connectionId"
    v-model:group-id="convertToActionForm.groupId"
    v-model:form-title="convertToActionForm.title"
    v-model:form-description="convertToActionForm.description"
    title="Convert to Action"
    action-icon="fa-solid fa-plus"
    action-title="Convert"
    @input="handleConvertToActionDialogInput"
  />

  <action-dialog
    v-model:opened="actionDialogOpened"
    variable-completion
    edit-mode
    :action="editAction"
    @update:action="
      actionsStore.updateAction(mqttTopicsStore.selectedConnection, $event.groupId, $event)
    "
    @close="editAction = undefined"
  />
</template>

<style scoped lang="less"></style>
