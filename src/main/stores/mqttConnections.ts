import { MqttConnection } from '../../types/mqtt-connection'
import { app, BrowserWindow, ipcMain } from 'electron'
import * as path from 'path'
import * as fs from 'fs'

let mqttConnections: MqttConnection[] = []
const registeredWindows = new Set<BrowserWindow>()

const configFolder = path.join(app.getPath('userData'), 'config')
const mqttConnectionsFilePath = path.join(configFolder, 'mqtt-connections.json')

fs.mkdirSync(configFolder, { recursive: true })

const sendMessage = (channel: string, data: any) => {
  for (const window of registeredWindows) {
    if (!window.isDestroyed()) {
      window.webContents.send(channel, data)
    }
  }
}

const readMqttConnectionsFromFile = (): MqttConnection[] => {
  if (fs.existsSync(mqttConnectionsFilePath)) {
    try {
      return JSON.parse(fs.readFileSync(mqttConnectionsFilePath).toString())
    } catch (e) {
      console.error('Error reading MQTT connections file:', e)
      return []
    }
  }
  return []
}

const writeMqttConnectionsToFile = (connections: MqttConnection[]) => {
  try {
    fs.writeFileSync(mqttConnectionsFilePath, JSON.stringify(connections))
  } catch (e) {
    console.error('Error writing MQTT connections file:', e)
  }
}

const loadMqttConnections = () => {
  mqttConnections = readMqttConnectionsFromFile()
}

export const registerMqttConnectionsHandler = (window: BrowserWindow) => {
  if (registeredWindows.has(window)) return

  registeredWindows.add(window)

  if (!window.isDestroyed()) {
    window.webContents.send('load-mqtt-connections', mqttConnections)
  }
}

export const unregisterMqttConnectionsHandler = (window: BrowserWindow) => {
  registeredWindows.delete(window)
}

export const initMqttConnectionsHandlers = () => {
  loadMqttConnections()

  ipcMain.on('save-mqtt-connections', (_, connections: MqttConnection[]) => {
    mqttConnections = connections
    writeMqttConnectionsToFile(connections)
    sendMessage('load-mqtt-connections', connections)
  })

  ipcMain.on('get-mqtt-connections-sync', (event) => {
    event.returnValue = mqttConnections
  })

  ipcMain.on('init-renderer', (event) => {
    event.reply('load-mqtt-connections', mqttConnections)
  })
}

export const getMqttConnections = (): MqttConnection[] => {
  return mqttConnections
}
