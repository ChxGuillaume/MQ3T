import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'

import { ElectronIpc } from '../types/electron-ipc-callbacks'

const api: ElectronIpc = {
  handleMqttError: (callback) => ipcRenderer.on('mqtt-error', callback as any),
  handleMqttMessage: (callback) => ipcRenderer.on('mqtt-message', callback as any),
  handleMqttStatus: (callback) => ipcRenderer.on('mqtt-status', callback as any),

  handleRegistrationTriggered: (callback) => ipcRenderer.on('registration-triggered', callback as any),
  handleRegistrationCompleted: (callback) => ipcRenderer.on('registration-completed', callback as any),
  handleRegistrationCanceled: (callback) => ipcRenderer.on('registration-canceled', callback as any),
  cancelRegistration: () => fetch('/register/cancel', { method: 'POST' }),

  connectMqtt: (connection) => ipcRenderer.send('connect-mqtt', connection),
  disconnectMqtt: (clientKey) => ipcRenderer.send('disconnect-mqtt', clientKey),

  sendMqttMessage: (clientKey, topic, message, options) => {
    ipcRenderer.send('send-mqtt-message', { clientKey, topic, message, options })
  },

  initRenderer: () => ipcRenderer.send('init-renderer'),
  downloadUpdate: () => ipcRenderer.send('download-update'),
  checkForUpdates: () => ipcRenderer.send('check-for-updates'),
  quitAndInstallUpdate: () => ipcRenderer.send('quit-and-install-update'),
  appVersion: (callback) => ipcRenderer.on('app-version', callback as any),

  saveMqttConnections: (connections) => ipcRenderer.send('save-mqtt-connections', connections),
  handleLoadMqttConnections: (callback) => ipcRenderer.on('load-mqtt-connections', callback as any),

  importData: (fileType) => ipcRenderer.send('import-data', fileType),
  handleImportData: (callback) => ipcRenderer.on('import-data', callback as any),
  exportData: (...args) => ipcRenderer.send('export-data', ...args),
  openUrl: (url) => ipcRenderer.send('open-url', url),

  saveActions: (actions) => ipcRenderer.send('save-actions', actions),
  saveChainActions: (chainActions) => ipcRenderer.send('save-chain-actions', chainActions),
  saveActionsGroups: (actionsGroups) => ipcRenderer.send('save-actions-groups', actionsGroups),
  saveDataGraphs: (graphs) => ipcRenderer.send('save-data-graphs', graphs),
  updateDataGraph: (params) => ipcRenderer.send('update-data-graph', params),
  getDataGraphsSync: () => ipcRenderer.sendSync('get-data-graphs-sync'),
  handleLoadActions: (callback) => ipcRenderer.on('load-actions', callback as any),
  handleLoadChainActions: (callback) => ipcRenderer.on('load-chain-actions', callback as any),
  handleLoadActionsGroups: (callback) => ipcRenderer.on('load-actions-groups', callback as any),
  handleDataGraphsUpdate: (callback) => ipcRenderer.on('load-data-graphs', callback as any),
  handleDataGraphPartialUpdate: (callback) =>
    ipcRenderer.on('update-data-graph-partial', callback as any),

  debug: (callback) => ipcRenderer.on('debug', callback as any),

  handleCheckForUpdates: (callback) => ipcRenderer.on('checking-for-update', callback as any),
  handleUpdateAvailable: (callback) => ipcRenderer.on('update-available', callback as any),
  handleUpdateNotAvailable: (callback) => ipcRenderer.on('update-not-available', callback as any),
  handleUpdateError: (callback) => ipcRenderer.on('updating-error', callback as any),
  handleUpdateDownloadProgress: (callback) =>
    ipcRenderer.on('update-download-progress', callback as any),
  handleUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', callback as any),

  getGraphWindowShown: () => ipcRenderer.sendSync('get-graph-window-shown'),
  handleGraphWindowShown: (callback) =>
    ipcRenderer.on('update-graph-window-shown', callback as any),

  showGraphWindow: () => ipcRenderer.send('show-graph-window'),
  hideGraphWindow: () => ipcRenderer.send('hide-graph-window'),

  transferMqttMessages: (messages) => ipcRenderer.send('transfer-mqtt-messages', messages),
  requestMqttMessages: () => ipcRenderer.send('request-mqtt-messages'),
  handleTransferMqttMessages: (callback) => ipcRenderer.on('load-mqtt-messages', callback as any),
  handleRequestMqttMessages: (callback) => ipcRenderer.on('request-mqtt-messages', callback as any)
}

const hasAutoUpdate =
  !process.mas && !process.windowsStore && !process.env.SNAP && !process.env.FLATPAK_ID

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('platform', process.platform)
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('hasAutoUpdate', hasAutoUpdate)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.platform = process.platform
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
  // @ts-ignore (define in dts)
  window.hasAutoUpdate = hasAutoUpdate
}
