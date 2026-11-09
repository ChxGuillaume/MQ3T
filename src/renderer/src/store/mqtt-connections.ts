import { MqttConnection, MqttConnectionStatus } from '../../../types/mqtt-connection'
import { ElectronApi } from '../assets/js/electron-api'
import { useActionsStore } from './actions'
import { defineStore } from 'pinia'

const clone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj))

export const useMqttConnectionsStore = defineStore('mqtt-connections', {
  state: () => ({
    connections: [] as MqttConnection[],
    connectionsStatus: {} as Record<string, MqttConnectionStatus>,
    connectedAt: {} as Record<string, number>,
    reconnectAttempts: {} as Record<string, number>,
    lastErrors: {} as Record<string, string>,
    latencies: {} as Record<string, number>,
    tabOrder: [] as string[]
  }),
  getters: {
    getConnection:
      (state) =>
      (clientKey: string): MqttConnection | undefined => {
        return state.connections.find(
          (connection: MqttConnection) => connection.clientKey === clientKey
        )
      },
    getConnectionsWithStatus(): MqttConnection[] {
      return this.tabOrder
        .filter((clientKey) => this.connectionsStatus[clientKey])
        .map((clientKey) => this.getConnection(clientKey))
        .filter((connection): connection is MqttConnection => !!connection)
    },
    savedConnections: (state): MqttConnection[] =>
      state.connections.filter((connection) => !connection.temporary),
    temporaryConnections: (state): MqttConnection[] =>
      state.connections.filter((connection) => connection.temporary),
    isTemporary:
      (state) =>
      (clientKey: string): boolean =>
        !!state.connections.find((connection) => connection.clientKey === clientKey)?.temporary,
    getConnectionsFromClientKeyList: (state) => (clientKeyList: string[]) => {
      return state.connections.filter((connection) => {
        return clientKeyList.includes(connection.clientKey)
      })
    },
    getConnectedConnections: (state): MqttConnection[] => {
      return state.connections.filter((connection) => {
        return state.connectionsStatus[connection.clientKey] === 'connected'
      })
    },
    getConnectionStatus:
      (state) =>
      (clientKey: string): MqttConnectionStatus => {
        return state.connectionsStatus[clientKey] || 'disconnected'
      }
  },
  actions: {
    setConnections(connections: MqttConnection[], save = false) {
      this.connections = connections

      if (save) this.saveConnections()
    },
    addConnection(connection: MqttConnection) {
      this.connections.push(connection)

      this.saveConnections()
    },
    updateConnection(connection: MqttConnection) {
      this.connections = this.connections.map((con) => {
        if (con.clientKey === connection.clientKey) {
          return connection
        }

        return con
      })

      this.saveConnections()
    },
    removeConnection(clientKey: string) {
      this.disconnectClient(clientKey)
      useActionsStore().removeConnectionFromSharing(clientKey)

      this.connections = this.connections.filter((connection) => connection.clientKey !== clientKey)
      this.removeFromTabOrder(clientKey)

      this.saveConnections()
    },
    saveConnections() {
      ElectronApi.saveMqttConnections(JSON.parse(JSON.stringify(this.savedConnections)))
    },
    addTemporaryConnection(connection: MqttConnection) {
      this.connections.push({ ...connection, temporary: true })
    },
    discardTemporaryConnection(clientKey: string) {
      if (!this.isTemporary(clientKey)) return

      this.disconnectClient(clientKey)
      this.hideConnection(clientKey)
      this.connections = this.connections.filter((connection) => connection.clientKey !== clientKey)
    },
    setConnectionStatus(clientKey: string, status: MqttConnectionStatus) {
      this.connectionsStatus[clientKey] = status

      if (!this.tabOrder.includes(clientKey)) this.tabOrder.push(clientKey)

      if (status === 'connected') {
        this.connectedAt[clientKey] = Date.now()
        delete this.reconnectAttempts[clientKey]
        delete this.lastErrors[clientKey]
      } else if (status === 'reconnecting') {
        this.reconnectAttempts[clientKey] = (this.reconnectAttempts[clientKey] ?? 0) + 1
      }

      if (status !== 'connected') {
        delete this.connectedAt[clientKey]
        delete this.latencies[clientKey]
      }
    },
    setConnectionLatency(clientKey: string, latency: number) {
      if (this.connectionsStatus[clientKey] !== 'connected') return

      this.latencies[clientKey] = latency
    },
    setConnectionError(clientKey: string, message: string) {
      this.lastErrors[clientKey] = message
    },
    duplicateConnection(clientKey: string, newConnection: MqttConnection) {
      const index = this.connections.findIndex((c) => c.clientKey === clientKey)

      this.connections.splice(index + 1, 0, newConnection)

      this.saveConnections()
    },
    hideConnection(clientKey: string) {
      delete this.connectionsStatus[clientKey]
      delete this.reconnectAttempts[clientKey]
      delete this.lastErrors[clientKey]
      delete this.latencies[clientKey]
      this.removeFromTabOrder(clientKey)
    },
    setTabOrder(clientKeys: string[]) {
      this.tabOrder = clientKeys
    },
    removeFromTabOrder(clientKey: string) {
      this.tabOrder = this.tabOrder.filter((key) => key !== clientKey)
    },
    connectClient(clientKey: string) {
      const status = this.connectionsStatus[clientKey]

      if (status !== undefined && status !== 'disconnected') return

      const client = this.getConnection(clientKey)

      if (!client) return

      ElectronApi.connectMqtt(clone(client))
    },
    disconnectClient(clientKey: string) {
      if (this.connectionsStatus[clientKey] === 'disconnected') return

      ElectronApi.disconnectMqtt(clientKey)
    }
  }
})
