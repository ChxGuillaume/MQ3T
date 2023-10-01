import { defineStore } from 'pinia'

export const useMqttConnectionsStore = defineStore('mqtt-connections', {
  state: () => ({
    connections: []
  }),
  actions: {
    addConnection(connection: never) {
      this.connections.push(connection)
    }
  }
})
