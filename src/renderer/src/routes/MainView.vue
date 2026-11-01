<script setup lang="ts">
import ImportChainActions from '@renderer/components/ImportChainActions.vue'
import ImportActionsGroups from '../components/ImportActionsGroups.vue'
import { useChainActionsStore } from '@renderer/store/chain-actions'
import { useMqttConnectionsStore } from '../store/mqtt-connections'
import { onMounted, watch } from 'vue'
import ImportActions from '../components/ImportActions.vue'
import { useMqttTopicsStore } from '../store/mqtt-topics'
import { useDataGraphsStore } from '../store/data-graphs'
import { useSettingsStore } from '../store/settings-store'
import UpdateDialog from '../components/settings/UpdateDialog.vue'
import { ElectronApi } from '../assets/js/electron-api'
import TabConnections from '../tabs/TabConnections.vue'
import BrokerDetailsPanel from '../components/tap-topics/BrokerDetailsPanel.vue'
import ConnectionToolbar from '../components/shell/ConnectionToolbar.vue'
import AppTitleBar from '../components/shell/AppTitleBar.vue'
import GraphList from '../components/tap-topics/GraphList.vue'
import { useAppNavigation } from '../composables/useAppNavigation'
import { useActionsStore } from '../store/actions'
import SettingsView from '../components/settings/SettingsView.vue'
import { useAppStore } from '../store/app-store'
import TabActions from '../tabs/TabActions.vue'
import TabTopics from '../tabs/TabTopics.vue'
import { defineShortcuts, useToast } from '@nuxt/ui/composables'

const mqttConnectionsStore = useMqttConnectionsStore()
const chainActionsStore = useChainActionsStore()
const mqttTopicsStore = useMqttTopicsStore()
const dataGraphsStore = useDataGraphsStore()
const settingsStore = useSettingsStore()
const actionsStore = useActionsStore()
const appStore = useAppStore()
const toast = useToast()

const { currentSection, openSection, openNewTab, toggleSettings } = useAppNavigation()

defineShortcuts({
  meta_1: () => openSection('explore'),
  meta_2: () => openSection('actions'),
  meta_3: () => openSection('graphs'),
  meta_4: () => openSection('broker'),
  meta_t: () => openNewTab(),
  'meta_,': () => toggleSettings()
})

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
</script>

<template>
  <div class="main-view flex h-full flex-col">
    <app-title-bar />

    <settings-view v-if="appStore.view === 'settings'" class="min-h-0 flex-1" />

    <div
      v-else-if="appStore.view === 'connection' && mqttTopicsStore.selectedConnection"
      class="flex min-h-0 flex-1 flex-col"
    >
      <connection-toolbar @new-message="openSection('explore')" />

      <div class="min-h-0 flex-1 overflow-auto">
        <keep-alive>
          <tab-topics v-if="currentSection === 'explore'" />
          <tab-actions v-else-if="currentSection === 'actions'" />
          <div v-else-if="currentSection === 'graphs'" class="p-4">
            <graph-list />
          </div>
          <broker-details-panel v-else-if="currentSection === 'broker'" class="p-4" />
        </keep-alive>
      </div>
    </div>

    <tab-connections v-else class="min-h-0 flex-1 overflow-auto" />
  </div>
  <update-dialog />
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
