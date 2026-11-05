<script setup lang="ts">
import ImportActionsDialog from '@renderer/components/tab-actions/dialogs/ImportActionsDialog.vue'
import QuickConnectDialog from '@renderer/components/connections/QuickConnectDialog.vue'
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
import { emitMqttMessage } from '../composables/useMqttMessageBus'
import { useActionsStore } from '../store/actions'
import SettingsView from '../components/settings/SettingsView.vue'
import { ConnectionSection, useAppStore } from '../store/app-store'
import { MenuCommand } from '../../../types/electron-ipc-callbacks'
import TabActions from '../tabs/TabActions.vue'
import ExploreView from '../components/explore/ExploreView.vue'
import { useExploreUiStore } from '../store/explore-ui'
import { defineShortcuts, useToast } from '@nuxt/ui/composables'

const mqttConnectionsStore = useMqttConnectionsStore()
const chainActionsStore = useChainActionsStore()
const mqttTopicsStore = useMqttTopicsStore()
const dataGraphsStore = useDataGraphsStore()
const settingsStore = useSettingsStore()
const actionsStore = useActionsStore()
const appStore = useAppStore()
const exploreUiStore = useExploreUiStore()
const toast = useToast()

const { currentSection, openSection, openNewTab, cycleTab, toggleSettings, closeCurrentTab } =
  useAppNavigation()

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
  meta_shift_t: () => appStore.openQuickConnect(),
  meta_n: () => openNewMessage(),
  'meta_,': () => toggleSettings(),
  meta_w: { usingInput: true, handler: () => closeCurrentTab() },
  ctrl_tab: { usingInput: true, handler: () => cycleTab(1) },
  ctrl_shift_tab: { usingInput: true, handler: () => cycleTab(-1) }
})

const runMenuCommand = (command: MenuCommand) => {
  if (command.startsWith('section:')) {
    openSection(command.slice('section:'.length) as ConnectionSection)
    return
  }

  switch (command) {
    case 'settings':
      if (appStore.view !== 'settings') toggleSettings()
      break
    case 'new-tab':
      openNewTab()
      break
    case 'temporary-connection':
      appStore.openQuickConnect()
      break
    case 'close-tab':
      closeCurrentTab()
      break
    case 'next-tab':
      cycleTab(1)
      break
    case 'previous-tab':
      cycleTab(-1)
      break
  }
}

const openNewMessage = () => {
  if (appStore.view !== 'connection' || !mqttTopicsStore.selectedConnection) return

  openSection('explore')
  exploreUiStore.openNewMessage()
}

onMounted(() => {
  ElectronApi.initRenderer()

  ElectronApi.handleRequestMqttMessages(() => {
    ElectronApi.transferMqttMessages(JSON.parse(JSON.stringify(mqttTopicsStore.topicsMessages)))
  })

  ElectronApi.handleMenuCommand((_, command) => runMenuCommand(command))

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
    emitMqttMessage({ clientKey, topic, message })
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
      <connection-toolbar @new-message="openNewMessage" />

      <connection-lost-banner
        v-if="isConnectionLost"
        :client-key="mqttTopicsStore.selectedConnection"
      />

      <div class="min-h-0 flex-1 overflow-auto" :class="{ 'opacity-55': isConnectionLost }">
        <keep-alive>
          <explore-view v-if="currentSection === 'explore'" />
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
  <quick-connect-dialog />
</template>
