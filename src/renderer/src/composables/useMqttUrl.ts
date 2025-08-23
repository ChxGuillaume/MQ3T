import { MqttConnection } from '../../../types/mqtt-connection'

export function useMqttUrl() {
  const formatMqttUrl = (connection: MqttConnection): string => {
    const path = ['mqtt', 'mqtts'].includes(connection.protocol) ? '' : connection.path || ''
    return `${connection.protocol}://${connection.hostname}:${connection.port}${path}`
  }

  return {
    formatMqttUrl
  }
}
