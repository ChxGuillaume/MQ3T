import { BrowserWindow, ipcMain } from 'electron'
import { createWindow } from './createWindow'

let mainWindow: BrowserWindow | null = null
let graphWindow: BrowserWindow | null = null

const getWindowShown = () => {
  return graphWindow?.isVisible() || false
}

const sendMessageToMain = (channel: string, data?: any) => {
  mainWindow?.webContents.send(channel, data)
}

const sendMessageToGraph = (channel: string, data?: any) => {
  graphWindow?.webContents.send(channel, data)
}

export const createGraphWindow = () => {
  graphWindow = createWindow('/graph')

  graphWindow.on('closed', () => {
    graphWindow = null

    sendMessageToMain('update-graph-window-shown', false)
  })
}

export const getGraphWindow = () => graphWindow

export const initGraphWindowHandlers = (window: BrowserWindow) => {
  mainWindow = window

  ipcMain.on('get-graph-window-shown', (event) => {
    event.returnValue = getWindowShown()
  })

  ipcMain.on('show-graph-window', () => {
    if (graphWindow) graphWindow.show()
    else createGraphWindow()

    sendMessageToMain('update-graph-window-shown', true)
  })

  ipcMain.on('hide-graph-window', () => graphWindow?.hide())

  ipcMain.on('transfer-mqtt-messages', (_, messages) => {
    sendMessageToGraph('load-mqtt-messages', messages)
  })

  ipcMain.on('request-mqtt-messages', () => {
    sendMessageToMain('request-mqtt-messages')
  })
}
