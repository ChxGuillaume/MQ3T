<script setup lang="ts">
import ImportChainActions from '@renderer/components/ImportChainActions.vue'
import ImportActionsGroups from '../components/ImportActionsGroups.vue'
import { useChainActionsStore } from '@renderer/store/chain-actions'
import { useMqttConnectionsStore } from '../store/mqtt-connections'
import { computed, onMounted, onUnmounted, watch } from 'vue'
import ImportActions from '../components/ImportActions.vue'
import { useMqttTopicsStore } from '../store/mqtt-topics'
import { useDataGraphsStore } from '../store/data-graphs'
import { useSettingsStore } from '../store/settings-store'
import UpdateAlerts from '../components/UpdateAlerts.vue'
import { ElectronApi } from '../assets/js/electron-api'
import TabConnections from '../tabs/TabConnections.vue'
import { useActionsStore } from '../store/actions'
import TabSettings from '../tabs/TabSettings.vue'
import { useAppStore } from '../store/app-store'
import TabActions from '../tabs/TabActions.vue'
import TabTopics from '../tabs/TabTopics.vue'
import AppBar from '../components/AppBar.vue'
import { useToast } from '@nuxt/ui/composables'

const mqttConnectionsStore = useMqttConnectionsStore()
const chainActionsStore = useChainActionsStore()
const mqttTopicsStore = useMqttTopicsStore()
const dataGraphsStore = useDataGraphsStore()
const settingsStore = useSettingsStore()
const actionsStore = useActionsStore()
const appStore = useAppStore()
const toast = useToast()

const currentTab = computed({
  get: () => appStore.currentTab,
  set: (val) => {
    appStore.setCurrentTab(val)
  }
})

const handleKeyUp = (event: KeyboardEvent) => {
  if (event.ctrlKey) {
    switch (event.key) {
      case '1':
        currentTab.value = 'topics'
        break
      case '2':
        currentTab.value = 'actions'
        break
      case '4':
        currentTab.value = 'settings'
        break
      case '5':
        currentTab.value = 'connections'
        break
    }
  }
}

onMounted(() => {
  ElectronApi.initRenderer()

  ElectronApi.appVersion((_, value) => {
    appStore.setAppVersion(value)
  })

  ElectronApi.debug((_, value, ...args) => {
    console.warn(value, args)
  })

  ElectronApi.handleMqttError((event, value) => {
    console.error(event, value)

    const connection = mqttConnectionsStore.getConnection(value.clientKey)

    if (!connection) return

    toast.add({
      title: connection.name,
      description: value.error.message,
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  })

  ElectronApi.handleMqttStatus((_, value) => {
    mqttConnectionsStore.setConnectionStatus(value.clientKey, value.status)
  })

  ElectronApi.handleMqttMessage((_, { clientKey, topic, message, packet }) => {
    mqttTopicsStore.addMessage(clientKey, topic, message, packet)
  })

  ElectronApi.handleLoadMqttConnections((_, connections) => {
    mqttConnectionsStore.setConnections(connections)
  })

  ElectronApi.handleLoadActions((_, actions) => {
    actionsStore.setActions(actions)
  })

  ElectronApi.handleLoadChainActions((_, chainActions) => {
    chainActionsStore.setChainActions(chainActions)
  })

  ElectronApi.handleLoadActionsGroups((_, actionGroups) => {
    actionsStore.setActionsGroups(actionGroups)
  })

  dataGraphsStore.initStore()
  settingsStore.initStore()

  window.addEventListener('keyup', handleKeyUp)
})

// TODO: This is kept as a counter mesure due to the refactoring of the application,
//  this should be removed in the future
watch(
  () => mqttTopicsStore.selectedConnection,
  (clientKey) => {
    if (!clientKey) return

    actionsStore.selectedConnection = clientKey
  }
)

onUnmounted(() => {
  window.removeEventListener('keyup', handleKeyUp)
})
</script>

<template>
  <div class="main-view grid h-full grid-rows-[auto_1fr]">
    <app-bar v-model="currentTab" />
    <div class="flex content-between overflow-auto">
      <div class="grow">
        <q-tab-panels v-model="currentTab" class="h-full bg-transparent" vertical keep-alive>
          <q-tab-panel class="p-0" name="topics">
            <tab-topics />
          </q-tab-panel>
          <q-tab-panel class="p-0" name="actions">
            <tab-actions />
          </q-tab-panel>
          <q-tab-panel class="p-0" name="settings">
            <tab-settings />
          </q-tab-panel>
          <q-tab-panel class="p-0" name="connections">
            <tab-connections />
          </q-tab-panel>
        </q-tab-panels>
      </div>
    </div>
  </div>
  <update-alerts />
  <import-actions />
  <import-chain-actions />
  <import-actions-groups />
</template>

<style lang="less">
@import '../assets/css/styles.less';

.nav-bar-left {
  border-right-width: 1px;
  min-width: 135px;
  width: 135px;
}

.body--light {
  .nav-bar-left {
    border-color: rgb(0 0 0 / 0.1);
    background-color: #f4f4f5;
  }
}

.body--dark {
  .nav-bar-left {
    border-color: rgb(255 255 255 / 0.1);
    background-color: #171717;
  }
}
</style>
