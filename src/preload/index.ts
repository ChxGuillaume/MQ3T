import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'

import { ElectronIpc } from '../types/electron-ipc-callbacks'

// Custom APIs for renderer
const api: ElectronIpc = {
  handleMqttError: (callback) => ipcRenderer.on('mqtt-error', callback as any),
  handleMqttMessage: (callback) => ipcRenderer.on('mqtt-message', callback as any),
  handleMqttStatus: (callback) => ipcRenderer.on('mqtt-status', callback as any),

  connectMqtt: (connection) => ipcRenderer.send('connect-mqtt', connection),
  disconnectMqtt: (clientKey) => ipcRenderer.send('disconnect-mqtt', clientKey),

  sendMqttMessage: (clientKey, topic, message, options) => {
    ipcRenderer.send('send-mqtt-message', { clientKey, topic, message, options })
  },

  initRenderer: () => ipcRenderer.send('init-renderer'),

  saveMqttConnections: (connections) => ipcRenderer.send('save-mqtt-connections', connections),
  handleLoadMqttConnections: (callback) => ipcRenderer.on('load-mqtt-connections', callback as any)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
