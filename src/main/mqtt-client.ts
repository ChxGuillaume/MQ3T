import { OnMessageCallback } from 'mqtt/src/lib/client'
import mqtt from 'mqtt'

export class MqttClient {
  private client: mqtt.MqttClient

  constructor() {
    this.client = mqtt.connect('mqtt://test.mosquitto.org:1883')
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

  public subscribe(topic: string) {
    this.client.subscribe(topic)
  }

  public publish(topic: string, message: string) {
    this.client.publish(topic, message)
  }

  public disconnect() {
    this.client.end()
  }
}
