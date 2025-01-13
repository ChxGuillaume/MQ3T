<script setup lang="ts">
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import { computed } from 'vue'

const mqttTopicsStore = useMqttTopicsStore()

const clientKey = computed(() => mqttTopicsStore.selectedConnection)

const props = defineProps<{
  broker: string
}>()

const messages_received = computed(() => {
  const topic = mqttTopicsStore.getTopicLastMessage(
    clientKey.value,
    `$SYS/brokers/${props.broker}/metrics/messages/received`
  )

  if (!topic) return 'Unknown'

  return parseInt(topic.message)
})

const messages_sent = computed(() => {
  const topic = mqttTopicsStore.getTopicLastMessage(
    clientKey.value,
    `$SYS/brokers/${props.broker}/metrics/messages/sent`
  )

  if (!topic) return 'Unknown'

  return parseInt(topic.message)
})

const connected_clients = computed(() => {
  const topic = mqttTopicsStore.getTopicLastMessage(
    clientKey.value,
    `$SYS/brokers/${props.broker}/metrics/client/connected`
  )

  if (!topic) return 'Unknown'

  return parseInt(topic.message)
})

const disconnected_clients = computed(() => {
  const topic = mqttTopicsStore.getTopicLastMessage(
    clientKey.value,
    `$SYS/brokers/${props.broker}/metrics/client/disconnected`
  )

  if (!topic) return 'Unknown'

  return parseInt(topic.message)
})

const subscriptions_count = computed(() => {
  const topic = mqttTopicsStore.getTopicLastMessage(
    clientKey.value,
    `$SYS/brokers/${props.broker}/stats/subscribers/count`
  )

  if (!topic) return 'Unknown'

  return parseInt(topic.message)
})

const uptime = computed(() => {
  const topic = mqttTopicsStore.getTopicLastMessage(
    clientKey.value,
    `$SYS/brokers/${props.broker}/uptime`
  )

  if (!topic) return 0

  return parseInt(topic.message) / 1000
})

const version = computed(() => {
  const topic = mqttTopicsStore.getTopicLastMessage(
    clientKey.value,
    `$SYS/brokers/${props.broker}/version`
  )

  if (!topic) return 'Unknown'

  return topic.message
})
</script>

<template>
  <div class="tw-flex tw-flex-col tw-gap-2">
    <h3 class="text-weight-bold tw-text-lg">{{ broker }}</h3>
    <div>
      Messages Received <span class="color-details">{{ messages_received }}</span>
    </div>
    <div>
      Messages Sent <span class="color-details">{{ messages_sent }}</span>
    </div>
    <q-separator />
    <div>
      Connected Clients <span class="color-details">{{ connected_clients }}</span>
    </div>
    <div>
      Disconnected Clients <span class="color-details">{{ disconnected_clients }}</span>
    </div>
    <q-separator />
    <div>
      Subscriptions Count <span class="color-details">{{ subscriptions_count }}</span>
    </div>
    <q-separator />
    <div>
      Uptime <span class="color-details">{{ uptime.toFixed(2) }} seconds</span>
    </div>
    <div>
      Broker Version <span class="color-details">{{ version }}</span>
    </div>
  </div>
</template>

<style scoped lang="less"></style>
