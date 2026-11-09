import { MqttConnection, MqttConnectionStatus } from '../../../types/mqtt-connection'

const STATUS_DOT: Record<MqttConnectionStatus, string> = {
  connected: 'bg-success',
  connecting: 'bg-warning',
  reconnecting: 'bg-warning',
  disconnected: 'bg-error'
}

const STATUS_LABEL: Record<MqttConnectionStatus, string> = {
  connected: 'Connected',
  connecting: 'Connecting',
  reconnecting: 'Reconnecting',
  disconnected: 'Disconnected'
}

export const statusDotClass = (status: MqttConnectionStatus) => STATUS_DOT[status]

export const statusLabel = (status: MqttConnectionStatus) => STATUS_LABEL[status]

const SLOW_LATENCY_MS = 150
const VERY_SLOW_LATENCY_MS = 500

export const latencyLabel = (latency: number) => `${latency} ms`

export const latencyClass = (latency: number) => {
  if (latency >= VERY_SLOW_LATENCY_MS) return 'text-error'
  if (latency >= SLOW_LATENCY_MS) return 'text-warning'

  return 'text-muted'
}

export const protocolVersionLabel = (connection: MqttConnection) => {
  switch (connection.protocolVersion) {
    case 5:
      return 'MQTT 5.0'
    case 3:
      return 'MQTT 3.1'
    default:
      return 'MQTT 3.1.1'
  }
}

export const hostLabel = (connection: MqttConnection) => {
  const isWebSocket = connection.protocol === 'ws' || connection.protocol === 'wss'

  return `${connection.hostname}:${connection.port}${isWebSocket ? connection.path || '' : ''}`
}
