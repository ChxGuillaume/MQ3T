export type MqttErrorCallback = (event: never, value: { clientKey: string; error: Error }) => void
export type MqttMessageCallback = (
  event: never,
  value: { clientKey: string; topic: string; message: string }
) => void
export type MqttConnectedCallback = (event: never, value: { clientKey: string }) => void
export type MqttDisconnectedCallback = (event: never, value: { clientKey: string }) => void

export type ElectronIpc = {
  handlePing: () => void
  handleMqttError: (callback: MqttErrorCallback) => void
  handleMqttMessage: (callback: MqttMessageCallback) => void
  handleMqttConnected: (callback: MqttConnectedCallback) => void
  handleMqttDisconnected: (callback: MqttDisconnectedCallback) => void
}
