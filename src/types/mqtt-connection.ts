export type MqttTopicSubscription = {
  topic: string
  qos: 0 | 1 | 2
}

export type MqttConnection = {
  clientKey: string
  name: string
  protocol: 'mqtt' | 'mqtts' | 'ws' | 'wss'
  hostname: string
  path: string
  port: number
  clientId: string
  username?: string
  password?: string
  subscribedTopics: MqttTopicSubscription[]
}
