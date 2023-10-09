import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import iconIcns from '../../resources/custom-mqtt-logo.icns?asset'
import iconIco from '../../resources/custom-mqtt-logo.ico?asset'
import { app, BrowserWindow, ipcMain, shell } from 'electron'
import installExtension from 'electron-devtools-installer'
import { MqttConnection } from '../types/mqtt-connection'
import { MqttClient } from './mqtt-client'
import * as path from 'path'
import * as fs from 'fs'

const mqttClients: Map<string, MqttClient> = new Map()
const mqttClientsState: Map<string, 'connected' | 'connecting' | 'disconnected'> = new Map()
const configFolder = path.join(app.getPath('userData'), 'config')
const configFilePath = {
  mqttConnections: path.join(configFolder, 'mqtt-connections.json')
}

fs.mkdirSync(configFolder, { recursive: true })

let mainWindow: BrowserWindow | null = null
function createWindow(): void {
  let icon = iconIco

  if (process.platform === 'darwin') icon = iconIcns

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    minWidth: 800,
    height: 800,
    minHeight: 600,
    icon,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  initIpcMain()

  mainWindow.on('close', () => {
    for (const client of mqttClients.values()) {
      client.disconnect()
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  installExtension('nhdogjmejiglipccpnnnanhbledajbpd')
    .then((name) => console.log(`Added Extension:  ${name}`))
    .catch((err) => console.log('An error occurred: ', err))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
const sendMessageToRenderer = (channel: string, ...args: any[]) => {
  if (!mainWindow) return
  if (mainWindow.isDestroyed()) return

  mainWindow.webContents.send(channel, ...args)
}

const createConnection = async (connection: MqttConnection) => {
  const clientKey = connection.clientKey

  mqttClientsState.set(clientKey, 'connecting')
  sendMessageToRenderer('mqtt-status', { clientKey, status: 'connecting' })

  const clientMqtt = new MqttClient(connection)

  mqttClients.set(clientKey, clientMqtt)

  clientMqtt.onError((error) => {
    sendMessageToRenderer('mqtt-error', { clientKey, error })
  })

  clientMqtt.onConnect(() => {
    mqttClientsState.set(clientKey, 'connected')
    sendMessageToRenderer('mqtt-status', { clientKey, status: 'connected' })
  })

  clientMqtt.onMessage((topic, payload, packet) => {
    sendMessageToRenderer('mqtt-message', {
      clientKey,
      topic,
      payload,
      packet,
      message: payload.toString()
    })
  })

  clientMqtt.onDisconnect(() => {
    // mqttClientsState.set(clientKey, 'disconnected')
    // sendMessageToRenderer('mqtt-status', { clientKey, status: 'disconnected' })
  })

  connection.subscribedTopics.forEach((topic) => {
    clientMqtt.subscribe(topic.topic, { qos: topic.qos })
  })
}

const initIpcMain = () => {
  ipcMain.on('init-renderer', (event) => {
    mqttClients.forEach((_, clientKey) => {
      event.reply('mqtt-status', {
        clientKey,
        status: mqttClientsState.get(clientKey) || 'disconnected'
      })
    })

    if (fs.existsSync(configFilePath.mqttConnections)) {
      try {
        const connections = JSON.parse(fs.readFileSync(configFilePath.mqttConnections).toString())

        event.reply('load-mqtt-connections', connections)
      } catch (e) {}
    }
  })

  ipcMain.on('connect-mqtt', (_, connection: MqttConnection) => {
    createConnection(connection).then()
  })

  ipcMain.on('disconnect-mqtt', (event, clientKey: string) => {
    mqttClients.get(clientKey)?.disconnect()
    mqttClients.delete(clientKey)

    mqttClientsState.set(clientKey, 'disconnected')
    event.reply('mqtt-status', { clientKey, status: 'disconnected' })
  })

  ipcMain.on('send-mqtt-message', (_, { clientKey, topic, message, options }) => {
    mqttClients.get(clientKey)?.publish(topic, message, options)
  })

  ipcMain.on('save-mqtt-connections', (_, connections: MqttConnection[]) => {
    fs.writeFileSync(configFilePath.mqttConnections, JSON.stringify(connections))
  })
}
