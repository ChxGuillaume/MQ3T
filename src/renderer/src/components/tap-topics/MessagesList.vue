<script setup lang="ts">
import { useMqttTopicsStore, MqttMessage } from '../../store/mqtt-topics'
import { useSettingsStore } from '../../store/settings-store'
import CopyButton from '../buttons/CopyButton.vue'
import { computed, ref } from 'vue'

const mqttTopicsStore = useMqttTopicsStore()
const settingsStore = useSettingsStore()

const props = defineProps<{
  selectedMessage?: MqttMessage
}>()

const emit = defineEmits<{
  'update:selectedMessage': [uid?: MqttMessage]
}>()

const currentPage = ref(1)

const slicedMessages = computed(() => {
  if (!settingsStore.messagesPagination) return mqttTopicsStore.sortedSelectedTopicMessages

  const start = (currentPage.value - 1) * 5
  const end = start + 5

  return mqttTopicsStore.sortedSelectedTopicMessages.slice(start, end)
})

const handleMessageClick = (message: MqttMessage) => {
  if (props.selectedMessage?.uid === message.uid) {
    emit('update:selectedMessage', undefined)
  } else {
    emit('update:selectedMessage', message)
  }
}

const copyMessage = (message: string) => {
  navigator.clipboard.writeText(message)
}

const formatMessage = (message: string) => {
  let data = message

  try {
    data = JSON.parse(message)
    data = JSON.stringify(data, null, 4)
  } catch (e) {
    /* empty */
  }

  return data
}

const formatDuration = (duration: number) => {
  if (duration > -1000) return `${duration} ms`

  return `${(duration / 1000).toFixed(2)} s`
}
</script>

<template>
  <div class="tw-px-4 tw-pt-2 tw-flex justify-between">
    <div class="tw-flex items-center tw-gap-2">
      History
      <q-chip size="sm" color="primary" text-color="white">
        {{ mqttTopicsStore.getSelectedTopicMessages.length }} messages
      </q-chip>
    </div>
    <q-pagination
      v-if="settingsStore.messagesPagination"
      v-model="currentPage"
      size="xs"
      :max="Math.ceil(mqttTopicsStore.getSelectedTopicMessages.length / 5)"
      input
    />
  </div>
  <div class="tw-p-3 tw-flex tw-flex-col tw-gap-2">
    <q-card
      v-for="message in slicedMessages"
      :key="message.uid"
      flat
      class="tw-p-2 tw-cursor-pointer tw-select-none tw-bg-primary tw-transition-all"
      :class="{
        'card-secondary-background': selectedMessage?.uid !== message.uid,
        'tw-bg-primary tw-text-white': selectedMessage?.uid === message.uid
      }"
      @click="handleMessageClick(message)"
    >
      <div class="tw-mb-2 tw-flex tw-justify-between">
        <div>
          {{ settingsStore.formatDateTime(message.createdAt) }}
          <span v-if="message.createdDiff" class="tw-text-xs message-details">
            ({{ formatDuration(message.createdDiff) }})
          </span>
        </div>
        <copy-button
          notification-message="Message copied to clipboard"
          @click="copyMessage(message.message)"
        />
      </div>
      <div class="tw-w-full tw-max-w-full tw-break-all tw-overflow-hidden">
        {{ formatMessage(message.message) }}
      </div>
    </q-card>
  </div>
</template>

<style scoped lang="less"></style>
