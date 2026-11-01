<script setup lang="ts">
import ConnectionAdvancedSettings from '@renderer/components/connections/ConnectionAdvancedSettings.vue'
import SegmentedControl, { SegmentedItem } from '@renderer/components/ui/SegmentedControl.vue'
import { MqttConnection, MqttTopicSubscription } from '../../../../types/mqtt-connection'
import { useConnectionActions } from '@renderer/composables/useConnectionActions'
import { protocolVersionLabel } from '@renderer/composables/useConnectionStatus'
import { useMqttConnectionsStore } from '@renderer/store/mqtt-connections'
import { useAppNavigation } from '@renderer/composables/useAppNavigation'
import { useLabelColors } from '@renderer/composables/useLabelColors'
import { ElectronApi } from '@renderer/assets/js/electron-api'
import { useMqttUrl } from '@renderer/composables/useMqttUrl'
import { useAppStore } from '@renderer/store/app-store'
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from 'vue'
import type { FormError } from '@nuxt/ui'
import { useToast } from '@nuxt/ui/composables'
import { v4 as uuidV4 } from 'uuid'

type ConnectionForm = Required<MqttConnection>
type SectionId = 'general' | 'subs' | 'will' | 'adv'

const mqttConnectionsStore = useMqttConnectionsStore()
const appStore = useAppStore()
const toast = useToast()

const { colors, getColor, setCustomLabel } = useLabelColors()
const { openConnection } = useAppNavigation()
const { reconnect } = useConnectionActions()
const { formatMqttUrl } = useMqttUrl()

const formRef = useTemplateRef('formRef')
const scrollRef = useTemplateRef<HTMLElement>('scrollRef')

const emptyLastWill = (): ConnectionForm['lastWill'] => ({
  topic: '',
  qos: 0,
  retain: false,
  payload: ''
})

const defaultConnection = (): ConnectionForm => ({
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
  reconnectPeriod: 1,
  clean: true,
  properties: {
    requestResponseInformation: false,
    requestProblemInformation: false,
    userProperties: []
  },
  lastWill: emptyLastWill(),
  labelColor: null
})

const form = ref<ConnectionForm>(defaultConnection())
const willEnabled = ref(false)
const advancedOpened = ref(false)
const showPassword = ref(false)
const testing = ref(false)
const saving = ref(false)
const activeSection = ref<SectionId>('general')
const labelNameDraft = ref('')

const isNew = computed(() => appStore.editingClientKey === null)

const title = computed(() => {
  if (form.value.name.trim()) return form.value.name
  return isNew.value ? 'New connection' : 'Edit connection'
})

const load = () => {
  const existing = appStore.editingClientKey
    ? mqttConnectionsStore.getConnection(appStore.editingClientKey)
    : undefined

  const base = defaultConnection()

  if (!existing) {
    form.value = base
    willEnabled.value = false
    return
  }

  const copy = JSON.parse(JSON.stringify(existing)) as MqttConnection

  form.value = {
    ...base,
    ...copy,
    username: copy.username ?? '',
    password: copy.password ?? '',
    protocolVersion: copy.protocolVersion ?? 4,
    connectTimeout: copy.connectTimeout ?? 30,
    reconnectPeriod: copy.reconnectPeriod ?? 1,
    clean: copy.clean ?? true,
    properties: { ...base.properties, ...copy.properties },
    lastWill: copy.lastWill ?? emptyLastWill(),
    labelColor: copy.labelColor ?? null
  }
  willEnabled.value = !!copy.lastWill?.topic
}

watch(() => appStore.editingClientKey, load, { immediate: true })

const sections: { id: SectionId; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'subs', label: 'Subscriptions' },
  { id: 'will', label: 'Last will' },
  { id: 'adv', label: 'Advanced' }
]

const scrollToSection = (id: SectionId) => {
  activeSection.value = id
  document.getElementById(`connection-${id}`)?.scrollIntoView({ behavior: 'smooth' })
}

