import { BrowserWindow, ipcMain, app } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import { convertActionsFileV1toV2 } from '../utils/actionsConvert'
import { ConnectionsActionsFile, ConnectionsActionsFileV2 } from '../../types/actions'

let actions: ConnectionsActionsFileV2 | undefined

export const getActions = (): ConnectionsActionsFile | undefined => {
  return actions
}
const registeredWindows = new Set<BrowserWindow>()
const configFolder = path.join(app.getPath('userData'), 'config')
const actionsFilePath = path.join(configFolder, 'actions.json')

fs.mkdirSync(configFolder, { recursive: true })

const sendMessage = (channel: string, data: any) => {
  for (const window of registeredWindows) {
    if (!window.isDestroyed()) {
      window.webContents.send(channel, data)
    }
  }
}

export const registerActionsHandler = (window: BrowserWindow) => {
  if (registeredWindows.has(window)) return

  registeredWindows.add(window)

  if (!window.isDestroyed() && actions) {
    window.webContents.send('load-actions', actions)
  }
}

export const unregisterActionsHandler = (window: BrowserWindow) => {
  registeredWindows.delete(window)
}

const readActionsFile = (): ConnectionsActionsFileV2 | undefined => {
  if (fs.existsSync(actionsFilePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(actionsFilePath).toString()) as ConnectionsActionsFile

      if (!data) return undefined

      if (!data.type) {
        return convertActionsFileV1toV2({ type: 'v1', actions: data })
      } else if (data.type === 'v2') {
        return data
      }
    } catch (e) {
      return undefined
    }
  }
  return undefined
}

export const initActionsHandlers = () => {
  actions = readActionsFile()

  ipcMain.on('init-renderer', (event) => {
    if (actions) {
      event.reply('load-actions', actions)
    }
  })

  ipcMain.on('save-actions', (_, newActions) => {
    actions = newActions
    fs.writeFileSync(actionsFilePath, JSON.stringify(newActions))
    sendMessage('load-actions', newActions)
  })
}
