<script setup lang="ts">
import { useMqttConnectionsStore } from '../store/mqtt-connections'
import { onMounted, reactive, ref } from 'vue'
import { QDialog, QForm } from 'quasar'
import { v4 as uuidV4 } from 'uuid'

const mqttConnectionsStore = useMqttConnectionsStore()

const addConnectionDialogRef = ref<QDialog | null>(null)
const addConnectionFormRef = ref<QForm | null>(null)

const advancedSettingsExpanded = ref(false)
const showPassword = ref(false)

const defaultForm = {
  name: '',
  protocol: 'mqtt',
  hostname: '',
  port: 1883,
  clientId: `mqtt-workspace_${uuidV4()}`,
  username: '',
  password: ''
}

const form = reactive(Object.assign({}, defaultForm))

const clearForm = () => {
  Object.assign(form, defaultForm)
}

const handleAddConnection = () => {
  if (!addConnectionFormRef.value) return

  addConnectionFormRef.value.validate().then((success: boolean) => {
    if (!addConnectionDialogRef.value) return

    if (success) {
      mqttConnectionsStore.addConnection(Object.assign({}, form))
      addConnectionDialogRef.value.hide()
      clearForm()
    }
  })
}

const handleProtocolChange = (protocol: string) => {
  switch (protocol) {
    case 'mqtt':
      form.port = 1883
      break
    case 'mqtts':
      form.port = 8883
      break
    case 'ws':
      form.port = 8083
      break
    case 'wss':
      form.port = 8084
      break
  }
}

const mqttProtocolOptions = [
  { label: 'mqtt://', value: 'mqtt' },
  { label: 'mqtts://', value: 'mqtts' },
  { label: 'ws://', value: 'ws' },
  { label: 'wss://', value: 'wss' }
]

const rules = {
  name: [(v: string) => !!v || 'Name is required'],
  protocol: [(v: string) => !!v || 'Protocol is required'],
  hostname: [(v: string) => !!v || 'Hostname is required'],
  port: [(v: number) => !!v || 'Port is required'],
  clientId: [(v: string) => !!v || 'Client ID is required']
}

const formatMqttUrl = (connection: any) => {
  return `${connection.protocol}://${connection.hostname}:${connection.port}`
}

onMounted(() => {
  if (mqttConnectionsStore.connections.length === 0) addConnectionDialogRef.value.show()
})
</script>

<template>
  <div class="connections">
    <div class="tw-mb-3 tw-flex tw-justify-between tw-items-center">
      <h1 class="tw-text-xl tw-font-bold">Connections</h1>
      <q-btn color="primary" @click="addConnectionDialogRef.show()"> Add Connection </q-btn>
    </div>

    <div
      class="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 xl:tw-grid-cols-4 tw-gap-4"
    >
      <q-card
        v-for="connection in mqttConnectionsStore.connections"
        flat
        class="tw-p-4"
        :key="connection.name"
      >
        <div class="tw-text-lg tw-flex tw-justify-between">
          <p class="tw-text-ellipsis tw-overflow-hidden tw-line-clamp-1" :title="connection.name">
            {{ connection.name }}
          </p>
          <q-chip size="sm" color="green">Connected</q-chip>
        </div>
        <p
          class="tw-text-sm tw-text-neutral-500 tw-text-ellipsis tw-overflow-hidden tw-line-clamp-1"
          :title="formatMqttUrl(connection)"
        >
          {{ formatMqttUrl(connection) }}
        </p>
        <div class="tw-mt-4 tw-flex tw-justify-end tw-gap-2">
          <q-btn color="white" text-color="black" label="Edit" />
          <q-btn color="primary" label="Connect" />
        </div>
      </q-card>
    </div>

    <q-dialog ref="addConnectionDialogRef" @hide="() => {}">
      <q-card flat style="width: 100%; max-width: 700px">
        <q-card-section>
          <q-form ref="addConnectionFormRef" class="tw-flex tw-flex-col tw-gap-4">
            <div>
              <q-input v-model="form.name" filled label="Name" :rules="rules.name" />
            </div>
            <div class="tw-flex tw-gap-4">
              <q-select
                v-model="form.protocol"
                :options="mqttProtocolOptions"
                class="tw-w-[128px]"
                filled
                label="Protocol"
                emit-value
                :rules="rules.protocol"
                @update:model-value="handleProtocolChange"
              >
                <template v-slot:selected-item>
                  {{ mqttProtocolOptions.find((o) => o.value === form.protocol)?.label }}
                </template>
              </q-select>
              <q-input
                v-model="form.hostname"
                class="tw-flex-grow"
                filled
                label="Hostname"
                :rules="rules.hostname"
                @update:model-value="
                  (val: string) => {
                    if (val.includes(' ')) form.hostname = val.replace(' ', '')
                  }
                "
              />
              <q-input
                v-model.number="form.port"
                class="tw-w-[128px]"
                filled
                label="Port"
                type="number"
                :rules="rules.port"
              />
            </div>
            <div>
              <q-input v-model="form.clientId" filled label="Client ID" :rules="rules.clientId" />
            </div>
            <div class="tw-grid sm:tw-grid-cols-2 tw-gap-4">
              <q-input v-model="form.username" filled label="Username" />
              <q-input
                v-model="form.password"
                filled
                label="Password"
                :type="!showPassword ? 'password' : 'text'"
              >
                <template v-slot:append>
                  <q-icon
                    :name="!showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"
                    class="cursor-pointer"
                    size="xs"
                    @click="showPassword = !showPassword"
                  />
                </template>
              </q-input>
            </div>
            <div>
              <q-expansion-item dense v-model="advancedSettingsExpanded" label="Advanced Settings">
                <q-card>
                  <q-card-section class="tw-px-0">
                    <q-input filled label="CA Certificate" />
                  </q-card-section>
                </q-card>
              </q-expansion-item>
            </div>
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="() => {}" />
          <q-btn color="primary" label="Create" @click="handleAddConnection" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<style scoped lang="less"></style>
