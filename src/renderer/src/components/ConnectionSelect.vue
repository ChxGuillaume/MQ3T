<script setup lang="ts" generic="T extends string | string[]">
import { useMqttConnectionsStore } from '../store/mqtt-connections'
import { statusDotClass } from '../composables/useConnectionStatus'
import { MqttConnection } from '../../../types/mqtt-connection'
import { computed } from 'vue'

const mqttConnectionsStore = useMqttConnectionsStore()

const props = defineProps<{
  modelValue: T
  noRules?: boolean
  multiple?: boolean
  exclude?: string[]
}>()

const emits = defineEmits<{
  'update:modelValue': [value: T]
}>()

const connectionValue = computed<T>({
  get: () => props.modelValue,
  set: (value) => emits('update:modelValue', (value || (props.multiple ? [] : '')) as T)
})

const sortedConnectionsFunc = (a: MqttConnection, b: MqttConnection) => {
  const aStatus = mqttConnectionsStore.getConnectionStatus(a.clientKey)
  const bStatus = mqttConnectionsStore.getConnectionStatus(b.clientKey)

  if (aStatus === 'connected' && bStatus !== 'connected') return -1
  if (aStatus !== 'connected' && bStatus === 'connected') return 1

  return a.name.toLowerCase().localeCompare(b.name.toLowerCase())
}

const items = computed(() =>
  mqttConnectionsStore.savedConnections
    .filter((connection) => !props.exclude?.includes(connection.clientKey))
    .sort(sortedConnectionsFunc)
    .map((connection) => ({
      label: connection.name,
      value: connection.clientKey,
      dot: statusDotClass(mqttConnectionsStore.getConnectionStatus(connection.clientKey))
    }))
)

const selectedItem = computed(() =>
  props.multiple ? undefined : items.value.find((item) => item.value === connectionValue.value)
)
</script>

<template>
  <USelectMenu
    v-model="connectionValue"
    :items="items"
    :multiple="multiple"
    value-key="value"
    :placeholder="multiple ? 'Connections' : 'Connection'"
    :search-input="{ placeholder: 'Search connections' }"
  >
    <template v-if="selectedItem" #leading>
      <span class="size-2 rounded-full" :class="selectedItem.dot" />
    </template>
    <template #item-leading="{ item }">
      <span class="size-2 shrink-0 self-center rounded-full" :class="item.dot" />
    </template>
  </USelectMenu>
</template>
