import mqtt from 'mqtt'

export type MqttTopicSubscription = {
  topic: string
  qos: 0 | 1 | 2
}

export type MqttConnection = {
  clientKey: string
  name: string
  protocol: 'mqtt' | 'mqtts' | 'ws' | 'wss'
  protocolVersion?: mqtt.IClientOptions['protocolVersion']
  hostname: string
  path: string
  port: number
  clientId: string
  username?: string
  password?: string
  subscribedTopics: MqttTopicSubscription[]

  connectTimeout?: number
  reconnectPeriod?: number
}

export type MqttConnectionStatus = 'connected' | 'connecting' | 'reconnecting' | 'disconnected'
