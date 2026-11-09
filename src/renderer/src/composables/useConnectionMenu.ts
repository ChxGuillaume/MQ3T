import { useMqttConnectionsStore } from '@renderer/store/mqtt-connections'
import { useMqttTopicsStore } from '@renderer/store/mqtt-topics'
import { MqttConnection } from '../../../types/mqtt-connection'
import { useAppStore } from '@renderer/store/app-store'
import type { ContextMenuItem } from '@nuxt/ui'

export function useConnectionMenu() {
  const mqttConnectionsStore = useMqttConnectionsStore()
  const mqttTopicsStore = useMqttTopicsStore()
  const appStore = useAppStore()

  const reconnect = (connection: MqttConnection) => {
    mqttConnectionsStore.disconnectClient(connection.clientKey)

    setTimeout(() => mqttConnectionsStore.connectClient(connection.clientKey), 1000)
  }

  const connectionMenuItems = (
    connection: MqttConnection,
    onClose: (clientKey: string) => void
  ): ContextMenuItem[][] => {
    const status = mqttConnectionsStore.getConnectionStatus(connection.clientKey)

    const statusItems: ContextMenuItem[] =
      status === 'disconnected'
        ? [
            {
              label: 'Connect',
              icon: 'i-lucide-plug',
              onSelect: () => mqttConnectionsStore.connectClient(connection.clientKey)
            }
          ]
        : [
            {
              label: 'Reconnect',
              icon: 'i-lucide-refresh-cw',
              onSelect: () => reconnect(connection)
            },
            {
              label: 'Disconnect',
              icon: 'i-lucide-unplug',
              onSelect: () => mqttConnectionsStore.disconnectClient(connection.clientKey)
            }
          ]

    const temporaryItems: ContextMenuItem[] = connection.temporary
      ? [
          {
            label: 'Save connection…',
            icon: 'i-lucide-save',
            onSelect: () => appStore.openConnectionEditor(connection.clientKey)
          }
        ]
      : []

    const discardItems: ContextMenuItem[] = connection.temporary
      ? [
          {
            label: 'Discard connection',
            icon: 'i-lucide-trash-2',
            color: 'error',
            onSelect: () => {
              onClose(connection.clientKey)
              mqttConnectionsStore.discardTemporaryConnection(connection.clientKey)
            }
          }
        ]
      : []

    return [
      statusItems,
      [
        {
          label: 'Clear all topics',
          icon: 'i-lucide-eraser',
          onSelect: () => mqttTopicsStore.clearConnectionMessages(connection.clientKey)
        },
        ...temporaryItems
      ],
      [
        {
          label: 'Close tab',
          icon: 'i-lucide-x',
          color: 'error',
          onSelect: () => onClose(connection.clientKey)
        },
        ...discardItems
      ]
    ]
  }

  return { connectionMenuItems }
}
