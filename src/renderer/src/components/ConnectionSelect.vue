<script setup lang="ts">
import { useMqttConnectionsStore } from '../store/mqtt-connections'
import ConnectionStatusChip from './ConnectionStatusChip.vue'
import { computed } from 'vue'

const mqttConnectionsStore = useMqttConnectionsStore()

const props = defineProps<{
  modelValue: string
  noRules?: boolean
}>()

const emits = defineEmits<{
  'update:modelValue': [value: string]
}>()

const rules = computed(() => {
  if (props.noRules) return []
  return [(v: string) => !!v || 'Connection is required']
})

const connectionValue = computed<string>({
  get: () => props.modelValue,
  set: (value) => emits('update:modelValue', value)
})

const selectedConnection = computed(() => {
  return mqttConnectionsStore.getConnection(connectionValue.value)
})

const selectedConnectionStatus = computed(() => {
  return mqttConnectionsStore.getConnectionStatus(connectionValue.value)
})
</script>

<template>
  <q-select
    v-model="connectionValue"
    :options="mqttConnectionsStore.connections"
    option-value="clientKey"
    option-label="name"
    emit-value
    filled
    square
    label="Connection"
    :rules="rules"
  >
    <template #selected-item>
      <div class="tw-w-full tw-flex tw-justify-between tw-items-center tw-gap-2">
        <span class="tw-line-clamp-1">{{ selectedConnection?.name }}</span>
        <connection-status-chip
          v-if="selectedConnection?.clientKey"
          :connection-status="selectedConnectionStatus"
          size="xs"
        />
      </div>
    </template>

    <template #option="{ itemProps, opt }">
      <q-item v-bind="itemProps">
        <q-item-section>
          <div class="tw-flex tw-justify-between tw-items-center tw-gap-2">
            <span class="tw-line-clamp-1">{{ opt.name }}</span>
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
