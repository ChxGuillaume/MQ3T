<script setup lang="ts">
import { QDialog, QForm, QPopupProxy, QTableProps } from 'quasar'
import { MqttConnection, MqttTopicSubscription } from '../../../../types/mqtt-connection'
import { v4 as uuidV4 } from 'uuid'
import { ref, watch } from 'vue'

const props = defineProps<{
  dialogOpened: boolean
  dialogType: 'add' | 'edit'
  connection?: MqttConnection
}>()

const emits = defineEmits(['create:connection', 'update:connection', 'update:dialogOpened'])

const addSubscriptionTopicPopupProxyRef = ref<QPopupProxy | null>(null)
const addSubscriptionTopicFormRef = ref<QForm | null>(null)
const settingsCategoryTab = ref('advanced')
const connectionFormRef = ref<QForm | null>(null)
const dialogRef = ref<QDialog | null>(null)

const advancedSettingsExpanded = ref(false)
const subscribedTopicsExpanded = ref(false)
const showPassword = ref(false)

const columns = [
  { name: 'topic', align: 'left', label: 'Topic', field: 'topic' },
  { name: 'qos', align: 'right', label: 'QoS', field: 'qos' },
  { name: 'actions', align: 'right', label: '', field: 'actions' }
] as QTableProps['columns']

const form = ref<MqttConnection>({
  clientKey: `connection-${uuidV4()}`,
  name: '',
  protocol: 'mqtt',
  protocolVersion: 4,
  hostname: '',
  path: '/mqtt',
  port: 1883,
  clientId: `mq3t_${uuidV4()}`,
  username: '',
  password: '',
  subscribedTopics: [
    { topic: '$SYS/#', qos: 0 },
    { topic: '#', qos: 0 }
  ],

  connectTimeout: 30,
  reconnectPeriod: 1
})

const addTopicForm = ref<MqttTopicSubscription>({
  topic: '',
  qos: 0
})

const clearForm = () => {
  form.value.clientKey = `connection-${uuidV4()}`
  form.value.name = ''
  form.value.protocol = 'mqtt'
  form.value.protocolVersion = 4
  form.value.hostname = ''
  form.value.port = 1883
  form.value.clientId = `mq3t_${uuidV4()}`
  form.value.username = ''
  form.value.password = ''
  form.value.subscribedTopics = [
    { topic: '$SYS/#', qos: 0 },
    { topic: '#', qos: 0 }
  ]

  form.value.connectTimeout = 30
  form.value.reconnectPeriod = 1
}

const handleAddTopic = async () => {
  const validForm = await addSubscriptionTopicFormRef.value?.validate()

  if (!validForm) return

  form.value.subscribedTopics.push({
    topic: addTopicForm.value.topic,
    qos: addTopicForm.value.qos
  })

  addSubscriptionTopicPopupProxyRef.value?.hide()
  clearAddTopicForm()
}

const clearAddTopicForm = () => {
  addTopicForm.value.topic = ''
  addTopicForm.value.qos = 0
}

const handleDeleteSubscribedTopic = (index: number) => {
  form.value.subscribedTopics.splice(index, 1)
}

const handleAddConnection = async () => {
  const validForm = await connectionFormRef.value?.validate()

  if (!validForm) return

  emits('create:connection', Object.assign({}, form.value))
  handleCloseForm()
}

const handleUpdateConnection = async () => {
  const validForm = await connectionFormRef.value?.validate()

  if (!validForm) return

  emits('update:connection', Object.assign({}, form.value))
  handleCloseForm()
}

const handleCloseForm = () => {
  dialogRef.value?.hide()

  advancedSettingsExpanded.value = false
  subscribedTopicsExpanded.value = false

  clearForm()
  emits('update:dialogOpened', false)
}

const handleProtocolChange = (protocol: string) => {
  switch (protocol) {
    case 'mqtt':
      form.value.port = 1883
      break
    case 'mqtts':
      form.value.port = 8883
      break
    case 'ws':
      form.value.port = 8083
      break
    case 'wss':
      form.value.port = 8084
      break
  }
}

const mqttProtocolOptions = [
  { label: 'mqtt://', value: 'mqtt' },
  { label: 'mqtts://', value: 'mqtts' },
  { label: 'ws://', value: 'ws' },
  { label: 'wss://', value: 'wss' }
]

const mqttProtocolVersions = [
  { label: 'MQTT 5', value: 5 },
  { label: 'MQTT 3.1.1', value: 4 },
  { label: 'MQTT 3.1', value: 3 }
]

