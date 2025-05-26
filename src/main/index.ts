import { MqttConnection, MqttConnectionStatus } from '../types/mqtt-connection'
import { getGraphWindow, initGraphWindowHandlers } from './windowGraph'
import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import installExtension from 'electron-devtools-installer'
import { initDataGraphHandlers } from './stores/dataGraph'
import { HasAutoUpdate } from './constants/hasAutoUpdate'
import { initAutoUpdater } from './initAutoUpdater'
import { autoUpdater } from 'electron-updater'
import { createWindow } from './createWindow'
import { MqttClient } from './mqtt-client'
import * as path from 'path'
import * as dns from 'dns'
import * as fs from 'fs'
import './express/main'
import { b } from './express/main'
import { registerEvents } from './express/routes/register'
import FileFilter = Electron.FileFilter

// Listen for registration triggered event and forward to renderer
registerEvents.on('registration-triggered', (pin: string) => {
  if (!mainWindow) return

  // Send the event to the renderer process
  mainWindow.webContents.send('registration-triggered', pin)
})

// Listen for registration completion
registerEvents.on('registration-completed', () => {
  if (mainWindow) {
    // Send the event to the renderer process
    mainWindow.webContents.send('registration-completed')
  }
})

// Listen for registration cancellation
registerEvents.on('registration-canceled', () => {
  if (mainWindow) {
    // Send the event to the renderer process
    mainWindow.webContents.send('registration-canceled')
  }
})

const mqttClients: Map<string, MqttClient> = new Map()
const mqttClientsState: Map<string, MqttConnectionStatus> = new Map()
const configFolder = path.join(app.getPath('userData'), 'config')
const configFilePath = {
  mqttConnections: path.join(configFolder, 'mqtt-connections.json'),
  actions: path.join(configFolder, 'actions.json'),
  chainActions: path.join(configFolder, 'chain-actions.json'),
  actionsGroups: path.join(configFolder, 'actions-groups.json')
}

const IS_MAS = process.mas

fs.mkdirSync(configFolder, { recursive: true })

let mainWindow: BrowserWindow | null

app.commandLine.appendSwitch('disable-features', 'WidgetLayering')

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.chx-guillaume.mq3t')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  installExtension('nhdogjmejiglipccpnnnanhbledajbpd')
    .then((extension) => console.log(`Added Extension: ${extension.name}`))
    .catch((err) => console.log('An error occurred: ', err))

  mainWindow = createWindow()

  mainWindow?.on('close', () => {
    for (const client of mqttClients.values()) {
      client.disconnect()
    }
  })

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) mainWindow = createWindow()
  })

  initAutoUpdater(mainWindow)
  initGraphWindowHandlers(mainWindow)
  initDataGraphHandlers()
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' || IS_MAS) {
    app.quit()
    console.log('Unpublish all services from bonjour')
    b.unpublishAll()
  }
})

app.on('before-quit', () => {
  console.log('Unpublish all services from bonjour 2')
  b.unpublishAll()
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

const readJsonFile = (filePath: string) => {
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath).toString())
    } catch (e) {
      return undefined
    }
  }
}

const readActionsFile = () => {
  const data = readJsonFile(configFilePath.actions)

  if (!data) return undefined

  if (!data.type) {
    return { type: 'v1', actions: data }
  } else return data
}

const initIpcMain = () => {
  ipcMain.on('init-renderer', (event) => {
    mqttClients.forEach((_, clientKey) => {
      event.reply('mqtt-status', {
        clientKey,
        status: mqttClientsState.get(clientKey) || 'disconnected'
      })
    })

    const connections = readJsonFile(configFilePath.mqttConnections)
    const actions = readActionsFile()
    const chainActions = readJsonFile(configFilePath.chainActions)
    const actionsGroups = readJsonFile(configFilePath.actionsGroups)

    if (connections) event.reply('load-mqtt-connections', connections)
    if (actions) event.reply('load-actions', actions)
    if (chainActions) event.reply('load-chain-actions', chainActions)
    if (actionsGroups) event.reply('load-actions-groups', actionsGroups)

    event.reply('app-version', app.getVersion())
  })

  ipcMain.on('import-data', (_, fileFilter?: FileFilter[]) => {
    const filePath = dialog.showOpenDialogSync({
      defaultPath: app.getPath('downloads'),
      properties: ['openFile'],
      filters: fileFilter
    })

    if (!filePath) return

    const data = fs.readFileSync(filePath[0]).toString()

    sendMessageToRenderer('import-data', data)
  })

  ipcMain.on('export-data', (_, fileName, data, fileFilter) => {
    const filePath = dialog.showSaveDialogSync({
      defaultPath: path.join(app.getPath('documents'), fileName),
      filters: fileFilter
    })

    if (!filePath) return

    fs.writeFileSync(filePath, data)
  })

  ipcMain.on('open-url', (_, url) => {
    shell.openExternal(url).then()
  })

  ipcMain.on('download-update', () => {
    autoUpdater.downloadUpdate()
  })

  ipcMain.on('check-for-updates', () => {
    if (HasAutoUpdate) autoUpdater.checkForUpdates()
  })

  ipcMain.on('quit-and-install-update', () => {
    autoUpdater.quitAndInstall(true, true)
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

  ipcMain.on('save-actions', (_, actions) => {
    fs.writeFileSync(configFilePath.actions, JSON.stringify(actions))
  })

  ipcMain.on('save-chain-actions', (_, chainActions) => {
    fs.writeFileSync(configFilePath.chainActions, JSON.stringify(chainActions))
  })

  ipcMain.on('save-actions-groups', (_, actionsGroups) => {
    fs.writeFileSync(configFilePath.actionsGroups, JSON.stringify(actionsGroups))
  })
}

initIpcMain()
