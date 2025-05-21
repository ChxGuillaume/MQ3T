import { BrowserWindow, ipcMain } from 'electron'
import { createWindow } from './createWindow'

let mainWindow: BrowserWindow | null = null
let graphWindow: BrowserWindow | null = null

const getWindowShown = () => {
  return graphWindow?.isVisible() || false
}

const sendMessage = (channel: string, data: any) => {
  mainWindow?.webContents.send(channel, data)
  graphWindow?.webContents.send(channel, data)
}

export const createGraphWindow = () => {
  graphWindow = createWindow('/graph')

  graphWindow.on('closed', () => {
    graphWindow = null

    sendMessage('update-graph-window-shown', false)
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

    sendMessage('update-graph-window-shown', true)
  })

  ipcMain.on('hide-graph-window', () => graphWindow?.hide())
}
