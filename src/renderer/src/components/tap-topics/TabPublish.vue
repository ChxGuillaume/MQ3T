<script setup lang="ts">
import { MqttMessage, useMqttTopicsStore } from '../../store/mqtt-topics'
import ConvertToActionDialog from './dialogs/ConvertToActionDialog.vue'
import { ElectronIpc } from '../../../../types/electron-ipc-callbacks'
import { formatCode, validCode } from '../../assets/js/format-code'
import DataValidBadge from '../tab-actions/DataValidBadge.vue'
import { useSettingsStore } from '../../store/settings-store'
import CodeEditor, { ICodeEditor } from './CodeEditor.vue'
import ActionCard from '../tab-actions/ActionCard.vue'
import { useActionsStore } from '../../store/actions'
import { computed, reactive, ref, watch } from 'vue'

const codeEditorRef = ref<ICodeEditor | null>(null)

const mqttTopicsStore = useMqttTopicsStore()
const settingsStore = useSettingsStore()
const actionsStore = useActionsStore()

const publishType = ref<'manual' | 'action'>('manual')

const publishDataType = ref(settingsStore.defaultDataFormat)
const codeEditorData = ref('')
const retain = ref(false)
const qos = ref<0 | 1 | 2>(0)
const current = ref(1)

const convertToActionDialogOpened = ref(false)
const convertToActionForm = reactive({
  connectionId: '',
  description: '',
  groupId: '',
  title: '',
  message: {} as MqttMessage
})

const publishTopic = computed({
  get: () => mqttTopicsStore.selectedPublishTopic,
  set: (value) => mqttTopicsStore.setSelectedPublishTopic(value)
})

const validDate = computed(() => {
  return validCode(codeEditorData.value, publishDataType.value)
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
  electronApi.sendMqttMessage(
    mqttTopicsStore.selectedConnection,
    publishTopic.value,
    codeEditorData.value,
    { retain: retain.value, qos: qos.value }
  )

  mqttTopicsStore.addPublishMessage(
    mqttTopicsStore.selectedConnection,
    publishTopic.value,
    codeEditorData.value,
    { retained: retain.value, qos: qos.value, dataType: publishDataType.value }
  )
}

const handleMessageClick = (message: MqttMessage) => {
  codeEditorRef.value?.updateCodeEditorValue(message.message)
  retain.value = message.retained
  qos.value = message.qos
}

const handleFormatCode = () => {
  codeEditorRef.value?.updateCodeEditorValue(
    formatCode(codeEditorData.value, publishDataType.value)
  )
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

  return actions.filter((action) => action.topic === publishTopic.value)
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
</script>

<template>
  <div>
    <q-input v-model="publishTopic" filled label="Topic" dense square />
    <q-separator />
  </div>
  <q-list class="tw-h-full tw-max-h-[calc(100%-41px)] tw-overflow-hidden">
    <q-expansion-item
      :model-value="publishType === 'manual'"
      @show="togglePublishType('manual')"
      @hide="togglePublishType('action')"
      group="publish_type"
      label="Manual Publish"
      default-opened
      dense
      class="tw-max-h-[calc(100%-32px)] tw-overflow-auto"
      header-class="tw-text-secondary"
    >
      <q-card class="tw-min-h-[calc(100vh-154px)]">
        <div class="tw-flex tw-flex-col">
          <q-separator />
          <div class="tw-my-3 tw-px-3 tw-flex tw-justify-between tw-items-center">
            <q-card flat bordered class="tw-inline-block">
              <q-btn-toggle
                v-model="publishDataType"
                toggle-color="primary"
                :options="[
                  { label: 'Raw', value: 'raw' },
                  { label: 'JSON', value: 'json' },
                  { label: 'XML', value: 'xml' }
                ]"
              />
            </q-card>
            <data-valid-badge
              v-if="publishDataType !== 'raw'"
              :is-valid="validDate"
              :language="publishDataType"
              size="xs"
            />
            <q-btn color="primary" :disable="publishDataType === 'raw'" @click="handleFormatCode">
              <q-icon class="tw-mr-2" size="xs" name="fa-solid fa-align-left" />
              Format
            </q-btn>
          </div>
        </div>
        <code-editor v-model="codeEditorData" ref="codeEditorRef" :language="publishDataType" />
        <div class="tw-p-3 tw-flex tw-justify-between tw-items-center">
          <div class="tw-flex">
            <q-select
              v-model="qos"
              :options="[0, 1, 2]"
              filled
              dense
              label="QoS"
              class="tw-w-[96px]"
            />
            <q-toggle v-model="retain" label="Retain" />
          </div>
          <q-btn color="primary" :disable="!canPublish" @click="handlePublishMessage">
            <q-icon class="tw-mr-2" size="xs" name="fa-solid fa-paper-plane" />
            Publish
          </q-btn>
        </div>
        <q-separator />
        <div class="tw-px-4 tw-pt-2 tw-flex justify-between">
          <div class="tw-flex items-center tw-gap-2">
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
        <div class="tw-p-3 tw-flex tw-flex-col tw-gap-2">
          <q-card
            v-for="message in slicedMessages"
            :key="message.uid"
            flat
            class="tw-p-2 tw-cursor-pointer tw-select-none card-secondary-background"
            @click="handleMessageClick(message)"
          >
            <div class="tw-mb-2 tw-flex tw-justify-between">
              <div class="tw-max-h-[22px] tw-flex tw-items-start tw-gap-2">
                <div>
                  QoS: <span class="tw-font-bold">{{ message.qos }}</span>
                </div>

                <q-chip
                  v-if="message.retained"
                  size="sm"
                  color="primary"
                  text-color="white"
                  label="Retained"
                  class="tw-m-0"
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
                <q-tooltip class="tw-bg-secondary tw-text-white">
                  Convert into action button
                </q-tooltip>
              </q-btn>
            </div>
            <div class="tw-w-full tw-max-w-full tw-break-all tw-overflow-hidden">
              {{ message.message }}
            </div>
          </q-card>
        </div>
      </q-card>
    </q-expansion-item>

    <q-separator />

    <q-expansion-item
      :model-value="publishType === 'action'"
      :disable="sortedActions.length === 0"
      @show="togglePublishType('action')"
      @hide="togglePublishType('manual')"
      group="publish_type"
      label="Actions"
      dense
      class="tw-max-h-[calc(100%-32px)] tw-overflow-auto"
      header-class="tw-text-secondary"
    >
      <q-separator />
      <q-card class="tw-p-2 tw-grid tw-gap-2">
        <action-card
          v-for="action in sortedActions"
          :key="action.id"
          :action="action"
          no-context-menu
          no-grab
          class="tw-bg-neutral-800"
          @send="actionsStore.sendAction(action)"
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
</template>

<style scoped lang="less"></style>
