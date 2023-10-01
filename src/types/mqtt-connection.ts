export type MqttConnection = {
  clientKey: string
  name: string
  protocol: 'mqtt' | 'mqtts' | 'ws' | 'wss'
  hostname: string
  port: number
  clientId: string
  username?: string
  password?: string
}
