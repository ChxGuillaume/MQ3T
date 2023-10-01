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

export type ElectronIpc = {
  handleMqttError: (callback: MqttErrorCallback) => void
  handleMqttMessage: (callback: MqttMessageCallback) => void
  handleMqttStatus: (callback: MqttStatusCallback) => void

  connectMqtt: (connection: MqttConnection) => void
  disconnectMqtt: (clientKey: string) => void
  fetchMqttStatus: () => void
}