const handleScroll = () => {
  const container = scrollRef.value
  if (!container) return

  const top = container.getBoundingClientRect().top + 80

  for (const section of [...sections].reverse()) {
    const el = document.getElementById(`connection-${section.id}`)
    if (el && el.getBoundingClientRect().top <= top) {
      activeSection.value = section.id
      return
    }
  }

  activeSection.value = 'general'
}

onMounted(async () => {
  const anchor = appStore.editorAnchor as SectionId | null
  if (!anchor) return

  await nextTick()
  scrollToSection(anchor)
})

const protocolItems: SegmentedItem<ConnectionForm['protocol']>[] = [
  { label: 'mqtt', value: 'mqtt' },
  { label: 'mqtts', value: 'mqtts' },
  { label: 'ws', value: 'ws' },
  { label: 'wss', value: 'wss' }
]

const versionItems: SegmentedItem<3 | 4 | 5>[] = [
  { label: '3.1', value: 3 },
  { label: '3.1.1', value: 4 },
  { label: '5.0', value: 5 }
]

const qosItems: SegmentedItem<MqttTopicSubscription['qos']>[] = [
  { label: '0', value: 0 },
  { label: '1', value: 1 },
  { label: '2', value: 2 }
]

const DEFAULT_PORTS: Record<ConnectionForm['protocol'], number> = {
  mqtt: 1883,
  mqtts: 8883,
  ws: 8083,
  wss: 8084
}

const handleProtocolChange = (protocol: ConnectionForm['protocol']) => {
  form.value.port = DEFAULT_PORTS[protocol]
}

const isWebSocket = computed(() => form.value.protocol === 'ws' || form.value.protocol === 'wss')

const selectedColor = computed(() => getColor(form.value.labelColor))

watch(selectedColor, (color) => (labelNameDraft.value = color?.label ?? ''), { immediate: true })

const saveLabelName = () => {
  if (!selectedColor.value || !labelNameDraft.value.trim()) return

  setCustomLabel(selectedColor.value.value, labelNameDraft.value.trim())
}

const regenerateClientId = () => {
  form.value.clientId = `mq3t_${uuidV4()}`
}

const addSubscription = async () => {
  form.value.subscribedTopics.push({ topic: '', qos: 0 })

  await nextTick()

  const inputs = document.querySelectorAll<HTMLInputElement>('[data-subscription-topic] input')
  inputs[inputs.length - 1]?.focus()
}

const removeSubscription = (index: number) => {
  form.value.subscribedTopics.splice(index, 1)
}

const removeLastWill = () => {
  form.value.lastWill = emptyLastWill()
  willEnabled.value = false
}

const advancedSummary = computed(() => {
  const parts = [
    protocolVersionLabel(form.value),
    form.value.clean ? 'clean start' : 'persistent session',
    `timeout ${form.value.connectTimeout || 30} s`,
    `reconnect every ${form.value.reconnectPeriod || 1} s`
  ]

  if (form.value.protocolVersion === 5) {
    const count = form.value.properties.userProperties.length
    parts.push(`${count} user ${count === 1 ? 'property' : 'properties'}`)
  }

  return parts.join(' · ')
})

const isPositive = (value: unknown) => typeof value === 'number' && value > 0
const isEmpty = (value: unknown) => value === undefined || value === null || value === ''
const isOptionalCount = (value: unknown) =>
  isEmpty(value) || (typeof value === 'number' && value >= 0)

const validate = (): FormError[] => {
  const state = form.value
  const errors: FormError[] = []

  if (!state.name.trim()) errors.push({ name: 'name', message: 'Name is required' })
  if (!state.hostname.trim()) errors.push({ name: 'hostname', message: 'Hostname is required' })
  if (!isPositive(state.port) || state.port > 65535)
    errors.push({ name: 'port', message: 'Port must be between 1 and 65535' })
  if (!state.clientId.trim()) errors.push({ name: 'clientId', message: 'Client ID is required' })

  state.subscribedTopics.forEach((subscription, index) => {
    if (!subscription.topic.trim())
      errors.push({ name: `subscribedTopics.${index}.topic`, message: 'Topic is required' })
  })

  if (willEnabled.value && !state.lastWill.topic.trim())
    errors.push({ name: 'lastWill.topic', message: 'Topic is required' })

  if (!isPositive(state.connectTimeout))
    errors.push({ name: 'connectTimeout', message: 'Must be greater than 0' })
  if (!isPositive(state.reconnectPeriod))
    errors.push({ name: 'reconnectPeriod', message: 'Must be greater than 0' })

  if (state.protocolVersion === 5) {
    const optional = ['sessionExpiryInterval', 'receiveMaximum', 'maximumPacketSize'] as const

    for (const key of optional) {
      if (!isOptionalCount(state.properties[key]))
        errors.push({ name: `properties.${key}`, message: 'Must be 0 or more' })
    }

    state.properties.userProperties.forEach((property, index) => {
      if (!property.key.trim())
        errors.push({ name: `properties.userProperties.${index}.key`, message: 'Name is required' })
    })
  }

  return errors
}

