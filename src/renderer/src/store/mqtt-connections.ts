import { MqttConnection } from '../../../types/mqtt-connection'
import { defineStore } from 'pinia'

type MqttConnectionStatus = 'connected' | 'connecting' | 'disconnected'

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
    loadConnections() {
      this.connections = localStorage.getItem('mqtt-connections')
        ? JSON.parse(localStorage.getItem('mqtt-connections')!)
        : []
    },
    addConnection(connection: MqttConnection) {
      this.connections.push(connection)

      localStorage.setItem('mqtt-connections', JSON.stringify(this.connections))
    },
    updateConnection(connection: MqttConnection) {
      this.connections = this.connections.map((con) => {
        if (con.clientKey === connection.clientKey) {
          return connection
        }

        return con
      })

      localStorage.setItem('mqtt-connections', JSON.stringify(this.connections))
    },
    removeConnection(clientKey: string) {
      this.connections = this.connections.filter((connection) => connection.clientKey !== clientKey)

      localStorage.setItem('mqtt-connections', JSON.stringify(this.connections))
    },
    setConnectionStatus(clientKey: string, status: 'connected' | 'connecting' | 'disconnected') {
      this.connectionsStatus[clientKey] = status
    },
    hideConnection(clientKey: string) {
      delete this.connectionsStatus[clientKey]
    }
  }
})
