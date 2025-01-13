<script setup lang="ts">
import EMQXDetails from '@renderer/components/tap-topics/broker-details-panels/EMQXDetails.vue'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import { computed } from 'vue'

const mqttTopicsStore = useMqttTopicsStore()

const clientKey = computed(() => mqttTopicsStore.selectedConnection)

const brokers = computed(() => {
  const brokersRaw =
    mqttTopicsStore.getTopicLastMessage(clientKey.value, '$SYS/brokers')?.message || ''

  return brokersRaw.split(',').map((broker) => broker.trim())
})
</script>

<template>
  <div class="tw-grid tw-gap-8">
    <e-m-q-x-details v-for="broker in brokers" :key="broker" :broker="broker" />
  </div>
</template>

<style scoped lang="less"></style>
