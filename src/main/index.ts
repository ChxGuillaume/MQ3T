import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import installExtension from 'electron-devtools-installer'
import { app, BrowserWindow, shell } from 'electron'
import icon from '../../resources/icon.png?asset'
import { MqttClient } from './mqtt-client'
import { join } from 'path'

const mqttClients: Map<string, MqttClient> = new Map()

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  setTimeout(() => {
    createConnection(mainWindow, 'test')
  }, 3000)

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
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
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
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
const createConnection = (mainWindow: BrowserWindow, clientKey: string) => {
  const clientMqtt = new MqttClient()

  mqttClients.set(clientKey, clientMqtt)

  clientMqtt.onError((error) => {
    mainWindow.webContents.send('mqtt-error', { clientKey, error })
  })

  clientMqtt.onConnect(() => {
    mainWindow.webContents.send('mqtt-connected', { clientKey })
  })

  clientMqtt.onMessage((topic, payload, packet) => {
    mainWindow.webContents.send('mqtt-message', {
      clientKey,
      topic,
      payload,
      packet,
      message: payload.toString()
    })
  })

  clientMqtt.onDisconnect(() => {
    mainWindow.webContents.send('mqtt-disconnected', { clientKey })
  })

  clientMqtt.subscribe('nekotiki/#')

  setTimeout(() => {
    clientMqtt.publish('nekotiki/test', 'Hello World!')
  }, 3000)
}