const sectionOfError = (name: string): SectionId => {
  if (name.startsWith('subscribedTopics')) return 'subs'
  if (name.startsWith('lastWill')) return 'will'
  if (name.startsWith('properties') || name === 'connectTimeout' || name === 'reconnectPeriod')
    return 'adv'
  return 'general'
}

const ensureValid = async () => {
  const result = await formRef.value?.validate({ silent: true })
  if (result !== false) return true

  const firstError = formRef.value?.errors[0]?.name
  if (!firstError) return false

  const section = sectionOfError(firstError)

  if (section === 'adv') advancedOpened.value = true
  else scrollToSection(section)

  return false
}

const normalizedConnection = (): MqttConnection => {
  const copy = JSON.parse(JSON.stringify(form.value)) as ConnectionForm

  for (const key of ['sessionExpiryInterval', 'receiveMaximum', 'maximumPacketSize'] as const) {
    if (isEmpty(copy.properties[key])) delete copy.properties[key]
  }

  if (!willEnabled.value) copy.lastWill = emptyLastWill()

  copy.subscribedTopics = copy.subscribedTopics.map((s) => ({ ...s, topic: s.topic.trim() }))

  return copy
}

const persist = () => {
  const connection = normalizedConnection()

  if (isNew.value) mqttConnectionsStore.addConnection(connection)
  else mqttConnectionsStore.updateConnection(connection)

  return connection
}

const save = async () => {
  if (!(await ensureValid())) return

  const connection = persist()
  const status = mqttConnectionsStore.connectionsStatus[connection.clientKey]

  toast.add({
    title: 'Connection saved',
    description:
      status && status !== 'disconnected' ? 'Reconnect to apply the changes.' : undefined,
    color: 'success',
    icon: 'i-lucide-check'
  })

  appStore.closeConnectionEditor()
}

const saveAndConnect = async () => {
  if (!(await ensureValid())) return

  saving.value = true

  const connection = persist()
  const status = mqttConnectionsStore.connectionsStatus[connection.clientKey]

  appStore.closeConnectionEditor()

  if (status === 'disconnected') mqttConnectionsStore.connectClient(connection.clientKey)
  else if (status) reconnect(connection.clientKey)

  openConnection(connection.clientKey)
  saving.value = false
}

const cleanupTestClient = (clientKey: string) => {
  ElectronApi.disconnectMqtt(clientKey)

  const stop = watch(
    () => mqttConnectionsStore.connectionsStatus[clientKey],
    (status) => {
      if (status !== 'disconnected') return
      mqttConnectionsStore.hideConnection(clientKey)
      stop()
    }
  )

  setTimeout(() => {
    stop()
    mqttConnectionsStore.hideConnection(clientKey)
  }, 5000)
}

