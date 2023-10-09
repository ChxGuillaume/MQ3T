<script setup lang="ts">
import { MqttMessage, useMqttTopicsStore } from '../../store/mqtt-topics'
import { ElectronIpc } from '../../../../types/electron-ipc-callbacks'
import CodeEditor, { ICodeEditor } from './CodeEditor.vue'
import { formatCode } from '../../assets/js/format-code'
import { computed, ref } from 'vue'

const codeEditorRef = ref<ICodeEditor | null>(null)

const mqttTopicsStore = useMqttTopicsStore()

const publishDataType = ref('raw')
const codeEditorData = ref('')
const retain = ref(false)
const qos = ref<0 | 1 | 2>(0)
const current = ref(1)

const publishTopic = computed({
  get: () => mqttTopicsStore.selectedPublishTopic,
  set: (value) => {
    mqttTopicsStore.setSelectedPublishTopic(value)
  }
})

const canPublish = computed(() => {
  return publishTopic.value !== '' && mqttTopicsStore.selectedConnection !== ''
})

const slicedMessages = computed(() => {
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
    { retained: retain.value, qos: qos.value }
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
</script>

<template>
  <div class="tw-flex tw-flex-col">
    <q-input v-model="publishTopic" filled label="Topic" dense square />
    <q-separator />
    <div class="tw-my-3 tw-px-3 tw-flex tw-justify-between">
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
      <q-btn color="primary" :disable="publishDataType === 'raw'" @click="handleFormatCode">
        <q-icon class="tw-mr-2" size="xs" name="fa-solid fa-align-left" />
        Format
      </q-btn>
    </div>
  </div>
  <code-editor v-model="codeEditorData" ref="codeEditorRef" :language="publishDataType" />
  <div class="tw-p-3 tw-flex tw-justify-between">
    <div class="tw-flex">
      <q-select v-model="qos" :options="[0, 1, 2]" filled dense label="QoS" class="tw-w-[96px]" />
      <q-toggle v-model="retain" label="Retain" />
    </div>
    <q-btn color="primary" label="Publish" :disable="!canPublish" @click="handlePublishMessage" />
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
          @click.stop="() => {}"
        >
          <q-tooltip>Convert into action button</q-tooltip>
        </q-btn>
      </div>
      <div class="tw-w-full tw-max-w-full tw-break-all tw-overflow-hidden">
        {{ message.message }}
      </div>
    </q-card>
  </div>
</template>

<style scoped lang="less"></style>
