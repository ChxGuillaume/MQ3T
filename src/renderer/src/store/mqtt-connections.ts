import { MqttConnection, MqttConnectionStatus } from '../../../types/mqtt-connection'
import { ElectronApi } from '../assets/js/electron-api'
import { defineStore } from 'pinia'

const clone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj))

export const useMqttConnectionsStore = defineStore('mqtt-connections', {
  state: () => ({
    connections: [] as MqttConnection[],
    connectionsStatus: {} as Record<string, MqttConnectionStatus>
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
    },
    hideConnection(clientKey: string) {
      delete this.connectionsStatus[clientKey]
    },
    connectClient(clientKey: string) {
      const status = this.connectionsStatus[clientKey]

      if (status !== undefined && status !== 'disconnected') return

      const client = this.getConnection(clientKey)

      if (!client) return

      ElectronApi.connectMqtt(clone(client))
    },
    disconnectClient(clientKey: string) {
      if (this.connectionsStatus[clientKey] !== 'connected') return

      ElectronApi.disconnectMqtt(clientKey)
    }
  }
})
