<script setup lang="ts">
import MosquittoBrokerDetails from '@renderer/components/tap-topics/broker-details-panels/MosquittoBrokerDetails.vue'
import EMQXBrokerDetails from '@renderer/components/tap-topics/broker-details-panels/EMQXBrokerDetails.vue'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import { computed } from 'vue'

const mqttTopicsStore = useMqttTopicsStore()

const clientKey = computed(() => mqttTopicsStore.selectedConnection)

const brokers = computed(
  () => mqttTopicsStore.getTopicLastMessage(clientKey.value, '$SYS/brokers')?.message
)

const version = computed(
  () => mqttTopicsStore.getTopicLastMessage(clientKey.value, '$SYS/broker/version')?.message
)

const brokerType = computed(() => {
  if (brokers.value?.includes('emqx')) return 'EMQX'
  if (version.value?.includes('mosquitto')) return 'Mosquitto'

  return 'Unknown'
})
</script>

<template>
  <div class="broker-details-panel">
    <h2 class="text-weight-bold tw-mb-4 tw-text-xl">Broker Details</h2>
    <mosquitto-broker-details v-if="brokerType === 'Mosquitto'" />
    <e-m-q-x-broker-details v-else-if="brokerType === 'EMQX'" />
    <div v-else class="tw-grid tw-gap-2">
      <p class="tw-italic">Unknown Broker</p>
      <p>
        You are either missing permissions on the $SYS/# topics or the broker is not supported by
        MQ3T yet.
      </p>
      <p>
        Feel free to open an issue on
        <a
          href="https://github.com/ChxGuillaume/MQ3T/issues"
          class="tw-text-accent"
          target="_blank"
        >
          MQ3T Github Repository
        </a>
        with the relevant topics for this feature and broker.
      </p>
    </div>
  </div>
</template>

<style scoped lang="less">
.broker-details-panel {
  @apply tw-flex tw-flex-col tw-gap-2 tw-overflow-auto tw-p-4;
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
