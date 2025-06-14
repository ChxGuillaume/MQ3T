import { BrowserWindow, ipcMain, app } from 'electron'
import { ExportGroupsFile } from '../../types/actions'
import * as path from 'path'
import * as fs from 'fs'

let actionsGroups: ExportGroupsFile | undefined
const registeredWindows = new Set<BrowserWindow>()
const configFolder = path.join(app.getPath('userData'), 'config')
const actionsGroupsFilePath = path.join(configFolder, 'actions-groups.json')

export const getActionsGroups = (): ExportGroupsFile | undefined => {
  return actionsGroups
}

fs.mkdirSync(configFolder, { recursive: true })

const sendMessage = (channel: string, data: any) => {
  for (const window of registeredWindows) {
    if (!window.isDestroyed()) {
      window.webContents.send(channel, data)
    }
  }
}

export const registerActionsGroupsHandler = (window: BrowserWindow) => {
  if (registeredWindows.has(window)) return

  registeredWindows.add(window)

  if (!window.isDestroyed() && actionsGroups) {
    window.webContents.send('load-actions-groups', actionsGroups)
  }
}

export const unregisterActionsGroupsHandler = (window: BrowserWindow) => {
  registeredWindows.delete(window)
}

const readActionsGroupsFile = (): ExportGroupsFile | undefined => {
  if (fs.existsSync(actionsGroupsFilePath)) {
    try {
      return JSON.parse(fs.readFileSync(actionsGroupsFilePath).toString())
    } catch (e) {
      return undefined
    }
  }
  return undefined
}

export const initActionsGroupsHandlers = () => {
  // Load actions groups from file
  actionsGroups = readActionsGroupsFile()

  // Handle initialization request from renderer
  ipcMain.on('init-renderer', (event) => {
    if (actionsGroups) {
      event.reply('load-actions-groups', actionsGroups)
    }
  })

  // Handle save actions groups request
  ipcMain.on('save-actions-groups', (_, newActionsGroups) => {
    actionsGroups = newActionsGroups
    fs.writeFileSync(actionsGroupsFilePath, JSON.stringify(newActionsGroups))
    sendMessage('load-actions-groups', newActionsGroups)
  })
}
