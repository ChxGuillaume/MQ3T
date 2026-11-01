<script setup lang="ts">
import { useMqttConnectionsStore } from '../store/mqtt-connections'
import { MqttConnection } from '../../../types/mqtt-connection'
import ConnectionStatusChip from './ConnectionStatusChip.vue'
import { computed, ref } from 'vue'

const mqttConnectionsStore = useMqttConnectionsStore()

const props = defineProps<{
  modelValue: string
  noRules?: boolean
}>()

const emits = defineEmits<{
  'update:modelValue': [value: string]
}>()

const selectFocused = ref(false)

const rules = computed(() => {
  if (props.noRules) return []
  return [(v: string) => !!v || 'Connection is required']
})

const connectionValue = computed<string>({
  get: () => props.modelValue,
  set: (value) => emits('update:modelValue', value || '')
})

const selectedConnection = computed(() => {
  return mqttConnectionsStore.getConnection(connectionValue.value)
})

const selectedConnectionStatus = computed(() => {
  return mqttConnectionsStore.getConnectionStatus(connectionValue.value)
})

const sortedConnectionsFunc = (a: MqttConnection, b: MqttConnection) => {
  const aStatus = mqttConnectionsStore.getConnectionStatus(a.clientKey)
  const bStatus = mqttConnectionsStore.getConnectionStatus(b.clientKey)

  if (aStatus === 'connected' && bStatus !== 'connected') return -1
  if (aStatus !== 'connected' && bStatus === 'connected') return 1

  const aName = a.name.toLowerCase()
  const bName = b.name.toLowerCase()

  if (aName < bName) return -1
  if (aName > bName) return 1

  return 0
}

const sortedConnections = computed(() =>
  mqttConnectionsStore.connections.slice().sort(sortedConnectionsFunc)
)
const sortedConnectionsFiltered = ref(sortedConnections.value)

const handleFilterConnections = (val: string, update: (cbFn: () => void) => void) => {
  update(() => {
    if (!val) {
      sortedConnectionsFiltered.value = sortedConnections.value
      return
    }

    const name = val.toLowerCase()

    sortedConnectionsFiltered.value = sortedConnections.value.filter((c) => {
      return c.name.toLowerCase().includes(name)
    })
  })
}
</script>

<template>
  <q-select
    v-model="connectionValue"
    :options="sortedConnectionsFiltered"
    class="max-h-[56px] overflow-hidden"
    option-value="clientKey"
    option-label="name"
    emit-value
    filled
    square
    use-input
    input-debounce="0"
    label="Connection"
    :rules="rules"
    @blur="selectFocused = false"
    @focus="selectFocused = true"
    @filter="handleFilterConnections"
  >
    <template #selected>
      <div
        class="flex items-center justify-between gap-2"
        :class="{ 'w-full': !selectFocused, 'max-w-[250px]': selectFocused }"
      >
        <span class="line-clamp-1 break-all">{{ selectedConnection?.name }}</span>
        <connection-status-chip
          v-if="selectedConnection?.clientKey && !selectFocused"
          :connection-status="selectedConnectionStatus"
          size="xs"
        />
      </div>
    </template>

    <template #option="{ itemProps, opt }">
      <q-item v-bind="itemProps">
        <q-item-section>
          <div class="flex items-center justify-between gap-2">
            <span class="line-clamp-1 break-all">{{ opt.name }}</span>
            <connection-status-chip
              :connection-status="mqttConnectionsStore.getConnectionStatus(opt.clientKey)"
              size="xs"
            />
          </div>
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<style scoped lang="less"></style>
