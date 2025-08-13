import { Settings } from '../../types/electron-ipc-callbacks'
import { autoUpdater } from 'electron-updater'
import { app, ipcMain } from 'electron'
import path from 'path'
import fs from 'fs'

let settings: Settings = {}

const configFolder = path.join(app.getPath('userData'), 'config')
const settingsFilePath = path.join(configFolder, 'settings.json')

const ensureConfigFolder = () => {
  try {
    fs.mkdirSync(configFolder, { recursive: true })
  } catch (e) {
    /* empty */
  }
}

const readSettingsFromDisk = (): Settings | undefined => {
  if (!fs.existsSync(settingsFilePath)) return undefined
  try {
    const data = fs.readFileSync(settingsFilePath).toString()

    return JSON.parse(data)
  } catch (e) {
    return undefined
  }
}

const writeSettingsToDisk = (data: Settings) => {
  try {
    fs.writeFileSync(settingsFilePath, JSON.stringify(data))
  } catch (e) {
    /* empty */
  }
}

export const initSettingsStore = () => {
  ensureConfigFolder()
  const data = readSettingsFromDisk()
  if (data) settings = data
}

export const getSettings = (): Settings => {
  return settings
}

export const updateSettings = (updates: Settings) => {
  settings = { ...settings, ...updates }
  autoUpdater.allowPrerelease = settings.participateToReleaseCandidates || false

  writeSettingsToDisk(settings)
}

export const initSettingsHandlers = () => {
  initSettingsStore()

  ipcMain.on('save-settings', (_, newSettings: Settings) => {
    updateSettings(newSettings)
  })

  ipcMain.on('get-settings-sync', (event) => {
    event.returnValue = settings
  })
}