const testConnection = async () => {
  if (!(await ensureValid())) return

  testing.value = true

  const clientKey = `test-${uuidV4()}`
  const connection: MqttConnection = {
    ...normalizedConnection(),
    clientKey,
    clientId: `mq3t_test_${uuidV4().slice(0, 8)}`,
    subscribedTopics: [],
    lastWill: emptyLastWill()
  }

  const timeoutMs = ((connection.connectTimeout || 30) + 2) * 1000

  const result = await new Promise<{ ok: boolean; message?: string }>((resolve) => {
    const timer = setTimeout(() => finish({ ok: false, message: 'Timed out' }), timeoutMs)

    const stop = watch(
      () => [
        mqttConnectionsStore.connectionsStatus[clientKey],
        mqttConnectionsStore.lastErrors[clientKey]
      ],
      ([status, error]) => {
        if (status === 'connected') finish({ ok: true })
        else if (error) finish({ ok: false, message: error })
        else if (status === 'reconnecting')
          finish({ ok: false, message: 'The broker could not be reached.' })
      }
    )

    function finish(value: { ok: boolean; message?: string }) {
      clearTimeout(timer)
      stop()
      resolve(value)
    }

    ElectronApi.connectMqtt(connection)
  })

  cleanupTestClient(clientKey)
  testing.value = false

  toast.add(
    result.ok
      ? {
          title: 'Connection works',
          description: `Reached ${formatMqttUrl(connection)}`,
          color: 'success',
          icon: 'i-lucide-check'
        }
      : {
          title: 'Connection failed',
          description: result.message,
          color: 'error',
          icon: 'i-lucide-circle-alert'
        }
  )
}
</script>

