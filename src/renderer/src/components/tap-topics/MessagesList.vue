<script setup lang="ts">
import MessagesListMenu from '@renderer/components/tap-topics/MessagesListMenu.vue'
import { MqttMessage, useMqttTopicsStore } from '../../store/mqtt-topics'
import { useSettingsStore } from '../../store/settings-store'
import { computed, nextTick, ref, watch } from 'vue'
import CopyButton from '../buttons/CopyButton.vue'

const mqttTopicsStore = useMqttTopicsStore()
const settingsStore = useSettingsStore()

const props = defineProps<{ selectedMessage?: MqttMessage }>()
const emit = defineEmits<{ 'update:selectedMessage': [uid?: MqttMessage] }>()

const currentPage = ref(1)
const intersectionTransition = ref('slide-up')

const selectedTopic = ref(mqttTopicsStore.selectedTopic)
const selectedTopicWatchTimeout = ref<NodeJS.Timeout | undefined>(undefined)

const slicedMessages = computed(() => {
  if (!settingsStore.messagesPagination)
    return mqttTopicsStore.sortedTopicMessages(
      mqttTopicsStore.selectedConnection,
      selectedTopic.value
    )

  const start = (currentPage.value - 1) * 5
  const end = start + 5

  return mqttTopicsStore
    .sortedTopicMessages(mqttTopicsStore.selectedConnection, selectedTopic.value)
    .slice(start, end)
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
  } catch {
    /* empty */
  }

  return data
}

const formatDuration = (duration: number) => {
  if (duration > -1000) return `${duration} ms`

  return `${(duration / 1000).toFixed(2)} s`
}

watch(
  () => mqttTopicsStore.selectedTopic,
  () => {
    clearTimeout(selectedTopicWatchTimeout.value)
    intersectionTransition.value = 'jump-up'

    nextTick(() => {
      selectedTopic.value = mqttTopicsStore.selectedTopic

      selectedTopicWatchTimeout.value = setTimeout(() => {
        intersectionTransition.value = 'slide-up'
      }, 100)
    })
  }
)
</script>

<template>
  <div class="flex min-h-12 justify-between px-4 pt-2">
    <div class="flex items-center gap-2">
      History
      <q-chip size="sm" color="primary" text-color="white">
        {{ mqttTopicsStore.getSelectedTopicMessages.length }} messages
      </q-chip>
    </div>
    <div class="flex items-center gap-1">
      <q-pagination
        v-if="settingsStore.messagesPagination"
        v-model="currentPage"
        color="accent"
        size="xs"
        :max="Math.ceil(mqttTopicsStore.getSelectedTopicMessages.length / 5)"
        input
      />

      <q-btn round flat size="sm">
        <q-icon name="fa-solid fa-ellipsis-vertical" size="14px" />
        <messages-list-menu />
      </q-btn>
    </div>
  </div>
  <div class="flex flex-col gap-2 overflow-hidden p-3">
    <q-intersection
      v-for="message in slicedMessages"
      :key="message.uid"
      once
      :transition="intersectionTransition"
    >
      <q-card
        flat
        class="card-secondary-background cursor-pointer p-2 outline outline-2 transition-all select-none"
        :class="{
          'outline-transparent': selectedMessage?.uid !== message.uid,
          'outline-primary': selectedMessage?.uid === message.uid
        }"
        @click="handleMessageClick(message)"
      >
        <div class="mb-1 flex justify-between">
          <div>
            <div class="color-details flex h-fit items-center gap-1">
              {{ settingsStore.formatDateTime(message.createdAt) }}
              <span v-if="message.createdDiff" class="text-xs opacity-70">
                ({{ formatDuration(message.createdDiff) }})
              </span>
              <q-icon size="12px" name="fa-solid fa-info-circle" class="ml-1 opacity-70">
                <q-tooltip :offset="[5, 5]">
                  <div>QoS: {{ message.qos }}</div>
                  <div>Retained: {{ message.retained }}</div>
                </q-tooltip>
              </q-icon>
            </div>
          </div>
          <div class="flex">
            <copy-button
              notification-message="Message copied to clipboard"
              @click="copyMessage(message.message)"
            />
          </div>
        </div>
        <div class="line-clamp-4 w-full max-w-full overflow-hidden break-all">
          {{ formatMessage(message.message) }}
        </div>
      </q-card>
    </q-intersection>
  </div>
</template>

<style scoped lang="less"></style>
