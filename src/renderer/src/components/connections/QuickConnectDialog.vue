<script setup lang="ts">
import SegmentedControl, { SegmentedItem } from '@renderer/components/ui/SegmentedControl.vue'
import { createDefaultConnection, DEFAULT_PORTS } from '@renderer/assets/js/default-connection'
import { useMqttConnectionsStore } from '@renderer/store/mqtt-connections'
import { useAppNavigation } from '@renderer/composables/useAppNavigation'
import { MqttConnection } from '../../../../types/mqtt-connection'
import { useAppStore } from '@renderer/store/app-store'
import { computed, ref, watch } from 'vue'
import { v4 as uuidV4 } from 'uuid'

type Protocol = MqttConnection['protocol']

const mqttConnectionsStore = useMqttConnectionsStore()
const appStore = useAppStore()

const { openConnection } = useAppNavigation()

const BROKER_URL_PATTERN =
  /^(mqtts?|wss?):\/\/(?:([^:@/]*)(?::([^@/]*))?@)?([^:/?#]+)(?::(\d+))?(\/[^?#]*)?/i

const protocolItems: SegmentedItem<Protocol>[] = [
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

const freshForm = () => ({
  protocol: 'mqtt' as Protocol,
  hostname: '',
  port: DEFAULT_PORTS.mqtt,
  path: '/mqtt',
  username: '',
  password: '',
  protocolVersion: 4 as 3 | 4 | 5,
  clientId: `mq3t_${uuidV4()}`,
  clean: true,
  topics: '#'
})

const form = ref(freshForm())
const portEdited = ref(false)
const showPassword = ref(false)
const authenticationOpen = ref(false)
const errors = ref<{ hostname?: string; port?: string }>({})

const open = computed({
  get: () => appStore.quickConnectOpen,
  set: (value: boolean) => appStore.setQuickConnectOpen(value)
})

const isWebSocket = computed(() => form.value.protocol === 'ws' || form.value.protocol === 'wss')

watch(open, (isOpen) => {
  if (!isOpen) return

  form.value = freshForm()
  portEdited.value = false
  showPassword.value = false
  authenticationOpen.value = false
  errors.value = {}
})

const setProtocol = (protocol: Protocol) => {
  form.value.protocol = protocol

  if (!portEdited.value) form.value.port = DEFAULT_PORTS[protocol]
}

const protocolModel = computed<Protocol>({
  get: () => form.value.protocol,
  set: setProtocol
})

const fillFromUrl = (value: string) => {
  const match = value.trim().match(BROKER_URL_PATTERN)

  if (!match) return false

  const [, protocol, username, password, hostname, port, path] = match

  setProtocol(protocol.toLowerCase() as Protocol)
  form.value.hostname = hostname

  if (username) form.value.username = decodeURIComponent(username)
  if (password) form.value.password = decodeURIComponent(password)
  if (username || password) authenticationOpen.value = true
  if (path && path !== '/') form.value.path = path

  if (port) {
    form.value.port = Number(port)
    portEdited.value = true
  }

  return true
}

const hostnameModel = computed({
  get: () => form.value.hostname,
  set: (value: string) => {
    if (!fillFromUrl(value)) form.value.hostname = value
  }
})

const portModel = computed({
  get: () => form.value.port,
  set: (value: number) => {
    form.value.port = value
    portEdited.value = true
  }
})

const regenerateClientId = () => {
  form.value.clientId = `mq3t_${uuidV4()}`
}

const subscribedTopics = () =>
  form.value.topics
    .split(/[\s,]+/)
    .map((topic) => topic.trim())
    .filter(Boolean)
    .map((topic) => ({ topic, qos: 0 as const }))

const validate = () => {
  const port = Number(form.value.port)

  errors.value = {
    hostname: form.value.hostname.trim() ? undefined : 'Host is required',
    port: Number.isInteger(port) && port > 0 && port < 65536 ? undefined : 'Invalid port'
  }

  return !errors.value.hostname && !errors.value.port
}

const connect = () => {
  if (!validate()) return

  const hostname = form.value.hostname.trim()
  const clientKey = `temporary-${uuidV4()}`

  mqttConnectionsStore.addTemporaryConnection({
    ...createDefaultConnection(),
    clientKey,
    name: hostname,
    protocol: form.value.protocol,
    protocolVersion: form.value.protocolVersion,
    hostname,
    port: Number(form.value.port),
    path: form.value.path,
    username: form.value.username,
    password: form.value.password,
    clientId: form.value.clientId.trim() || `mq3t_${uuidV4()}`,
    clean: form.value.clean,
    subscribedTopics: subscribedTopics()
  })

  open.value = false
  openConnection(clientKey)
}
</script>

<template>
  <UModal v-model:open="open" :ui="{ content: 'sm:max-w-lg', footer: 'justify-end' }">
    <template #title>
      <span class="flex items-center gap-2">
        <UIcon name="i-lucide-timer" class="text-warning size-5" />
        Temporary connection
      </span>
    </template>

    <template #description>
      Not saved: it's discarded when MQ3T closes, and actions aren't available.
    </template>

    <template #body>
      <form class="flex flex-col gap-4" @submit.prevent="connect">
        <UFormField label="Protocol">
          <SegmentedControl v-model="protocolModel" :items="protocolItems" />
        </UFormField>

        <div class="grid grid-cols-[1fr_120px] gap-3">
          <UFormField label="Host" :error="errors.hostname" required>
            <UInput
              v-model="hostnameModel"
              placeholder="broker.example.com"
              class="w-full"
              autofocus
            />
          </UFormField>
          <UFormField label="Port" :error="errors.port" required>
            <UInput v-model.number="portModel" type="number" class="w-full" />
          </UFormField>
        </div>

        <p class="text-muted -mt-2 text-xs">
          Tip: paste a full URL like mqtt://user:pass@host:1883 into Host to fill everything in.
        </p>

        <UFormField v-if="isWebSocket" label="Path">
          <UInput v-model="form.path" placeholder="/mqtt" class="w-full" />
        </UFormField>

        <UCollapsible v-model:open="authenticationOpen" class="flex flex-col gap-3">
          <UButton
            label="Authentication"
            color="neutral"
            variant="link"
            trailing-icon="i-lucide-chevron-down"
            class="group text-muted hover:text-default self-start px-0 font-semibold"
            :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform' }"
          />
          <template #content>
            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Username">
                <UInput v-model="form.username" autocomplete="off" class="w-full" />
              </UFormField>
              <UFormField label="Password">
                <UInput
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="off"
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
          </template>
        </UCollapsible>

        <UCollapsible class="flex flex-col gap-3">
          <UButton
            label="Options"
            color="neutral"
            variant="link"
            trailing-icon="i-lucide-chevron-down"
            class="group text-muted hover:text-default self-start px-0 font-semibold"
            :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform' }"
          />
          <template #content>
            <div class="flex flex-col gap-3">
              <UFormField label="MQTT version">
                <SegmentedControl v-model="form.protocolVersion" :items="versionItems" />
              </UFormField>
              <UFormField label="Client ID">
                <UInput v-model="form.clientId" class="w-full" :ui="{ trailing: 'pe-1' }">
                  <template #trailing>
                    <UButton
                      color="neutral"
                      variant="link"
                      size="sm"
                      icon="i-lucide-refresh-cw"
                      aria-label="Generate a new client ID"
                      @click="regenerateClientId"
                    />
                  </template>
                </UInput>
              </UFormField>
              <UFormField label="Subscribe to" description="Separate topics with commas or spaces">
                <UInput v-model="form.topics" placeholder="#" class="w-full" />
              </UFormField>
              <USwitch v-model="form.clean" label="Clean session" />
            </div>
          </template>
        </UCollapsible>

        <button type="submit" class="hidden" />
      </form>
    </template>

    <template #footer>
      <UButton color="neutral" variant="outline" label="Cancel" @click="open = false" />
      <UButton icon="i-lucide-plug" label="Connect" class="font-semibold" @click="connect" />
    </template>
  </UModal>
</template>
