import { MqttConnection, MqttConnectionStatus } from '../../types/mqtt-connection'
import { BrowserWindow, ipcMain } from 'electron'
import { getGraphWindow } from '../windowGraph'
import { MqttClient } from '../mqtt-client'
import * as dns from 'dns'

const clients: Map<string, MqttClient> = new Map()
const clientsState: Map<string, MqttConnectionStatus> = new Map()
const registeredWindows = new Set<BrowserWindow>()
const clientsTopics: Map<string, Map<string, string>> = new Map()

const sendMessageToRenderer = (channel: string, ...args: any[]) => {
  for (const window of registeredWindows) {
    if (!window.isDestroyed()) {
      window.webContents.send(channel, ...args)
    }
  }
}

const createConnection = async (connection: MqttConnection) => {
  const clientKey = connection.clientKey

  if (clientsState.get(clientKey) === 'connecting') return

  clientsState.set(clientKey, 'connecting')

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

  clients.set(clientKey, clientMqtt)

  clientMqtt.onError((error) => {
    sendMessageToRenderer('mqtt-error', { clientKey, error })
  })

  clientMqtt.onConnect(() => {
    clientsState.set(clientKey, 'connected')
    sendMessageToRenderer('mqtt-status', { clientKey, status: 'connected' })
  })

  clientMqtt.onReconnect(() => {
    clientsState.set(clientKey, 'reconnecting')
    sendMessageToRenderer('mqtt-status', { clientKey, status: 'reconnecting' })
  })

  clientMqtt.onMessage((topic, payload, packet) => {
    if (!clientsTopics.has(clientKey)) clientsTopics.set(clientKey, new Map())
    clientsTopics.get(clientKey)?.set(topic, payload.toString())

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

  clientMqtt.onDisconnect(() => {})

  connection.subscribedTopics.forEach((topic) => {
    clientMqtt.subscribe(topic.topic, { qos: topic.qos, rap: true })
  })
}

const disconnectClient = (clientKey: string) => {
  clients.get(clientKey)?.disconnect()
  clients.delete(clientKey)

  clientsState.set(clientKey, 'disconnected')
  sendMessageToRenderer('mqtt-status', { clientKey, status: 'disconnected' })
}

export const disconnectAllClients = () => {
  for (const client of clients.values()) {
    client.disconnect()
  }

  clients.clear()

  for (const clientKey of clientsState.keys()) {
    clientsState.set(clientKey, 'disconnected')
    sendMessageToRenderer('mqtt-status', { clientKey, status: 'disconnected' })
  }
}

export const registerMqttClientsHandler = (window: BrowserWindow) => {
  if (registeredWindows.has(window)) return

  registeredWindows.add(window)

  if (!window.isDestroyed()) {
    clients.forEach((_, clientKey) => {
      window.webContents.send('mqtt-status', {
        clientKey,
        status: clientsState.get(clientKey) || 'disconnected'
      })
    })
  }
}

export const unregisterMqttClientsHandler = (window: BrowserWindow) => {
  registeredWindows.delete(window)
}

export const initMqttClientsHandlers = () => {
  ipcMain.on('connect-mqtt', (_, connection: MqttConnection) => {
    createConnection(connection).then()
  })

  ipcMain.on('disconnect-mqtt', (_, clientKey: string) => {
    disconnectClient(clientKey)
  })

  ipcMain.on('send-mqtt-message', (_, { clientKey, topic, message, options }) => {
    clients.get(clientKey)?.publish(topic, message, options)
  })

  ipcMain.on('init-renderer', (event) => {
    clients.forEach((_, clientKey) => {
      event.reply('mqtt-status', {
        clientKey,
        status: clientsState.get(clientKey) || 'disconnected'
      })
    })
  })
}

export const getMqttClient = (clientKey: string): MqttClient | undefined => {
  return clients.get(clientKey)
}

export const getMqttClientStatus = (clientKey: string): MqttConnectionStatus | undefined => {
  return clientsState.get(clientKey)
}

export const getAllMqttClients = (): Map<string, MqttClient> => {
  return clients
}

export const getAllMqttClientStatuses = (): Map<string, MqttConnectionStatus> => {
  return clientsState
}

export const getAllMqttClientTopics = (clientKey: string): string[] => {
  return Array.from(clientsTopics.get(clientKey)?.keys() || [])
}
