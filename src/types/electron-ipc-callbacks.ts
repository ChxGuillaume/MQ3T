import { ConnectionsActions, ConnectionsActionsGroups } from './actions'
import { IClientPublishOptions } from 'mqtt/src/lib/client'
import { MqttConnection } from './mqtt-connection'
import { IPublishPacket } from 'mqtt'

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

  saveMqttConnections: (connections: MqttConnection[]) => void
  saveActions: (actions: ConnectionsActions) => void
  saveActionsGroups: (actionsGroups: ConnectionsActionsGroups) => void

  handleLoadMqttConnections: (callback: MqttLoadConnectionsCallback) => void
  handleLoadActions: (callback: (event: never, value: ConnectionsActions) => void) => void
  handleLoadActionsGroups: (
    callback: (event: never, value: ConnectionsActionsGroups) => void
  ) => void
}
