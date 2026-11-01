import { MqttConnection, MqttConnectionStatus } from '../../../types/mqtt-connection'
import { ElectronApi } from '../assets/js/electron-api'
import { defineStore } from 'pinia'

const clone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj))

export const useMqttConnectionsStore = defineStore('mqtt-connections', {
  state: () => ({
    connections: [] as MqttConnection[],
    connectionsStatus: {} as Record<string, MqttConnectionStatus>,
    connectedAt: {} as Record<string, number>,
    reconnectAttempts: {} as Record<string, number>,
    lastErrors: {} as Record<string, string>
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
      return this.connections.filter((connection) => {
        return this.connectionsStatus[connection.clientKey]
      })
    },
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

      this.connections = this.connections.filter((connection) => connection.clientKey !== clientKey)

      this.saveConnections()
    },
    saveConnections() {
      ElectronApi.saveMqttConnections(JSON.parse(JSON.stringify(this.connections)))
    },
    setConnectionStatus(clientKey: string, status: MqttConnectionStatus) {
      this.connectionsStatus[clientKey] = status

      if (status === 'connected') {
        this.connectedAt[clientKey] = Date.now()
        delete this.reconnectAttempts[clientKey]
        delete this.lastErrors[clientKey]
      } else if (status === 'reconnecting') {
        this.reconnectAttempts[clientKey] = (this.reconnectAttempts[clientKey] ?? 0) + 1
      }

      if (status !== 'connected') delete this.connectedAt[clientKey]
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
