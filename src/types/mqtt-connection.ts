import mqtt from 'mqtt'

export type MqttTopicSubscription = {
  topic: string
  qos: 0 | 1 | 2
}

export type UserProperties = { key: string; value: string }[]

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
  clean?: boolean

  properties?: {
    sessionExpiryInterval?: number
    receiveMaximum?: number
    maximumPacketSize?: number

    requestResponseInformation: boolean
    requestProblemInformation: boolean

    userProperties: UserProperties
  }

  lastWill?: {
    topic: string
    qos: 0 | 1 | 2
    retain: boolean
    payload: string
  }
}

export type MqttConnectionStatus = 'connected' | 'connecting' | 'reconnecting' | 'disconnected'
