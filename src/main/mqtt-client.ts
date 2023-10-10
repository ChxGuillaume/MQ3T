import { IClientPublishOptions, OnMessageCallback } from 'mqtt/src/lib/client'
import { MqttConnection } from '../types/mqtt-connection'
import mqtt from 'mqtt'

export class MqttClient {
  private client: mqtt.MqttClient

  constructor(connection: MqttConnection) {
    const connectionOptions = {
      clientId: connection.clientId
    }

    this.client = mqtt.connect(
      `${connection.protocol}://${connection.hostname}:${connection.port}`,
      connectionOptions
    )
  }

  public onError(callback: (error: Error) => void) {
    this.client.on('error', callback)
  }

  public onConnect(callback: () => void) {
    this.client.on('connect', callback)
  }

  public onMessage(callback: OnMessageCallback) {
    this.client.on('message', callback)
  }

  public onDisconnect(callback: () => void) {
    this.client.on('close', callback)
  }

  public subscribe(topic: string, extras?: { qos: 0 | 1 | 2 }) {
    this.client.subscribe(topic, extras)
  }

  public publish(topic: string, message: string, options?: IClientPublishOptions) {
    this.client.publish(topic, message, options)
  }

  public disconnect() {
    this.client.end()
  }
}