const rules = {
  name: [(v: string) => !!v || 'Name is required'],
  protocol: [(v: string) => !!v || 'Protocol is required'],
  hostname: [(v: string) => !!v || 'Hostname is required'],
  port: [(v: number) => !!v || 'Port is required'],
  clientId: [(v: string) => !!v || 'Client ID is required']
}

const addSubscriptionTopicRules = {
  topic: [(v: string) => !!v || 'Topic is required'],
  qos: [(v: number) => v >= 0 || v <= 2 || 'QoS must be between 0 and 2']
}

watch(
  () => props.dialogOpened && props.connection,
  (value) => {
    if (value) {
      Object.assign(form.value, JSON.parse(JSON.stringify(props.connection)))
    }
  }
)
</script>

<template>
  <q-dialog ref="dialogRef" :model-value="dialogOpened" @hide="handleCloseForm">
    <q-card flat class="dialog-card">
      <q-splitter :model-value="20" disable horizontal>
        <template v-slot:before>
          <q-tabs v-model="settingsCategoryTab" inline-label dense class="text-accent">
            <q-tab name="general" icon="fa-solid fa-list" label="General" />
            <q-tab name="subscriptions" icon="fa-solid fa-message" label="Subscriptions" />
            <q-tab name="advanced" icon="fa-solid fa-gear" label="Advanced" />
            <q-tab name="last-will" icon="fa-solid fa-plug-circle-minus" label="Last will" />
          </q-tabs>
        </template>

        <template v-slot:after>
          <q-tab-panels
            v-model="settingsCategoryTab"
            animated
            vertical
            keep-alive
            transition-prev="jump-right"
            transition-next="jump-left"
          >
            <q-tab-panel name="general" class="tw-overflow-x-hidden">
              <q-form ref="connectionFormRef" class="tw-h-96 tw-flex tw-flex-col tw-gap-4">
                <div>
                  <q-input v-model="form.name" filled label="Name" :rules="rules.name" />
                </div>
                <div class="tw-flex tw-gap-4">
                  <q-select
                    v-model="form.protocol"
                    :options="mqttProtocolOptions"
                    class="tw-w-[112px]"
                    filled
                    label="Protocol"
                    emit-value
                    :rules="rules.protocol"
                    @update:model-value="handleProtocolChange"
                  >
                    <template #selected-item>
                      {{ mqttProtocolOptions.find((o) => o.value === form.protocol)?.label }}
                    </template>
                  </q-select>
                  <q-input
                    v-model="form.hostname"
                    class="tw-flex-grow"
                    filled
                    label="Hostname"
                    :rules="rules.hostname"
                  />
                  <q-input
                    v-model.number="form.port"
                    class="tw-w-[128px]"
                    filled
                    label="Port"
                    type="number"
                    :rules="rules.port"
                  />
                  <transition
                    appear
                    enter-active-class="animated slideInRight"
                    leave-active-class="animated slideOutRight"
                  >
                    <q-input
                      v-if="form.protocol === 'ws' || form.protocol === 'wss'"
                      v-model="form.path"
                      class="tw-w-[128px]"
                      filled
                      label="Path"
                    />
                  </transition>
                </div>
                <div>
                  <q-input
                    v-model="form.clientId"
                    filled
                    label="Client ID"
                    :rules="rules.clientId"
                  />
                </div>
                <div class="tw-grid sm:tw-grid-cols-2 tw-gap-4">
                  <q-input v-model="form.username" filled label="Username" />
                  <q-input
                    v-model="form.password"
                    filled
                    label="Password"
                    :type="!showPassword ? 'password' : 'text'"
                  >
                    <template #append>
                      <q-icon
                        :name="!showPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"
                        class="cursor-pointer"
                        size="xs"
                        @click="showPassword = !showPassword"
                      />
                    </template>
                  </q-input>
                </div>
              </q-form>
            </q-tab-panel>

            <q-tab-panel name="subscriptions">
              <q-card flat class="tw-h-96">
                <q-card flat class="tw-rounded-xl card-secondary-background">
                  <q-table
                    class="tw-bg-transparent"
                    :rows="form.subscribedTopics"
                    :columns="columns"
                    row-key="topic"
                    :rows-per-page-options="[0]"
                    hide-bottom
                    dense
                    flat
                  >
                    <template #bottom-row>
                      <q-tr>
                        <q-td colspan="3" style="padding: 0">
                          <q-btn color="primary" dense class="tw-w-full">
                            <q-icon class="tw-mr-2" size="xs" name="fa-solid fa-plus" />

                            <q-popup-proxy ref="addSubscriptionTopicPopupProxyRef">
                              <q-card>
                                <q-form
                                  ref="addSubscriptionTopicFormRef"
                                  class="tw-p-2 tw-flex tw-gap-2"
                                >
                                  <q-input
                                    v-model="addTopicForm.topic"
                                    autofocus
                                    filled
                                    dense
                                    hide-bottom-space
                                    label="Topic"
                                    class="tw-w-[250px] hide-error-message-slot"
                                    :rules="addSubscriptionTopicRules.topic"
                                    @keydown.enter="handleAddTopic"
                                  />
                                  <q-select
                                    v-model="addTopicForm.qos"
                                    :options="[0, 1, 2]"
                                    filled
                                    dense
                                    hide-bottom-space
                                    label="QoS"
                                    class="tw-w-[100px] hide-error-message-slot"
                                    :rules="addSubscriptionTopicRules.qos"
                                  />
                                  <q-btn
                                    class="tw-h-[40px]"
                                    color="primary"
                                    dense
                                    @click="handleAddTopic"
                                  >
                                    <q-icon class="tw-m-2" size="xs" name="fa-solid fa-plus" />
                                  </q-btn>
                                </q-form>
                              </q-card>
                            </q-popup-proxy>
                          </q-btn>
                        </q-td>
                      </q-tr>
                    </template>
                    <template #body-cell-topic="topicProps">
                      <q-td key="topic" :props="topicProps">
                        <span class="tw-cursor-pointer">{{ topicProps.value }}</span>
                        <q-popup-edit
                          v-slot="scope"
                          v-model="form.subscribedTopics[topicProps.rowIndex].topic"
                          auto-save
                        >
                          <q-input
                            v-model="scope.value"
                            autofocus
                            filled
                            dense
                            @keyup.enter="scope.set"
                          />
                        </q-popup-edit>
                      </q-td>
                    </template>
                    <template #body-cell-qos="qosProps">
                      <q-td key="qos" :props="qosProps" class="tw-text-end">
                        <q-badge
                          class="tw-cursor-pointer"
                          color="primary"
                          text-color="white"
                          :label="qosProps.value"
                        />
                        <q-popup-edit
                          v-slot="scope"
                          v-model="form.subscribedTopics[qosProps.rowIndex].qos"
                          auto-save
                        >
                          <q-select
                            v-model="scope.value"
                            :options="[0, 1, 2]"
                            autofocus
                            filled
                            dense
                          />
                        </q-popup-edit>
                      </q-td>
                    </template>
                    <template #body-cell-actions="itemProps">
                      <q-td auto-width class="tw-text-end">
                        <q-btn
                          color="red"
                          round
                          flat
                          size="xs"
                          icon="fa-solid fa-trash"
                          @click="handleDeleteSubscribedTopic(itemProps.rowIndex)"
                        />
                      </q-td>
                    </template>
                  </q-table>
                </q-card>
              </q-card>
            </q-tab-panel>

            <q-tab-panel name="advanced">
              <q-card flat class="tw-h-96">
                <div class="tw-flex tw-gap-4">
                  <q-select
                    v-model="form.protocolVersion"
                    :options="mqttProtocolVersions"
                    class="tw-min-w-[200px] tw-flex-grow"
                    filled
                    label="Protocol version"
                    emit-value
                  >
                    <template #selected-item>
                      {{
                        mqttProtocolVersions.find((o) => o.value === form.protocolVersion)?.label
                      }}
                    </template>
                  </q-select>
                  <q-input
                    v-model.number="form.connectTimeout"
                    class="tw-flex-grow"
                    filled
                    label="Connect timeout"
                    type="number"
                    min="1"
                  />
                  <q-input
                    v-model.number="form.reconnectPeriod"
                    class="tw-flex-grow"
                    filled
                    label="Reconnect period"
                    type="number"
                    min="0"
                  />
                </div>
              </q-card>
            </q-tab-panel>

            <q-tab-panel name="last-will">
              <q-card flat class="tw-h-96"></q-card>
            </q-tab-panel>
          </q-tab-panels>
        </template>
      </q-splitter>

      <q-card-actions align="right">
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

<style scoped lang="less">
.dialog-card {
  width: 100%;
  min-width: 750px;
}
</style>
