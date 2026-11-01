<script setup lang="ts">
import ImportActionsDialog from '@renderer/components/tab-actions/dialogs/ImportActionsDialog.vue'
import { useChainActionsStore } from '@renderer/store/chain-actions'
import { useMqttConnectionsStore } from '../store/mqtt-connections'
import { computed, onMounted, watch } from 'vue'
import { useMqttTopicsStore } from '../store/mqtt-topics'
import { useDataGraphsStore } from '../store/data-graphs'
import { useSettingsStore } from '../store/settings-store'
import UpdateDialog from '../components/settings/UpdateDialog.vue'
import { ElectronApi } from '../assets/js/electron-api'
import ConnectionLostBanner from '../components/connections/ConnectionLostBanner.vue'
import ConnectionEditor from '../components/connections/ConnectionEditor.vue'
import NewTabView from '../components/connections/NewTabView.vue'
import BrokerView from '../components/broker/BrokerView.vue'
import ConnectionToolbar from '../components/shell/ConnectionToolbar.vue'
import AppTitleBar from '../components/shell/AppTitleBar.vue'
import GraphsSection from '../components/graphs/GraphsSection.vue'
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

const isConnectionLost = computed(() => {
  const status = mqttConnectionsStore.getConnectionStatus(mqttTopicsStore.selectedConnection)

  return status === 'disconnected' || status === 'reconnecting'
})

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

    mqttConnectionsStore.setConnectionError(value.clientKey, value.error.message)

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

    <connection-editor
      v-else-if="appStore.view === 'connection-editor'"
      :key="appStore.editingClientKey ?? 'new'"
      class="min-h-0 flex-1"
    />

    <div
      v-else-if="appStore.view === 'connection' && mqttTopicsStore.selectedConnection"
      class="flex min-h-0 flex-1 flex-col"
    >
      <connection-toolbar @new-message="openSection('explore')" />

      <connection-lost-banner
        v-if="isConnectionLost"
        :client-key="mqttTopicsStore.selectedConnection"
      />

      <div class="min-h-0 flex-1 overflow-auto" :class="{ 'opacity-55': isConnectionLost }">
        <keep-alive>
          <tab-topics v-if="currentSection === 'explore'" />
          <tab-actions v-else-if="currentSection === 'actions'" />
          <graphs-section v-else-if="currentSection === 'graphs'" />
          <broker-view v-else-if="currentSection === 'broker'" />
        </keep-alive>
      </div>
    </div>

    <new-tab-view v-else class="min-h-0 flex-1 overflow-auto" />
  </div>
  <update-dialog />
  <import-actions-dialog />
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