<template>
  <div class="flex min-h-0 flex-col">
    <div class="border-default flex flex-wrap items-center gap-3 border-b px-6 py-3">
      <UButton
        icon="i-lucide-chevron-left"
        label="Connections"
        variant="link"
        color="neutral"
        class="text-muted hover:text-default px-0 text-[13px] font-normal"
        @click="appStore.closeConnectionEditor()"
      />
      <h1 class="truncate text-xl font-bold">{{ title }}</h1>
      <div class="ml-auto flex gap-2">
        <UButton
          label="Test connection"
          color="neutral"
          variant="outline"
          :loading="testing"
          @click="testConnection"
        />
        <UButton
          label="Cancel"
          color="neutral"
          variant="outline"
          @click="appStore.closeConnectionEditor()"
        />
        <UButton label="Save" color="neutral" variant="outline" @click="save" />
        <UButton
          label="Save and connect"
          class="font-semibold"
          :loading="saving"
          @click="saveAndConnect"
        />
      </div>
    </div>

    <div ref="scrollRef" class="min-h-0 flex-1 overflow-auto" @scroll.passive="handleScroll">
      <div class="mx-auto box-border flex w-full max-w-[1180px] flex-wrap gap-6 p-6">
        <nav
          aria-label="Connection sections"
          class="sticky top-6 flex max-w-[200px] flex-[1_1_180px] flex-col gap-0.5 self-start text-[13px]"
        >
          <button
            v-for="section in sections"
            :key="section.id"
            type="button"
            class="flex h-9 cursor-pointer items-center rounded-md px-3 text-left"
            :class="
              activeSection === section.id
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-default hover:bg-muted'
            "
            :aria-current="activeSection === section.id ? 'true' : undefined"
            @click="scrollToSection(section.id)"
          >
            {{ section.label }}
          </button>
        </nav>

        <UForm
          ref="formRef"
          :state="form"
          :validate="validate"
          :validate-on="['change']"
          class="flex min-w-0 flex-[999_1_560px] flex-col gap-4"
        >
          <section
            id="connection-general"
            class="border-default flex scroll-mt-6 flex-col gap-4 rounded-lg border p-5"
          >
            <h2 class="text-base font-bold">General</h2>

            <div class="flex flex-wrap items-start gap-3.5">
              <UFormField label="Name" name="name" class="flex-[1_1_280px]">
                <UInput v-model="form.name" size="lg" class="w-full" autofocus />
              </UFormField>

              <fieldset class="flex flex-col gap-1.5">
                <legend class="text-muted pb-1.5 text-xs font-semibold">Label color</legend>
                <div class="flex flex-wrap items-center gap-1.5">
                  <UTooltip text="None">
                    <button
                      type="button"
                      aria-label="No label color"
                      :aria-pressed="!form.labelColor"
                      class="border-default text-muted flex size-7 cursor-pointer items-center justify-center rounded-sm border border-dashed"
                      :class="{ 'outline-2 outline-offset-2 outline-current': !form.labelColor }"
                      @click="form.labelColor = null"
                    >
                      <UIcon name="i-lucide-ban" class="size-3.5" />
                    </button>
                  </UTooltip>
                  <UTooltip v-for="color in colors" :key="color.value" :text="color.label">
                    <button
                      type="button"
                      :aria-label="color.label"
                      :aria-pressed="form.labelColor === color.value"
                      class="size-7 cursor-pointer rounded-sm"
                      :class="{
                        'outline-2 outline-offset-2': form.labelColor === color.value
                      }"
                      :style="{
                        background: `var(--color-${color.value}-500)`,
                        outlineColor: `var(--color-${color.value}-500)`
                      }"
                      @click="form.labelColor = color.value"
                    />
                  </UTooltip>
                  <UPopover v-if="selectedColor">
                    <UTooltip text="Rename label">
                      <UButton
                        icon="i-lucide-pencil"
                        color="neutral"
                        variant="ghost"
                        size="sm"
                        class="text-muted"
                        aria-label="Rename label"
                      />
                    </UTooltip>
                    <template #content>
                      <div class="flex w-64 flex-col gap-2 p-3">
                        <span class="text-muted text-xs font-semibold">Label name</span>
                        <UInput
                          v-model="labelNameDraft"
                          autofocus
                          @keydown.enter="saveLabelName"
                          @blur="saveLabelName"
                        />
                      </div>
                    </template>
                  </UPopover>
                </div>
              </fieldset>
            </div>

            <div class="flex flex-wrap gap-6">
              <div class="flex flex-col gap-1.5">
                <span class="text-muted text-xs font-semibold">Protocol</span>
                <SegmentedControl
                  v-model="form.protocol"
                  :items="protocolItems"
                  @update:model-value="handleProtocolChange"
                />
              </div>
              <div class="flex flex-col gap-1.5">
                <span class="text-muted text-xs font-semibold">MQTT version</span>
                <SegmentedControl v-model="form.protocolVersion" :items="versionItems" />
              </div>
            </div>

            <div class="flex flex-wrap gap-3.5">
              <UFormField label="Hostname" name="hostname" class="flex-[3_1_260px]">
                <UInput v-model="form.hostname" size="lg" class="w-full font-mono" />
              </UFormField>
              <UFormField label="Port" name="port" class="flex-[1_1_100px]">
                <UInput
                  v-model.number="form.port"
                  type="number"
                  size="lg"
                  class="w-full font-mono"
                />
              </UFormField>
              <UFormField v-if="isWebSocket" label="Path" name="path" class="flex-[1_1_140px]">
                <UInput v-model="form.path" size="lg" class="w-full font-mono" />
              </UFormField>
            </div>

            <div class="bg-muted rounded-md px-3 py-2 font-mono text-[13px] break-all">
              <span class="text-muted">Connects to </span>{{ formatMqttUrl(form) }}
            </div>

            <div class="flex flex-wrap gap-3.5">
              <UFormField label="Client ID" name="clientId" class="flex-[1_1_220px]">
                <div class="flex gap-1.5">
                  <UInput v-model="form.clientId" size="lg" class="w-full font-mono" />
                  <UButton
                    label="New"
                    color="neutral"
                    variant="outline"
                    aria-label="Generate a new client ID"
                    @click="regenerateClientId"
                  />
                </div>
              </UFormField>
              <UFormField label="Username" name="username" class="flex-[1_1_180px]">
                <UInput v-model="form.username" size="lg" class="w-full" />
              </UFormField>
              <UFormField label="Password" name="password" class="flex-[1_1_180px]">
                <UInput
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  size="lg"
                  class="w-full"
                  :ui="{ trailing: 'pe-1' }"
                >
                  <template #trailing>
                    <UButton
                      color="neutral"
                      variant="link"
                      size="sm"
                      :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                      :aria-label="showPassword ? 'Hide password' : 'Show password'"
                      @click="showPassword = !showPassword"
                    />
                  </template>
                </UInput>
              </UFormField>
            </div>
          </section>

          <section
            id="connection-subs"
            class="border-default flex scroll-mt-6 flex-col gap-4 rounded-lg border p-5"
          >
            <div class="flex items-center justify-between">
              <h2 class="text-base font-bold">Subscriptions</h2>
              <UButton
                label="Add topic"
                color="neutral"
                variant="outline"
                size="sm"
                @click="addSubscription"
              />
            </div>
            <p v-if="!form.subscribedTopics.length" class="text-muted text-[13px]">
              No subscriptions. Nothing will show up in Explore until you add one.
            </p>
            <div
              v-for="(subscription, index) in form.subscribedTopics"
              :key="index"
              class="flex items-start gap-2.5"
            >
              <UFormField :name="`subscribedTopics.${index}.topic`" class="flex-1">
                <UInput
                  v-model="subscription.topic"
                  data-subscription-topic
                  size="lg"
                  placeholder="sensors/#"
                  aria-label="Topic filter"
                  class="w-full font-mono"
                />
              </UFormField>
              <SegmentedControl v-model="subscription.qos" :items="qosItems" size="sm" />
              <UButton
                icon="i-lucide-x"
                color="neutral"
                variant="ghost"
                class="text-muted"
                aria-label="Remove"
                @click="removeSubscription(index)"
              />
            </div>
          </section>

          <section
            id="connection-will"
            class="border-default flex scroll-mt-6 flex-col gap-4 rounded-lg border p-5"
          >
            <div class="flex items-center gap-3">
              <div class="flex-1">
                <h2 class="text-base font-bold">Last will</h2>
                <p class="text-muted mt-1 text-[13px]">
                  {{ willEnabled ? '' : 'Not set.' }}
                  The broker publishes it if MQ3T drops off unexpectedly.
                </p>
              </div>
              <UButton
                v-if="!willEnabled"
                label="Set up"
                color="neutral"
                variant="outline"
                @click="willEnabled = true"
              />
              <UButton
                v-else
                label="Remove"
                color="neutral"
                variant="outline"
                @click="removeLastWill"
              />
            </div>

            <template v-if="willEnabled">
              <div class="flex flex-wrap items-end gap-3.5">
                <UFormField label="Topic" name="lastWill.topic" class="flex-[1_1_260px]">
                  <UInput
                    v-model="form.lastWill.topic"
                    size="lg"
                    placeholder="mq3t/status"
                    class="w-full font-mono"
                  />
                </UFormField>
                <div class="flex flex-col gap-1.5">
                  <span class="text-muted text-xs font-semibold">QoS</span>
                  <SegmentedControl v-model="form.lastWill.qos" :items="qosItems" />
                </div>
                <USwitch v-model="form.lastWill.retain" label="Retain" class="pb-2" />
              </div>
              <UFormField label="Payload" name="lastWill.payload">
                <UTextarea
                  v-model="form.lastWill.payload"
                  :rows="6"
                  autoresize
                  :maxrows="16"
                  class="w-full font-mono"
                />
              </UFormField>
            </template>
          </section>

          <section
            id="connection-adv"
            class="border-default flex scroll-mt-6 items-center gap-3 rounded-lg border p-5"
          >
            <div class="flex-1">
              <h2 class="text-base font-bold">Advanced</h2>
              <p class="text-muted mt-1 text-[13px]">{{ advancedSummary }}</p>
            </div>
            <UButton
              label="Edit"
              color="neutral"
              variant="outline"
              @click="advancedOpened = true"
            />
          </section>

          <USlideover
            v-model:open="advancedOpened"
            :ui="{ content: 'max-w-[760px]', body: 'px-8 py-7' }"
          >
            <template #header>
              <div class="flex flex-1 items-start">
                <div class="flex-1">
                  <span class="text-muted text-[11px] font-semibold tracking-[0.1em] uppercase">
                    Connection editor · {{ title }}
                  </span>
                  <h2 class="mt-1 text-[22px] font-bold">Advanced</h2>
                </div>
                <UButton label="Done" @click="advancedOpened = false" />
              </div>
            </template>
            <template #body>
              <ConnectionAdvancedSettings v-model:connection="form" />
            </template>
          </USlideover>
        </UForm>
      </div>
    </div>
  </div>
</template>
