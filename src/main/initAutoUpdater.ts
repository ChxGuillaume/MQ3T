import { HasAutoUpdate } from './constants/hasAutoUpdate'
import { autoUpdater } from 'electron-updater'
import { is } from '@electron-toolkit/utils'
import { BrowserWindow } from 'electron'
import path from 'path'

export const initAutoUpdater = (window: BrowserWindow) => {
  if (is.dev && process.env['FORCE_DEV_UPDATE']) {
    autoUpdater.forceDevUpdateConfig = true
    autoUpdater.updateConfigPath = path.join(__dirname, '../..', 'dev-app-update.yml')
  }

  const sendMessageToRenderer = (channel: string, ...args: any[]) => {
    if (!window) return
    if (window.isDestroyed()) return

    window.webContents.send(channel, ...args)
  }

  autoUpdater.autoDownload = false

  autoUpdater.on('checking-for-update', () => {
    sendMessageToRenderer('checking-for-update')
  })

  autoUpdater.on('update-available', (info) => {
    sendMessageToRenderer('update-available', info)
  })

  autoUpdater.on('update-not-available', (info) => {
    sendMessageToRenderer('update-not-available', info)
  })

  autoUpdater.on('error', (err) => {
    sendMessageToRenderer('updating-error', err)
  })

  autoUpdater.on('download-progress', (progressObj) => {
    sendMessageToRenderer('update-download-progress', progressObj)
  })

  autoUpdater.on('update-downloaded', (info) => {
    sendMessageToRenderer('update-downloaded', info)
  })

  if (HasAutoUpdate) autoUpdater.checkForUpdates()
}
