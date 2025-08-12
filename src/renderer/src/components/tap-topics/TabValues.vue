<script setup lang="ts">
import CodeDiffPreview from '@renderer/components/tap-topics/CodeDiffPreview.vue'
import { MqttMessage, useMqttTopicsStore } from '../../store/mqtt-topics'
import { ElectronIpc } from '../../../../types/electron-ipc-callbacks'
import { useSettingsStore } from '../../store/settings-store'
import CopyContextMenu from '../CopyContextMenu.vue'
import EraseButton from '../buttons/EraseButton.vue'
import CopyButton from '../buttons/CopyButton.vue'
import SplitterIcon from '../SplitterIcon.vue'
import MessagesList from './MessagesList.vue'
import CodePreview from './CodePreview.vue'
import { computed, ref, watch } from 'vue'
import { useQuasar } from 'quasar'

const electronApi = window.api as ElectronIpc

const $q = useQuasar()

const mqttTopicsStore = useMqttTopicsStore()
const settingsStore = useSettingsStore()

const codePreviewSplitter = ref(200)
const codePreviewLimits = ref([100, 400])

const selectedMessageCodePreviewSplitter = ref(0)
const selectedCodePreviewLimits = ref([100, 400])
const selectedMessage = ref<MqttMessage>()

const breadcrumbs = computed(() => {
  return mqttTopicsStore.selectedTopic.split('/')
})

const selectedTopicLastMessage = computed(() => {
  return mqttTopicsStore.getSelectedTopicLastMessage
})

const handleBreadcrumbClick = (index: number) => {
  mqttTopicsStore.setSelectedTopic(
    mqttTopicsStore.selectedConnection,
    breadcrumbs.value.slice(0, index + 1).join('/')
  )
}

const handleBreadcrumbCopyPart = (part: string) => {
  navigator.clipboard.writeText(part)

  $q.notify({
    message: 'Topic key copied to clipboard',
    icon: 'fa-solid fa-clipboard',
    color: 'positive',
    timeout: 1000
  })
}

const handleEraseTopic = () => {
  mqttTopicsStore.clearTopicsAndSubTopicsMessages(
    mqttTopicsStore.selectedConnection,
    mqttTopicsStore.selectedTopic
  )
}

const handleClearRetained = () => {
  electronApi.sendMqttMessage(
    mqttTopicsStore.selectedConnection,
    mqttTopicsStore.selectedTopic,
    '',
    { retain: true, qos: 0 }
  )

  mqttTopicsStore.addPublishMessage(
    mqttTopicsStore.selectedConnection,
    mqttTopicsStore.selectedTopic,
    '',
    { retained: true, qos: 0 }
  )
}

const copySelectedTopic = () => {
  navigator.clipboard.writeText(mqttTopicsStore.selectedTopic)
}

const copySelectedTopicMessage = () => {
  navigator.clipboard.writeText(selectedTopicLastMessage.value?.message || '')
}

watch(
  () => mqttTopicsStore.selectedTopic,
  () => {
    selectedMessage.value = undefined
  }
)

watch(
  () => selectedMessage.value,
  (newValue) => {
    if (newValue) {
      selectedCodePreviewLimits.value = [100, 400]
      selectedMessageCodePreviewSplitter.value = 200
    } else {
      selectedCodePreviewLimits.value = [0, 0]
      selectedMessageCodePreviewSplitter.value = 0
    }
  }
)
</script>

<template>
  <div class="tw-flex tw-flex-col tw-gap-1 tw-p-4">
    <div class="tw-flex tw-gap-2">
      <h2 class="tw-text-xl tw-font-bold">Topic</h2>
      <copy-button notification-message="Topic copied to clipboard" @click="copySelectedTopic" />
      <erase-button @click="handleEraseTopic" />
    </div>
    <div class="tw-flex tw-min-h-[28px] tw-items-center">
      <span v-if="!breadcrumbs.length">No Topic Selected</span>
      <q-breadcrumbs v-else gutter="none">
        <q-breadcrumbs-el v-for="(topicPart, index) in breadcrumbs" :key="index">
          <q-chip
            size="sm"
            color="primary"
            :text-color="topicPart ? 'white' : 'grey-6'"
            square
            ripple
            clickable
            :label="topicPart ? topicPart : '<\empty>'"
            @click="handleBreadcrumbClick(index)"
          >
            <copy-context-menu
              anchor="bottom left"
              self="top left"
              @copy="handleBreadcrumbCopyPart(topicPart)"
            />
          </q-chip>
        </q-breadcrumbs-el>
      </q-breadcrumbs>
    </div>
  </div>
  <q-separator />
  <div class="tw-overflow-auto">
    <div v-if="selectedTopicLastMessage">
      <div class="justify-between tw-flex tw-p-4">
        <div>
          QoS: {{ selectedTopicLastMessage?.qos || 0 }}
          <copy-button
            notification-message="Last topic message copied to clipboard"
            @click="copySelectedTopicMessage"
          />
        </div>
        <div v-if="selectedTopicLastMessage?.retained">
          <q-chip
            size="sm"
            class="text-weight-bold"
            color="primary"
            text-color="white"
            icon-right="fa-solid fa-xmark"
            square
            clickable
            label="Retained"
            @click="handleClearRetained"
          />
        </div>
        <div class="items-end tw-flex tw-flex-col">
          <div>
            {{
              selectedTopicLastMessage?.createdAt &&
              settingsStore.formatDate(selectedTopicLastMessage?.createdAt)
            }}
          </div>
          <div>
            {{
              selectedTopicLastMessage?.createdAt &&
              settingsStore.formatTime(selectedTopicLastMessage?.createdAt)
            }}
          </div>
        </div>
      </div>
      <q-splitter v-model="codePreviewSplitter" horizontal :limits="codePreviewLimits" unit="px">
        <template #before>
          <code-preview
            :value="mqttTopicsStore.getSelectedTopicLastMessage?.message || ''"
            :language="mqttTopicsStore.getSelectedTopicLastMessage?.dataType"
          />
        </template>

        <template #separator>
          <splitter-icon @click:double="codePreviewSplitter = 200" />
        </template>

        <template #after>
          <q-splitter
            v-model="selectedMessageCodePreviewSplitter"
            :limits="selectedCodePreviewLimits"
            :disable="!selectedMessage"
            horizontal
            unit="px"
          >
            <template v-if="selectedMessage" #before>
              <code-preview
                v-if="selectedMessage && !settingsStore.selectedMessageCompare"
                :value="selectedMessage?.message || ''"
                :language="selectedMessage?.dataType"
                hide-top-border
              />
              <code-diff-preview
                v-else-if="selectedMessage && settingsStore.selectedMessageCompare"
                :value="selectedMessage?.message || ''"
                :modified-value="mqttTopicsStore.getSelectedTopicLastMessage?.message || ''"
                :language="selectedMessage?.dataType"
                hide-top-border
              />
            </template>

            <template #separator>
              <splitter-icon
                v-if="selectedMessage"
                @click:double="selectedMessageCodePreviewSplitter = 200"
              />
            </template>

            <template #after>
              <messages-list v-model:selected-message="selectedMessage" />
            </template>
          </q-splitter>
        </template>
      </q-splitter>
    </div>
    <div
      v-else
      class="tw-flex tw-h-full tw-items-center tw-justify-center tw-text-2xl tw-font-bold"
    >
      No Messages
    </div>
  </div>
</template>

<style scoped lang="less">
.body--light {
  .message-details {
    @apply tw-text-neutral-500;
  }
}

.body--dark {
  .message-details {
    @apply tw-text-neutral-400;
  }
}
</style>
