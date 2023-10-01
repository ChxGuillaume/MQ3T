<script setup lang="ts">
import { useMqttConnectionsStore } from './store/mqtt-connections'
import { ElectronIpc } from '../../types/electron-ipc-callbacks'
import { useMqttTopicsStore } from './store/mqtt-topics'
import TabConnections from './tabs/TabConnections.vue'
import TabSettings from './tabs/TabSettings.vue'
import { onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import TabTopics from './tabs/TabTopics.vue'

const currentTab = ref('connections')

const mqttConnectionsStore = useMqttConnectionsStore()
const mqttTopicsStore = useMqttTopicsStore()

mqttConnectionsStore.loadConnections()

const $q = useQuasar()

onMounted(() => {
  const storedTheme = localStorage.getItem('darkMode')

  switch (storedTheme) {
    case 'true':
      $q.dark.set(true)
      break
    case 'false':
      $q.dark.set(false)
      break
    default:
      $q.dark.set('auto')
      break
  }

  const electronApi = window.api as ElectronIpc

  electronApi.fetchMqttStatus()

  electronApi.handleMqttError((event, value) => {
    console.log(event, value)

    const connection = mqttConnectionsStore.getConnection(value.clientKey)

    if (!connection) return

    $q.notify({
      message: `[${connection.name}]`,
      caption: value.error.message,
      type: 'negative'
    })
  })

  electronApi.handleMqttStatus((event, value) => {
    console.log(event, value)

    mqttConnectionsStore.setConnectionStatus(value.clientKey, value.status)

    const connection = mqttConnectionsStore.getConnection(value.clientKey)

    if (!connection) return

    $q.notify({
      message: `[${connection.name}]`,
      caption: value.status,
      type: 'info'
    })
  })

  electronApi.handleMqttMessage((_, value) => {
    mqttTopicsStore.addMessage(value.clientKey, value.topic, value.message, {
      qos: value.packet.qos,
      retained: value.packet.retain
    })
  })
})
</script>

<template>
  <div class="tw-h-full tw-flex tw-content-between">
    <div class="nav-bar-left">
      <q-tabs
        v-model="currentTab"
        vertical
        :class="{ 'text-primary': !$q.dark.isActive }"
        active-bg-color="primary"
        active-color="white"
        indicator-color="transparent"
      >
        <div class="tw-h-full tw-flex tw-flex-col tw-justify-between">
          <div>
            <q-tab name="topics" icon="fa-solid fa-code" label="Topics" />
            <q-tab name="actions" icon="fa-solid fa-play" label="Actions" />
            <q-tab
              name="automations"
              icon="fa-solid fa-wand-sparkles"
              label="Automations"
              disable
            />
          </div>
          <div>
            <q-tab name="settings" icon="fa-solid fa-sliders" label="Settings" />
            <q-tab name="connections" icon="fa-solid fa-link" label="Connections" />
          </div>
        </div>
      </q-tabs>
    </div>
    <div class="tw-flex-grow" style="max-width: calc(100vw - 120px)">
      <q-tab-panels
        v-model="currentTab"
        class="tw-h-full tw-bg-transparent"
        animated
        vertical
        transition-prev="jump-up"
        transition-next="jump-down"
      >
        <q-tab-panel class="tw-p-0" name="topics">
          <TabTopics />
        </q-tab-panel>
        <q-tab-panel name="actions">Actions</q-tab-panel>
        <q-tab-panel name="automations">Automations</q-tab-panel>

        <q-tab-panel name="settings">
          <TabSettings />
        </q-tab-panel>
        <q-tab-panel name="connections">
          <TabConnections />
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </div>
</template>

<style lang="less">
@import './assets/css/styles.less';

.nav-bar-left {
  width: 120px;
}

.body--light {
  .nav-bar-left {
    @apply tw-bg-zinc-100;
  }
}

.body--dark {
  .nav-bar-left {
    @apply tw-bg-neutral-900;
  }
}
</style>
