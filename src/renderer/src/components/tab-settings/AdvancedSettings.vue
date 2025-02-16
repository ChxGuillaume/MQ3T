<script setup lang="ts">
import UserPropertiesTable from '@renderer/components/tab-settings/UserPropertiesTable.vue'
import { UserProperties } from '../../../../types/mqtt-connection'
import { computed } from 'vue'

const protocolVersion = defineModel('protocolVersion', { type: Number })
const connectTimeout = defineModel('connectTimeout', { type: Number })
const reconnectPeriod = defineModel('reconnectPeriod', { type: Number })
const cleanSession = defineModel('cleanSession', { type: Boolean })

const sessionExpiryInterval = defineModel<number | undefined>('sessionExpiryInterval')
const receiveMaximum = defineModel<number | undefined>('receiveMaximum')
const maximumPacketSize = defineModel<number | undefined>('maximumPacketSize')
const requestResponseInformation = defineModel('requestResponseInformation', { type: Boolean })
const requestProblemInformation = defineModel('requestProblemInformation', { type: Boolean })

const userProperties = defineModel<UserProperties>('userProperties')

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
  ],
  optionalNumber: [
    (v?: number) => typeof v !== 'number' || v >= 0 || 'Value must be greater than or equal to 0'
  ]
}

const selectedProtocolVersion = computed(() => {
  return mqttProtocolVersions.find((o) => o.value === protocolVersion.value)?.label
})
</script>

<template>
  <q-card flat class="tw-grid tw-auto-rows-min tw-gap-2">
    <div class="tw-grid tw-grid-cols-4 tw-gap-4">
      <q-select
        v-model="protocolVersion"
        :options="mqttProtocolVersions"
        filled
        label="Protocol version"
        emit-value
      >
        <template #selected-item>
          {{ selectedProtocolVersion }}
        </template>
      </q-select>
      <q-input
        v-model.number="connectTimeout"
        filled
        label="Connect timeout"
        type="number"
        min="1"
        :rules="advancedSettingsRules.connectTimeout"
      />
      <q-input
        v-model.number="reconnectPeriod"
        filled
        label="Reconnect period"
        type="number"
        min="0"
        :rules="advancedSettingsRules.reconnectPeriod"
      />
      <q-toggle v-model="cleanSession" class="tw-pb-5" label="Clean session" color="primary" />
    </div>
    <div v-if="protocolVersion === 5" class="tw-grid tw-grid-cols-3 tw-gap-4">
      <q-input
        v-model.number="sessionExpiryInterval"
        class="tw-flex-grow"
        filled
        label="Session Expiry Interval"
        type="number"
        min="0"
        suffix="s"
        :rules="advancedSettingsRules.optionalNumber"
      />
      <q-input
        v-model.number="receiveMaximum"
        class="tw-flex-grow"
        filled
        label="Receive Maximum"
        type="number"
        min="0"
        :rules="advancedSettingsRules.optionalNumber"
      />
      <q-input
        v-model.number="maximumPacketSize"
        class="tw-flex-grow"
        filled
        label="Maximum Packet Size"
        type="number"
        min="0"
        :rules="advancedSettingsRules.optionalNumber"
      />
    </div>
    <div v-if="protocolVersion === 5" class="tw-grid tw-grid-cols-2 tw-gap-2">
      <q-toggle
        v-model="requestResponseInformation"
        label="Request Response Information"
        color="primary"
      />
      <q-toggle
        v-model="requestProblemInformation"
        label="Request Problem Information"
        color="primary"
      />
    </div>
    <div v-if="protocolVersion === 5" class="tw-mt-4 tw-grid tw-gap-2">
      <user-properties-table v-model:user-properties="userProperties" />
    </div>
  </q-card>
</template>

<style scoped lang="less"></style>
