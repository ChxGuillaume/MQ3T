import { ProgressInfo, UpdateDownloadedEvent, UpdateInfo } from 'electron-updater'
import { ConnectionsActionsFile, ConnectionsActionsGroups } from './actions'
import { IClientPublishOptions } from 'mqtt/src/lib/client'
import { MqttConnection } from './mqtt-connection'
import { IPublishPacket } from 'mqtt'

export type AppVersionCallback = (event: never, value: string) => void

export type MqttErrorCallback = (event: never, value: { clientKey: string; error: Error }) => void

export type MqttMessageCallback = (
  event: never,
  value: { clientKey: string; topic: string; message: string; packet: IPublishPacket }
) => void

export type MqttStatusCallback = (
  event: never,
  value: { clientKey: string; status: 'connected' | 'connecting' | 'disconnected' }
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
  saveActionsGroups: (actionsGroups: ConnectionsActionsGroups) => void

  handleLoadMqttConnections: (callback: MqttLoadConnectionsCallback) => void
  handleLoadActions: (callback: (event: never, value: ConnectionsActionsFile) => void) => void
  handleLoadActionsGroups: (
    callback: (event: never, value: ConnectionsActionsGroups) => void
  ) => void

  debug: (callback: (event: never, ...args: never[]) => void) => void

  handleCheckForUpdates: (callback: (event: never, value: string) => void) => void
  handleUpdateAvailable: (callback: (event: never, value: UpdateInfo) => void) => void
  handleUpdateNotAvailable: (callback: (event: never, value: UpdateInfo) => void) => void
  handleUpdateError: (callback: (event: never, value: Error) => void) => void
  handleUpdateDownloadProgress: (callback: (event: never, value: ProgressInfo) => void) => void
  handleUpdateDownloaded: (callback: (event: never, value: UpdateDownloadedEvent) => void) => void
}
