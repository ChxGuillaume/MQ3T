import { BrowserWindow, ipcMain, app } from 'electron'
import * as path from 'path'
import * as fs from 'fs'

// Define the type for chain actions (this might need to be adjusted based on the actual type)
type ChainActionsData = any

let chainActions: ChainActionsData | undefined
const registeredWindows = new Set<BrowserWindow>()
const configFolder = path.join(app.getPath('userData'), 'config')
const chainActionsFilePath = path.join(configFolder, 'chain-actions.json')

// Ensure config folder exists
fs.mkdirSync(configFolder, { recursive: true })

const sendMessage = (channel: string, data: any) => {
  for (const window of registeredWindows) {
    if (!window.isDestroyed()) {
      window.webContents.send(channel, data)
    }
  }
}

export const registerChainActionsHandler = (window: BrowserWindow) => {
  if (registeredWindows.has(window)) return

  registeredWindows.add(window)

  if (!window.isDestroyed() && chainActions) {
    window.webContents.send('load-chain-actions', chainActions)
  }
}

export const unregisterChainActionsHandler = (window: BrowserWindow) => {
  registeredWindows.delete(window)
}

const readChainActionsFile = (): ChainActionsData | undefined => {
  if (fs.existsSync(chainActionsFilePath)) {
    try {
      return JSON.parse(fs.readFileSync(chainActionsFilePath).toString())
    } catch (e) {
      return undefined
    }
  }
  return undefined
}

export const initChainActionsHandlers = () => {
  // Load chain actions from file
  chainActions = readChainActionsFile()

  // Handle initialization request from renderer
  ipcMain.on('init-renderer', (event) => {
    if (chainActions) {
      event.reply('load-chain-actions', chainActions)
    }
  })

  // Handle save chain actions request
  ipcMain.on('save-chain-actions', (_, newChainActions) => {
    chainActions = newChainActions
    fs.writeFileSync(chainActionsFilePath, JSON.stringify(newChainActions))
    sendMessage('load-chain-actions', newChainActions)
  })
}
