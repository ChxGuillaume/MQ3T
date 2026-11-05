import { useMqttConnectionsStore } from '@renderer/store/mqtt-connections'
import { useAppNavigation } from '@renderer/composables/useAppNavigation'
import { MqttConnection } from '../../../types/mqtt-connection'
import { useAppStore } from '@renderer/store/app-store'
import type { DropdownMenuItem } from '@nuxt/ui'
import { v4 as uuidV4 } from 'uuid'

export const labelColorStyle = (labelColor?: string | null) =>
  labelColor ? { color: `var(--color-${labelColor}-500)` } : undefined

export const connectionInitials = (name: string) => {
  const words = name
    .trim()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)

  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()

  return (words[0] ?? '?').slice(0, 2).toUpperCase()
}

export function useConnectionActions() {
  const mqttConnectionsStore = useMqttConnectionsStore()
  const appStore = useAppStore()

  const { openConnection } = useAppNavigation()

  const isOpen = (clientKey: string) => !!mqttConnectionsStore.connectionsStatus[clientKey]

  const duplicate = (connection: MqttConnection) => {
    const copy: MqttConnection = {
      ...JSON.parse(JSON.stringify(connection)),
      clientKey: `connection-${uuidV4()}`,
      clientId: `mq3t_${uuidV4()}`,
      name: `${connection.name} (copy)`
    }

    mqttConnectionsStore.duplicateConnection(connection.clientKey, copy)
  }

  const reconnect = (clientKey: string) => {
    mqttConnectionsStore.disconnectClient(clientKey)

    setTimeout(() => mqttConnectionsStore.connectClient(clientKey), 1000)
  }

  const connectionItems = (connection: MqttConnection): DropdownMenuItem[][] => {
    const status = mqttConnectionsStore.getConnectionStatus(connection.clientKey)

    return [
      [
        {
          label: isOpen(connection.clientKey) ? 'Go to tab' : 'Connect',
          icon: isOpen(connection.clientKey) ? 'i-lucide-arrow-right' : 'i-lucide-plug',
          onSelect: () => openConnection(connection.clientKey)
        },
        ...(status !== 'disconnected'
          ? [
              {
                label: 'Disconnect',
                icon: 'i-lucide-unplug',
                onSelect: () => mqttConnectionsStore.disconnectClient(connection.clientKey)
              }
            ]
          : [])
      ],
      [
        {
          label: 'Edit',
          icon: 'i-lucide-pencil',
          onSelect: () => appStore.openConnectionEditor(connection.clientKey)
        },
        {
          label: 'Duplicate',
          icon: 'i-lucide-copy',
          onSelect: () => duplicate(connection)
        }
      ],
      [
        {
          label: 'Delete',
          icon: 'i-lucide-trash-2',
          color: 'error',
          onSelect: () => mqttConnectionsStore.removeConnection(connection.clientKey)
        }
      ]
    ]
  }

  return { connectionItems, duplicate, reconnect, isOpen }
}
