<script setup lang="ts">
import { MqttConnection } from '../../../../types/mqtt-connection'
import { reactive, ref, watch } from 'vue'
import { QDialog, QForm } from 'quasar'
import { v4 as uuidV4 } from 'uuid'

const props = defineProps<{
  dialogOpened: boolean
  dialogType: 'add' | 'edit'
  connection?: MqttConnection
}>()

const emits = defineEmits([
  'create:connection',
  'update:connection',
  'delete:connection',
  'update:dialogOpened'
])

const addConnectionDialogRef = ref<QDialog | null>(null)
const addConnectionFormRef = ref<QForm | null>(null)

const advancedSettingsExpanded = ref(false)
const showPassword = ref(false)

const form = reactive<MqttConnection>({
  clientKey: `connection-${uuidV4()}`,
  name: '',
  protocol: 'mqtt',
  hostname: '',
  port: 1883,
  clientId: `mqtt-workspace_${uuidV4()}`,
  username: '',
  password: ''
})

const clearForm = () => {
  form.clientKey = `connection-${uuidV4()}`
  form.name = ''
  form.protocol = 'mqtt'
  form.hostname = ''
  form.port = 1883
  form.clientId = `mqtt-workspace_${uuidV4()}`
  form.username = ''
  form.password = ''
}

const handleAddConnection = () => {
  addConnectionFormRef.value?.validate().then((success: boolean) => {
    if (success) {
      emits('create:connection', Object.assign({}, form))
      addConnectionDialogRef.value?.hide()
      clearForm()
    }
  })
}

const handleUpdateConnection = () => {
  addConnectionFormRef.value?.validate().then((success: boolean) => {
    if (success) {
      emits('update:connection', Object.assign({}, form))
      addConnectionDialogRef.value?.hide()
      clearForm()
    }
  })
}

const handleDeleteConnection = () => {
  emits('delete:connection', Object.assign({}, form))
  addConnectionDialogRef.value?.hide()
  clearForm()
}

const handleCloseForm = () => {
  addConnectionDialogRef.value?.hide()
  clearForm()
  emits('update:dialogOpened', false)
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

watch(
  () => props.dialogOpened,
  (value) => {
    if (value) {
      addConnectionDialogRef.value?.show()
    } else {
      addConnectionDialogRef.value?.hide()
    }
  }
)

watch(
  () => props.dialogOpened && props.connection,
  (value) => {
    if (value) {
      form.clientKey = value.clientKey
      form.name = value.name
      form.protocol = value.protocol
      form.hostname = value.hostname
      form.port = value.port
      form.clientId = value.clientId
      form.username = value.username
      form.password = value.password
    }
  }
)
</script>

<template>
  <q-dialog ref="addConnectionDialogRef" @hide="handleCloseForm">
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
                (val) => {
                  form.hostname = `${val}`.replace(/[^a-zA-Z0-9.]*/g, '')
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
                  <!--                  <q-input filled label="CA Certificate" />-->
                </q-card-section>
              </q-card>
            </q-expansion-item>
          </div>
        </q-form>
      </q-card-section>

      <q-card-actions :align="dialogType === 'edit' ? 'between' : 'right'">
        <q-btn v-if="dialogType === 'edit'" color="red" @click="handleDeleteConnection">
          <q-icon class="tw-mr-2" size="xs" name="fa-solid fa-trash" />
          Delete
        </q-btn>
        <div class="tw-flex tw-gap-2">
          <q-btn flat label="Cancel" @click="handleCloseForm" />
          <q-btn v-if="dialogType === 'add'" color="primary" @click="handleAddConnection">
            <q-icon class="tw-mr-2" size="xs" name="fa-solid fa-plus" />
            Create
          </q-btn>
          <q-btn v-else color="primary" @click="handleUpdateConnection">
            <q-icon class="tw-mr-2" size="xs" name="fa-solid fa-save" />
            Update
          </q-btn>
        </div>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="less"></style>
