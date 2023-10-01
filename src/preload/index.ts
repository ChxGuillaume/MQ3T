import {
  MqttConnectedCallback,
  MqttDisconnectedCallback,
  MqttErrorCallback,
  MqttMessageCallback
} from './types/electron-ipc-callbacks'
import { electronAPI } from '@electron-toolkit/preload'
import { contextBridge, ipcRenderer } from 'electron'

// Custom APIs for renderer
const api = {
  handlePing: (callback) => ipcRenderer.on('ping', callback),
  handleMqttError: (callback: MqttErrorCallback) => ipcRenderer.on('mqtt-error', callback),
  handleMqttMessage: (callback: MqttMessageCallback) => ipcRenderer.on('mqtt-message', callback),
  handleMqttConnected: (callback: MqttConnectedCallback) =>
    ipcRenderer.on('mqtt-connected', callback),
  handleMqttDisconnected: (callback: MqttDisconnectedCallback) =>
    ipcRenderer.on('mqtt-disconnected', callback)
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
