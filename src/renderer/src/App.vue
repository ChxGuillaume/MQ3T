<script setup lang="ts">
import { useMqttConnectionsStore } from './store/mqtt-connections'
import { useMqttTopicsStore } from './store/mqtt-topics'
import { ElectronApi } from './assets/js/electron-api'
import TabConnections from './tabs/TabConnections.vue'
import { useActionsStore } from './store/actions'
import TabSettings from './tabs/TabSettings.vue'
import TabActions from './tabs/TabActions.vue'
import TabTopics from './tabs/TabTopics.vue'
import { onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'

const currentTab = ref('connections')

const mqttConnectionsStore = useMqttConnectionsStore()
const mqttTopicsStore = useMqttTopicsStore()
const actionsStore = useActionsStore()

const $q = useQuasar()

const connectingNotify = ref<Record<string, ReturnType<typeof $q.notify>>>({})

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

  ElectronApi.initRenderer()

  ElectronApi.handleMqttError((event, value) => {
    console.log(event, value)

    const connection = mqttConnectionsStore.getConnection(value.clientKey)

    if (!connection) return

    $q.notify({
      message: `[${connection.name}]`,
      caption: value.error.message,
      type: 'negative'
    })
  })

  ElectronApi.handleMqttStatus((event, value) => {
    console.log(event, value)

    mqttConnectionsStore.setConnectionStatus(value.clientKey, value.status)

    const connection = mqttConnectionsStore.getConnection(value.clientKey)

    if (!connection) return

    if (value.status === 'connected') {
      const notify = connectingNotify[value.clientKey]

      const notificationData = {
        message: `[${connection.name}]`,
        caption: 'Connected',
        type: 'positive',
        icon: 'fa-solid fa-plug-circle-plus'
      }

      if (notify) notify(notificationData)
      else $q.notify(notificationData)

      delete connectingNotify[value.clientKey]
    } else if (value.status === 'connecting') {
      connectingNotify[value.clientKey] = $q.notify({
        message: `[${connection.name}]`,
        caption: 'Connecting...',
        type: 'ongoing'
      })
    } else if (value.status === 'disconnected') {
      const notify = connectingNotify[value.clientKey]

      const notificationData = {
        message: `[${connection.name}]`,
        caption: 'Disconnected',
        type: 'warning',
        icon: 'fa-solid fa-plug-circle-minus'
      }

      if (notify) notify(notificationData)
      else $q.notify(notificationData)

      delete connectingNotify[value.clientKey]
    }
  })

  ElectronApi.handleMqttMessage((_, value) => {
    mqttTopicsStore.addMessage(value.clientKey, value.topic, value.message, {
      qos: value.packet.qos,
      retained: value.packet.retain
    })
  })

  ElectronApi.handleLoadMqttConnections((_, connections) => {
    mqttConnectionsStore.setConnections(connections)
  })

  ElectronApi.handleLoadActions((_, actions) => {
    actionsStore.setActions(actions)
  })

  ElectronApi.handleLoadActionsGroups((_, actionGroups) => {
    actionsStore.setActionsGroups(actionGroups)
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
        keep-alive
        transition-prev="jump-up"
        transition-next="jump-down"
      >
        <q-tab-panel class="tw-p-0" name="topics">
          <TabTopics />
        </q-tab-panel>
        <q-tab-panel class="tw-p-0" name="actions">
          <TabActions />
        </q-tab-panel>
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
  @apply tw-border-r;
  width: 120px;
}

.body--light {
  .nav-bar-left {
    @apply tw-bg-zinc-100 tw-border-black/10;
  }
}

.body--dark {
  .nav-bar-left {
    @apply tw-bg-neutral-900 tw-border-white/10;
  }
}
</style>
