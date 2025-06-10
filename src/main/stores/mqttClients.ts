import { MqttConnection, MqttConnectionStatus } from '../../types/mqtt-connection'
import { BrowserWindow, ipcMain } from 'electron'
import { getGraphWindow } from '../windowGraph'
import { MqttClient } from '../mqtt-client'
import * as dns from 'dns'

// Store state
const mqttClients: Map<string, MqttClient> = new Map()
const mqttClientsState: Map<string, MqttConnectionStatus> = new Map()
const registeredWindows = new Set<BrowserWindow>()

// Helper function to send messages to all registered windows
const sendMessageToRenderer = (channel: string, ...args: any[]) => {
  for (const window of registeredWindows) {
    if (!window.isDestroyed()) {
      window.webContents.send(channel, ...args)
    }
  }
}

// Create a new MQTT connection
const createConnection = async (connection: MqttConnection) => {
  const clientKey = connection.clientKey

  if (mqttClientsState.get(clientKey) === 'connecting') return

  mqttClientsState.set(clientKey, 'connecting')

  sendMessageToRenderer('mqtt-status', { clientKey, status: 'connecting' })

  if (connection.hostname.includes('.local')) {
    try {
      const resolvedIp = await new Promise((resolve, reject) => {
        dns.lookup(connection.hostname, { family: 4 }, (err, address) => {
          if (err) reject(err)
          else resolve(address)
        })
      })

      connection.hostname = resolvedIp as string
    } catch (e) {
      sendMessageToRenderer('mqtt-error', { clientKey, error: e })
      return
    }
  }

  const clientMqtt = new MqttClient(connection)

  mqttClients.set(clientKey, clientMqtt)

  clientMqtt.onError((error) => {
    sendMessageToRenderer('mqtt-error', { clientKey, error })
  })

  clientMqtt.onConnect(() => {
    mqttClientsState.set(clientKey, 'connected')
    sendMessageToRenderer('mqtt-status', { clientKey, status: 'connected' })
  })

  clientMqtt.onReconnect(() => {
    mqttClientsState.set(clientKey, 'reconnecting')
    sendMessageToRenderer('mqtt-status', { clientKey, status: 'reconnecting' })
  })

  clientMqtt.onMessage((topic, payload, packet) => {
    const message = {
      clientKey,
      topic,
      payload,
      packet,
      message: payload.toString()
    }

    sendMessageToRenderer('mqtt-message', message)
    getGraphWindow()?.webContents.send('mqtt-message', message)
  })

  clientMqtt.onDisconnect(() => {
    // mqttClientsState.set(clientKey, 'disconnected')
    // sendMessageToRenderer('mqtt-status', { clientKey, status: 'disconnected' })
  })

  connection.subscribedTopics.forEach((topic) => {
    clientMqtt.subscribe(topic.topic, { qos: topic.qos, rap: true })
  })
}

// Disconnect a client
const disconnectClient = (clientKey: string) => {
  mqttClients.get(clientKey)?.disconnect()
  mqttClients.delete(clientKey)

  mqttClientsState.set(clientKey, 'disconnected')
  sendMessageToRenderer('mqtt-status', { clientKey, status: 'disconnected' })
}

// Disconnect all clients
export const disconnectAllClients = () => {
  for (const client of mqttClients.values()) {
    client.disconnect()
  }

  mqttClients.clear()

  for (const clientKey of mqttClientsState.keys()) {
    mqttClientsState.set(clientKey, 'disconnected')
    sendMessageToRenderer('mqtt-status', { clientKey, status: 'disconnected' })
  }
}

// Register a window to receive updates
export const registerMqttClientsHandler = (window: BrowserWindow) => {
  if (registeredWindows.has(window)) return

  registeredWindows.add(window)

  // Send current status to the newly registered window
  if (!window.isDestroyed()) {
    mqttClients.forEach((_, clientKey) => {
      window.webContents.send('mqtt-status', {
        clientKey,
        status: mqttClientsState.get(clientKey) || 'disconnected'
      })
    })
  }
}

// Unregister a window
export const unregisterMqttClientsHandler = (window: BrowserWindow) => {
  registeredWindows.delete(window)
}

// Initialize IPC handlers
export const initMqttClientsHandlers = () => {
  ipcMain.on('connect-mqtt', (_, connection: MqttConnection) => {
    createConnection(connection).then()
  })

  ipcMain.on('disconnect-mqtt', (_, clientKey: string) => {
    disconnectClient(clientKey)
  })

  ipcMain.on('send-mqtt-message', (_, { clientKey, topic, message, options }) => {
    mqttClients.get(clientKey)?.publish(topic, message, options)
  })

  // When a renderer process initializes, send it the current status of all clients
  ipcMain.on('init-renderer', (event) => {
    mqttClients.forEach((_, clientKey) => {
      event.reply('mqtt-status', {
        clientKey,
        status: mqttClientsState.get(clientKey) || 'disconnected'
      })
    })
  })
}

// Get a specific MQTT client
export const getMqttClient = (clientKey: string): MqttClient | undefined => {
  return mqttClients.get(clientKey)
}

// Get the status of a specific MQTT client
export const getMqttClientStatus = (clientKey: string): MqttConnectionStatus | undefined => {
  return mqttClientsState.get(clientKey)
}

// Get all MQTT clients
export const getAllMqttClients = (): Map<string, MqttClient> => {
  return mqttClients
}

// Get all MQTT client statuses
export const getAllMqttClientStatuses = (): Map<string, MqttConnectionStatus> => {
  return mqttClientsState
}
