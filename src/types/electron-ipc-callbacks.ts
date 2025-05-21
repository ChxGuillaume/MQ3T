import { ProgressInfo, UpdateDownloadedEvent, UpdateInfo } from 'electron-updater'
import { MqttConnection, MqttConnectionStatus } from './mqtt-connection'
import { IClientPublishOptions } from 'mqtt/src/lib/client'
import FileFilter = Electron.FileFilter
import { IPublishPacket } from 'mqtt'
import {
  ConnectionsActionsFile,
  ConnectionsChainActions,
  ConnectionsActionsGroups
} from './actions'
import { DataGraph } from './data-graph'

export type AppVersionCallback = (event: never, value: string) => void

export type MqttErrorCallback = (event: never, value: { clientKey: string; error: Error }) => void

export type MqttMessageCallback = (
  event: never,
  value: { clientKey: string; topic: string; message: string; packet: IPublishPacket }
) => void

export type MqttStatusCallback = (
  event: never,
  value: { clientKey: string; status: MqttConnectionStatus }
) => void

export type MqttLoadConnectionsCallback = (event: never, value: MqttConnection[]) => void

export type ElectronIpc = {
  handleMqttError: (callback: MqttErrorCallback) => void
  handleMqttMessage: (callback: MqttMessageCallback) => void
  handleMqttStatus: (callback: MqttStatusCallback) => void

  connectMqtt: (connection: MqttConnection) => void
  disconnectMqtt: (clientKey: string) => void

  sendMqttMessage: (
    clientKey: string,
    topic: string,
    message: string,
    options?: IClientPublishOptions
  ) => void

  initRenderer: () => void
  downloadUpdate: () => void
  checkForUpdates: () => void
  quitAndInstallUpdate: () => void
  appVersion: (callback: AppVersionCallback) => void

  saveMqttConnections: (connections: MqttConnection[]) => void
  saveActions: (actions: ConnectionsActionsFile) => void
  saveChainActions: (chainActions: ConnectionsChainActions) => void
  saveActionsGroups: (actionsGroups: ConnectionsActionsGroups) => void
  saveDataGraphs: (graphs: DataGraph[]) => void
  updateDataGraph: (params: { id: string; updates: Partial<DataGraph> }) => void
  getDataGraphsSync: () => DataGraph[]

  importData: (fileFilter?: FileFilter[]) => void
  handleImportData: (callback: (event: never, value: string) => void) => void
  exportData: (fileName: string, data: string | Buffer, fileFilter?: FileFilter[]) => void
  openUrl: (url: string) => void

  handleLoadMqttConnections: (callback: MqttLoadConnectionsCallback) => void
  handleLoadActions: (callback: (event: never, value: ConnectionsActionsFile) => void) => void
  handleLoadChainActions: (callback: (event: never, value: ConnectionsChainActions) => void) => void
  handleLoadActionsGroups: (
    callback: (event: never, value: ConnectionsActionsGroups) => void
  ) => void
  handleDataGraphsUpdate: (callback: (event: never, value: DataGraph[]) => void) => void
  handleDataGraphPartialUpdate: (
    callback: (event: never, value: { id: string; updates: Partial<DataGraph> }) => void
  ) => void

  debug: (callback: (event: never, ...args: never[]) => void) => void

  handleCheckForUpdates: (callback: (event: never, value: string) => void) => void
  handleUpdateAvailable: (callback: (event: never, value: UpdateInfo) => void) => void
  handleUpdateNotAvailable: (callback: (event: never, value: UpdateInfo) => void) => void
  handleUpdateError: (callback: (event: never, value: Error) => void) => void
  handleUpdateDownloadProgress: (callback: (event: never, value: ProgressInfo) => void) => void
  handleUpdateDownloaded: (callback: (event: never, value: UpdateDownloadedEvent) => void) => void

  getGraphWindowShown: () => boolean
  handleGraphWindowShown: (callback: (event: never, value: boolean) => void) => void

  showGraphWindow: () => void
  hideGraphWindow: () => void
}
