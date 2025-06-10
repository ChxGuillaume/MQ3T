import { initGraphWindowHandlers } from './windowGraph'
import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import installExtension from 'electron-devtools-installer'
import { initDataGraphHandlers } from './stores/dataGraph'
import { initMqttConnectionsHandlers } from './stores/mqttConnections'
import { disconnectAllClients, initMqttClientsHandlers } from './stores/mqttClients'
import { HasAutoUpdate } from './constants/hasAutoUpdate'
import { initAutoUpdater } from './initAutoUpdater'
import { autoUpdater } from 'electron-updater'
import { createWindow } from './createWindow'
import { b } from './express/main'
import * as path from 'path'
import * as fs from 'fs'
import './express/main'
import FileFilter = Electron.FileFilter
import { registerEvents } from './express/controllers/auth.controller'

registerEvents.on('registration-triggered', (pin: string) => {
  if (!mainWindow) return

  mainWindow.webContents.send('registration-triggered', pin)
})

registerEvents.on('registration-completed', () => {
  if (!mainWindow) return

  mainWindow.webContents.send('registration-completed')
})

registerEvents.on('registration-canceled', () => {
  if (!mainWindow) return

  mainWindow.webContents.send('registration-canceled')
})

const configFolder = path.join(app.getPath('userData'), 'config')
const configFilePath = {
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
    // Disconnect all MQTT clients when the window is closed
    disconnectAllClients()
  })

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) mainWindow = createWindow()
  })

  initAutoUpdater(mainWindow)
  initGraphWindowHandlers(mainWindow)
  initDataGraphHandlers()
  initMqttConnectionsHandlers()
  initMqttClientsHandlers()
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
    const actions = readActionsFile()
    const chainActions = readJsonFile(configFilePath.chainActions)
    const actionsGroups = readJsonFile(configFilePath.actionsGroups)

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
