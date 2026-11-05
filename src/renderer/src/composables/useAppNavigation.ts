import { ConnectionSection, useAppStore } from '@renderer/store/app-store'
import { useMqttConnectionsStore } from '@renderer/store/mqtt-connections'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import { useActionsStore } from '@renderer/store/actions'
import { computed } from 'vue'

export function useAppNavigation() {
  const mqttConnectionsStore = useMqttConnectionsStore()
  const mqttTopicsStore = useMqttTopicsStore()
  const actionsStore = useActionsStore()
  const appStore = useAppStore()

  const selectedClientKey = computed(() => mqttTopicsStore.selectedConnection)

  const currentSection = computed<ConnectionSection>({
    get: () => appStore.getSection(selectedClientKey.value),
    set: (section) => appStore.setSection(selectedClientKey.value, section)
  })

  const openConnection = (clientKey: string, section?: ConnectionSection) => {
    if (!mqttConnectionsStore.connectionsStatus[clientKey]) {
      mqttConnectionsStore.connectClient(clientKey)
    }
    mqttTopicsStore.selectedConnection = clientKey
    actionsStore.setSelectedConnection(clientKey)

    if (section) appStore.setSection(clientKey, section)

    appStore.setView('connection')
  }

  const openSection = (section: ConnectionSection) => {
    if (!selectedClientKey.value) return

    openConnection(selectedClientKey.value, section)
  }

  const openNewTab = () => {
    mqttTopicsStore.selectedConnection = ''
    appStore.setView('new-tab')
  }

  const toggleSettings = () => {
    if (appStore.view !== 'settings') {
      appStore.setView('settings')
      return
    }

    if (selectedClientKey.value) appStore.setView('connection')
    else appStore.setView('new-tab')
  }

  const closeConnection = (clientKey: string) => {
    mqttConnectionsStore.disconnectClient(clientKey)
    mqttTopicsStore.clearSelectedTopic(clientKey)

    const openKeys = mqttConnectionsStore.getConnectionsWithStatus.map((c) => c.clientKey)
    const index = openKeys.indexOf(clientKey)
    const neighbour = openKeys[index + 1] ?? openKeys[index - 1]

    if (selectedClientKey.value === clientKey) {
      if (neighbour) openConnection(neighbour)
      else openNewTab()
    }

    setTimeout(() => mqttConnectionsStore.hideConnection(clientKey), 1)
  }

  return {
    selectedClientKey,
    currentSection,
    openConnection,
    openSection,
    openNewTab,
    toggleSettings,
    closeConnection
  }
}
