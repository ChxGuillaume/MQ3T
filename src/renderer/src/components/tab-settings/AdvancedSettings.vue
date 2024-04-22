<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  protocolVersion?: number
  connectTimeout?: number
  reconnectPeriod?: number
}>()

defineEmits(['update:protocolVersion', 'update:connectTimeout', 'update:reconnectPeriod'])

const mqttProtocolVersions = [
  { label: 'MQTT 5', value: 5 },
  { label: 'MQTT 3.1.1', value: 4 },
  { label: 'MQTT 3.1', value: 3 }
]

const advancedSettingsRules = {
  connectTimeout: [
    (v: number) => !!v || 'Connect timeout is required',
    (v: number) => v > 0 || 'Connect timeout must be greater than 0'
  ],
  reconnectPeriod: [
    (v: number) => !!v || 'Reconnect period is required',
    (v: number) => v >= 0 || 'Reconnect period must be greater than or equal to 0'
  ]
}

const selectedProtocolVersion = computed(() => {
  return mqttProtocolVersions.find((o) => o.value === props.protocolVersion)?.label
})
</script>

<template>
  <q-card flat>
    <div class="tw-flex tw-gap-4">
      <q-select
        :model-value="protocolVersion"
        :options="mqttProtocolVersions"
        class="tw-min-w-[200px] tw-flex-grow"
        filled
        label="Protocol version"
        emit-value
        @update:model-value="$emit('update:protocolVersion', $event)"
      >
        <template #selected-item>
          {{ selectedProtocolVersion }}
        </template>
      </q-select>
      <q-input
        :model-value.number="connectTimeout"
        class="tw-flex-grow"
        filled
        label="Connect timeout"
        type="number"
        min="1"
        :rules="advancedSettingsRules.connectTimeout"
        @update:model-value="$emit('update:connectTimeout', $event)"
      />
      <q-input
        :model-value.number="reconnectPeriod"
        class="tw-flex-grow"
        filled
        label="Reconnect period"
        type="number"
        min="0"
        :rules="advancedSettingsRules.reconnectPeriod"
        @update:model-value="$emit('update:reconnectPeriod', $event)"
      />
    </div>
  </q-card>
</template>

<style scoped lang="less"></style>
