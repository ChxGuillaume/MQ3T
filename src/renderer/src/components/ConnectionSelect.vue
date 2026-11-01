<script setup lang="ts">
import { useMqttConnectionsStore } from '../store/mqtt-connections'
import { statusDotClass } from '../composables/useConnectionStatus'
import { MqttConnection } from '../../../types/mqtt-connection'
import { computed } from 'vue'

const mqttConnectionsStore = useMqttConnectionsStore()

const props = defineProps<{
  modelValue: string
  noRules?: boolean
}>()

const emits = defineEmits<{
  'update:modelValue': [value: string]
}>()

const connectionValue = computed<string>({
  get: () => props.modelValue,
  set: (value) => emits('update:modelValue', value || '')
})

const sortedConnectionsFunc = (a: MqttConnection, b: MqttConnection) => {
  const aStatus = mqttConnectionsStore.getConnectionStatus(a.clientKey)
  const bStatus = mqttConnectionsStore.getConnectionStatus(b.clientKey)

  if (aStatus === 'connected' && bStatus !== 'connected') return -1
  if (aStatus !== 'connected' && bStatus === 'connected') return 1

  return a.name.toLowerCase().localeCompare(b.name.toLowerCase())
}

const items = computed(() =>
  mqttConnectionsStore.connections
    .slice()
    .sort(sortedConnectionsFunc)
    .map((connection) => ({
      label: connection.name,
      value: connection.clientKey,
      dot: statusDotClass(mqttConnectionsStore.getConnectionStatus(connection.clientKey))
    }))
)

const selectedItem = computed(() =>
  items.value.find((item) => item.value === connectionValue.value)
)
</script>

<template>
  <USelectMenu
    v-model="connectionValue"
    :items="items"
    value-key="value"
    placeholder="Connection"
    :search-input="{ placeholder: 'Search connections' }"
  >
    <template #leading>
      <span v-if="selectedItem" class="size-2 rounded-full" :class="selectedItem.dot" />
    </template>
    <template #item-leading="{ item }">
      <span class="size-2 rounded-full" :class="item.dot" />
    </template>
  </USelectMenu>
</template>
