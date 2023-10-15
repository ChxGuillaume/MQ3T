<script setup lang="ts">
import { useMqttTopicsStore } from '../../store/mqtt-topics'
import { computed } from 'vue'

const mqttTopicsStore = useMqttTopicsStore()

const clientKey = computed(() => mqttTopicsStore.selectedConnection)

const formatNumber = (value: string) => {
  if (value === 'Unknown') return value

  return parseInt(value).toLocaleString()
}

const messages_received = computed(() => {
  const topic = mqttTopicsStore.getTopicLastMessage(
    clientKey.value,
    '$SYS/broker/messages/received'
  )

  if (!topic) return 'Unknown'

  return formatNumber(topic.message)
})

const messages_sent = computed(() => {
  const topic = mqttTopicsStore.getTopicLastMessage(clientKey.value, '$SYS/broker/messages/sent')

  if (!topic) return 'Unknown'

  return formatNumber(topic.message)
})

const connected_clients = computed(() => {
  const topic = mqttTopicsStore.getTopicLastMessage(
    clientKey.value,
    '$SYS/broker/clients/connected'
  )

  if (!topic) return 'Unknown'

  return formatNumber(topic.message)
})

const disconnected_clients = computed(() => {
  const topic = mqttTopicsStore.getTopicLastMessage(
    clientKey.value,
    '$SYS/broker/clients/disconnected'
  )

  if (!topic) return 'Unknown'

  return formatNumber(topic.message)
})

const maximum_clients = computed(() => {
  const topic = mqttTopicsStore.getTopicLastMessage(clientKey.value, '$SYS/broker/clients/maximum')

  if (!topic) return 'Unknown'

  return formatNumber(topic.message)
})

const total_clients = computed(() => {
  const topic = mqttTopicsStore.getTopicLastMessage(clientKey.value, '$SYS/broker/clients/total')

  if (!topic) return 'Unknown'

  return formatNumber(topic.message)
})

const subscriptions_count = computed(() => {
  const topic = mqttTopicsStore.getTopicLastMessage(
    clientKey.value,
    '$SYS/broker/subscriptions/count'
  )

  if (!topic) return 'Unknown'

  return formatNumber(topic.message)
})

const uptime = computed(
  () =>
    mqttTopicsStore.getTopicLastMessage(clientKey.value, '$SYS/broker/uptime')?.message || 'Unknown'
)

const version = computed(
  () =>
    mqttTopicsStore.getTopicLastMessage(clientKey.value, '$SYS/broker/version')?.message ||
    'Unknown'
)
</script>

<template>
  <div class="broker-details-panel">
    <h2 class="tw-mb-4 tw-text-xl text-weight-bold">Broker Details</h2>
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
    <div>
      Maximum Clients <span class="color-details">{{ maximum_clients }}</span>
    </div>
    <div>
      Total Clients <span class="color-details">{{ total_clients }}</span>
    </div>
    <q-separator />
    <div>
      Subscriptions Count <span class="color-details">{{ subscriptions_count }}</span>
    </div>
    <q-separator />
    <div>
      Uptime <span class="color-details">{{ uptime }}</span>
    </div>
    <div>
      Broker Version <span class="color-details">{{ version }}</span>
    </div>
  </div>
</template>

<style scoped lang="less">
.broker-details-panel {
  @apply tw-p-4 tw-flex tw-flex-col tw-gap-2;
}

.body--light {
  .broker-details-panel {
    @apply tw-bg-white tw-text-black;
  }
}

.body--dark {
  .broker-details-panel {
    @apply tw-bg-neutral-900 tw-text-white;
  }
}
</style>
